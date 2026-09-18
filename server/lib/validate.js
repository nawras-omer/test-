/**
 * Server-side validation. Errors are returned as *codes* (not sentences) so the
 * client can render them in the active language (en / ar / ckb).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
export const MIN_PASSWORD_LENGTH = 8

export function normaliseEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function validateSignup({ name, email, password, confirmPassword } = {}) {
  const errors = {}

  const cleanName = String(name ?? '').trim()
  if (!cleanName) errors.name = 'NAME_REQUIRED'
  else if (cleanName.length < 2) errors.name = 'NAME_TOO_SHORT'
  else if (cleanName.length > 60) errors.name = 'NAME_TOO_LONG'

  const cleanEmail = normaliseEmail(email)
  if (!cleanEmail) errors.email = 'EMAIL_REQUIRED'
  else if (!EMAIL_RE.test(cleanEmail)) errors.email = 'EMAIL_INVALID'

  const pw = String(password ?? '')
  if (!pw) errors.password = 'PASSWORD_REQUIRED'
  else if (pw.length < MIN_PASSWORD_LENGTH) errors.password = 'PASSWORD_TOO_SHORT'
  else if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) errors.password = 'PASSWORD_TOO_WEAK'

  if (confirmPassword !== undefined && confirmPassword !== pw) {
    errors.confirmPassword = 'PASSWORD_MISMATCH'
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { name: cleanName, email: cleanEmail, password: pw },
  }
}

export function validateLogin({ email, password } = {}) {
  const errors = {}
  const cleanEmail = normaliseEmail(email)
  if (!cleanEmail) errors.email = 'EMAIL_REQUIRED'
  else if (!EMAIL_RE.test(cleanEmail)) errors.email = 'EMAIL_INVALID'
  if (!password) errors.password = 'PASSWORD_REQUIRED'

  return { ok: Object.keys(errors).length === 0, errors, value: { email: cleanEmail } }
}

const LANGUAGES = new Set(['en', 'ar', 'ckb'])
const PALETTES = new Set(['green', 'blue', 'purple', 'warm'])
const MODES = new Set(['light', 'dark'])

export function sanitisePreferences(input = {}) {
  const prefs = {}
  if (LANGUAGES.has(input.language)) prefs.language = input.language
  if (PALETTES.has(input.palette)) prefs.palette = input.palette
  if (MODES.has(input.colorMode)) prefs.colorMode = input.colorMode
  return prefs
}
