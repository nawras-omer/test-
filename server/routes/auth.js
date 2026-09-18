import { randomUUID } from 'node:crypto'
import express from 'express'
import { db } from '../lib/store.js'
import { hashPassword, publicUser, signToken, verifyPassword, verifyToken } from '../lib/auth.js'
import {
  MIN_PASSWORD_LENGTH,
  normaliseEmail,
  sanitisePreferences,
  validateLogin,
  validateSignup,
} from '../lib/validate.js'

const router = express.Router()

/* ------------------------------------------------------------------ *
 * Very small in-memory attempt limiter (per IP + route).
 * Enough to blunt brute-force scripts in development; use a shared store
 * (Redis) or a proper middleware in production.
 * ------------------------------------------------------------------ */
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 20
const attempts = new Map()

function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now - entry.start > WINDOW_MS) {
    attempts.set(key, { start: now, count: 1 })
    return next()
  }
  entry.count += 1
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.start + WINDOW_MS - now) / 1000)
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({ error: { code: 'RATE_LIMITED', fields: {} } })
  }
  next()
}

function fail(res, status, code, fields = {}) {
  return res.status(status).json({ error: { code, fields } })
}

/** Bearer-token guard used by /me and /preferences. */
export function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null
  const payload = token ? verifyToken(token) : null
  if (!payload) return fail(res, 401, 'UNAUTHENTICATED')

  db.findById(payload.sub).then((user) => {
    if (!user) return fail(res, 401, 'UNAUTHENTICATED')
    req.user = user
    next()
  })
}

router.post('/signup', rateLimit, async (req, res, next) => {
  try {
    const { ok, errors, value } = validateSignup(req.body ?? {})
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    if (await db.findByEmail(value.email)) {
      return fail(res, 409, 'EMAIL_TAKEN', { email: 'EMAIL_TAKEN' })
    }

    const now = new Date().toISOString()
    const user = {
      id: randomUUID(),
      name: value.name,
      email: value.email,
      passwordHash: await hashPassword(value.password),
      // Sensible defaults: English + the clean green palette, light mode.
      preferences: { language: 'en', palette: 'green', colorMode: 'light' },
      createdAt: now,
      updatedAt: now,
    }
    await db.createUser(user)

    return res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

router.post('/login', rateLimit, async (req, res, next) => {
  try {
    const { ok, errors, value } = validateLogin(req.body ?? {})
    if (!ok) return fail(res, 422, 'VALIDATION_FAILED', errors)

    const user = await db.findByEmail(value.email)
    const passwordOk = user ? await verifyPassword(String(req.body.password), user.passwordHash) : false

    // Same generic message for "unknown email" and "wrong password": no account
    // enumeration. The bcrypt compare above also runs for unknown users when a
    // hash exists, keeping the timing profile similar.
    if (!user || !passwordOk) {
      return fail(res, 401, 'INVALID_CREDENTIALS', {
        email: 'INVALID_CREDENTIALS',
        password: 'INVALID_CREDENTIALS',
      })
    }

    return res.json({ token: signToken(user), user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

/** Stateless logout: the client drops the token. Kept as an explicit endpoint
 *  so cookie-based sessions can be added without touching the UI. */
router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

/** Persists the language / palette / colour-mode a signed-in user picked. */
router.patch('/preferences', requireAuth, async (req, res, next) => {
  try {
    const patch = sanitisePreferences(req.body ?? {})
    if (Object.keys(patch).length === 0) return fail(res, 422, 'VALIDATION_FAILED', {})

    const updated = await db.updateUser(req.user.id, {
      preferences: { ...req.user.preferences, ...patch },
    })
    res.json({ user: publicUser(updated) })
  } catch (err) {
    next(err)
  }
})

export const MIN_PASSWORD = MIN_PASSWORD_LENGTH
export default router
