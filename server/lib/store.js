/**
 * Tiny JSON-file persistence layer.
 *
 * This is intentionally dependency-free so the project runs anywhere. It keeps
 * the whole dataset in memory and writes it back atomically (tmp file + rename),
 * serialising writes through a promise chain so concurrent requests cannot
 * interleave. Swap this module for Postgres/Prisma/SQLite later — nothing else
 * in the app touches the storage format directly.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'users.json')

export const DEFAULT_GOALS = { calories: 2150, protein: 140, carbs: 240, fat: 70 }
export const DEFAULT_PREFERENCES = { language: 'en', palette: 'green', colorMode: 'light' }

/**
 * Optional body metrics. They power the goal calculator (Mifflin–St Jeor) and
 * stay null until the user fills them in — nothing in the app requires them.
 */
export const DEFAULT_PROFILE = {
  sex: null,
  age: null,
  heightCm: null,
  weightKg: null,
  activity: 'moderate',
  targetWeightKg: null,
}

/** How many chat messages are kept per user (oldest are dropped). */
export const MAX_CHAT_MESSAGES = 200

const EMPTY_DB = { version: 4, users: [], entries: [], customFoods: [], chatMessages: [] }

let cache = null
let writeChain = Promise.resolve()

/** Backfills fields added after a record was first written. */
function normaliseUser(user) {
  return {
    ...user,
    preferences: { ...DEFAULT_PREFERENCES, ...(user.preferences ?? {}) },
    goals: { ...DEFAULT_GOALS, ...(user.goals ?? {}) },
    profile: { ...DEFAULT_PROFILE, ...(user.profile ?? {}) },
  }
}

function normaliseMessage(message) {
  return {
    text: '',
    kind: 'text',
    data: null,
    ...message,
  }
}

/** Personal-library rows: only the fields the UI creates. */
function normaliseCustomFood(food) {
  return {
    servingSize: '',
    protein: 0,
    carbs: 0,
    fat: 0,
    ...food,
  }
}

function normaliseEntry(entry) {
  return {
    servingSize: '',
    protein: 0,
    carbs: 0,
    fat: 0,
    ...entry,
  }
}

async function load() {
  if (cache) return cache
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    cache = {
      version: EMPTY_DB.version,
      users: (Array.isArray(parsed.users) ? parsed.users : []).map(normaliseUser),
      entries: (Array.isArray(parsed.entries) ? parsed.entries : []).map(normaliseEntry),
      customFoods: (Array.isArray(parsed.customFoods) ? parsed.customFoods : []).map(normaliseCustomFood),
      chatMessages: (Array.isArray(parsed.chatMessages) ? parsed.chatMessages : []).map(normaliseMessage),
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[store] could not read %s (%s) — starting from an empty dataset', DB_FILE, err.message)
    }
    cache = structuredClone(EMPTY_DB)
  }
  return cache
}

async function flush() {
  const db = await load()
  const snapshot = JSON.stringify(db, null, 2)
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const tmp = `${DB_FILE}.${process.pid}.tmp`
    await fs.writeFile(tmp, snapshot, 'utf8')
    await fs.rename(tmp, DB_FILE)
  })
  return writeChain
}

/** Newest first: by logged date, then by when it was recorded. */
function byRecency(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return String(b.createdAt).localeCompare(String(a.createdAt))
}

export const db = {
  /* ------------------------------------------------------------------ users */
  async allUsers() {
    const data = await load()
    return [...data.users]
  },

  async findUser(predicate) {
    const users = await db.allUsers()
    return users.find(predicate) ?? null
  },

  async findByEmail(email) {
    const needle = String(email).trim().toLowerCase()
    return db.findUser((u) => u.email === needle)
  },

  async findById(id) {
    return db.findUser((u) => u.id === id)
  },

  async createUser(user) {
    const data = await load()
    data.users.push(normaliseUser(user))
    await flush()
    return data.users[data.users.length - 1]
  },

  async updateUser(id, patch) {
    const data = await load()
    const index = data.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    data.users[index] = normaliseUser({ ...data.users[index], ...patch, updatedAt: new Date().toISOString() })
    await flush()
    return data.users[index]
  },

  /** Used by the seeder — no-op when the email already exists. */
  async ensureUser(user) {
    const existing = await db.findByEmail(user.email)
    if (existing) return existing
    return db.createUser(user)
  },

  /* ---------------------------------------------------------------- entries */
  /** Food-log entries for one user, optionally limited to a date window. */
  async listEntries(userId, { from, to, limit } = {}) {
    const data = await load()
    let rows = data.entries.filter((entry) => entry.userId === userId)
    if (from) rows = rows.filter((entry) => entry.date >= from)
    if (to) rows = rows.filter((entry) => entry.date <= to)
    rows.sort(byRecency)
    if (Number.isInteger(limit) && limit >= 0) rows = rows.slice(0, limit)
    return rows.map((entry) => ({ ...entry }))
  },

  async countEntries(userId, date) {
    const data = await load()
    return data.entries.filter((entry) => entry.userId === userId && entry.date === date).length
  },

  async findEntry(userId, id) {
    const data = await load()
    const found = data.entries.find((entry) => entry.userId === userId && entry.id === id)
    return found ? { ...found } : null
  },

  async createEntry(entry) {
    const data = await load()
    data.entries.push(normaliseEntry(entry))
    await flush()
    return { ...entry }
  },

  /* ---------------------------------------------------------- custom foods */
  /** A user's personal library, newest first. */
  async listCustomFoods(userId) {
    const data = await load()
    return data.customFoods
      .filter((food) => food.userId === userId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((food) => ({ ...food }))
  },

  async countCustomFoods(userId) {
    const data = await load()
    return data.customFoods.filter((food) => food.userId === userId).length
  },

  async findCustomFood(userId, id) {
    const data = await load()
    const found = data.customFoods.find((food) => food.userId === userId && food.id === id)
    return found ? { ...found } : null
  },

  /** Case-insensitive lookup used to reject duplicates in one person's library. */
  async findCustomFoodByName(userId, name) {
    const needle = String(name).trim().toLowerCase()
    const data = await load()
    const found = data.customFoods.find(
      (food) => food.userId === userId && String(food.name).trim().toLowerCase() === needle,
    )
    return found ? { ...found } : null
  },

  async createCustomFood(food) {
    const data = await load()
    data.customFoods.push(normaliseCustomFood(food))
    await flush()
    return { ...food }
  },

  async deleteCustomFood(userId, id) {
    const data = await load()
    const index = data.customFoods.findIndex((food) => food.userId === userId && food.id === id)
    if (index === -1) return null
    const [removed] = data.customFoods.splice(index, 1)
    await flush()
    return removed
  },

  /* --------------------------------------------------------------- chat -- */
  /** Oldest → newest, so the transcript reads top-down. */
  async listMessages(userId, limit = MAX_CHAT_MESSAGES) {
    const data = await load()
    const rows = data.chatMessages.filter((message) => message.userId === userId)
    const trimmed = Number.isInteger(limit) && limit > 0 ? rows.slice(-limit) : rows
    return trimmed.map((message) => ({ ...message }))
  },

  async createMessage(message) {
    const data = await load()
    data.chatMessages.push(normaliseMessage(message))
    const own = data.chatMessages.filter((row) => row.userId === message.userId)
    if (own.length > MAX_CHAT_MESSAGES) {
      const excess = new Set(own.slice(0, own.length - MAX_CHAT_MESSAGES).map((row) => row.id))
      data.chatMessages = data.chatMessages.filter((row) => !excess.has(row.id))
    }
    await flush()
    return { ...message }
  },

  async clearMessages(userId) {
    const data = await load()
    const before = data.chatMessages.length
    data.chatMessages = data.chatMessages.filter((message) => message.userId !== userId)
    await flush()
    return before - data.chatMessages.length
  },

  async deleteEntry(userId, id) {
    const data = await load()
    const index = data.entries.findIndex((entry) => entry.userId === userId && entry.id === id)
    if (index === -1) return null
    const [removed] = data.entries.splice(index, 1)
    await flush()
    return removed
  },
}

export const storeFile = DB_FILE
