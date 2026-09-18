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

const EMPTY_DB = { version: 2, users: [], entries: [] }

let cache = null
let writeChain = Promise.resolve()

/** Backfills fields added after a record was first written. */
function normaliseUser(user) {
  return {
    ...user,
    preferences: { ...DEFAULT_PREFERENCES, ...(user.preferences ?? {}) },
    goals: { ...DEFAULT_GOALS, ...(user.goals ?? {}) },
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
