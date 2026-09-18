/**
 * Password hashing + JWT helpers.
 *
 * NOTE (production checklist): tokens are returned in the JSON payload and kept
 * in localStorage by the client. For a hardened deployment, move the token into
 * an httpOnly + Secure + SameSite=Lax cookie, add refresh-token rotation and
 * CSRF protection. The rest of the app only depends on `authApi` in
 * `client/src/lib/api.ts`, so that switch is a single-file change.
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10)
const TOKEN_TTL = process.env.TOKEN_TTL ?? '7d'

export const JWT_SECRET =
  process.env.JWT_SECRET ?? 'kalori-dev-secret-change-me-before-deploying-anything'

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set — using an insecure development secret.')
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

/** Strips secrets before a user record crosses the network. */
export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    preferences: user.preferences,
  }
}
