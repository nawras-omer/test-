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

const EMPTY_DB = { version: 1, users: [] }

let cache = null
let writeChain = Promise.resolve()

async function load() {
  if (cache) return cache
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    cache = { ...EMPTY_DB, ...parsed, users: Array.isArray(parsed.users) ? parsed.users : [] }
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

export const db = {
  /** Returns a shallow copy of every user record. */
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
    data.users.push(user)
    await flush()
    return user
  },

  async updateUser(id, patch) {
    const data = await load()
    const index = data.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    data.users[index] = { ...data.users[index], ...patch, updatedAt: new Date().toISOString() }
    await flush()
    return data.users[index]
  },

  /** Used by the seeder — no-op when the email already exists. */
  async ensureUser(user) {
    const existing = await db.findByEmail(user.email)
    if (existing) return existing
    return db.createUser(user)
  },
}

export const storeFile = DB_FILE
