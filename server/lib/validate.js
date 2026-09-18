/**
 * Server-side validation. Errors are returned as *codes* (not sentences) so the
 * client can render them in the active language (en / ar / ckb).
 */
import { DEFAULT_GOALS } from './store.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const MIN_PASSWORD_LENGTH = 8
export const MAX_NAME_LENGTH = 60
export const MAX_FOOD_NAME_LENGTH = 80
export const MAX_SERVING_LENGTH = 40
export const MAX_CALORIES = 20000
export const MAX_MACRO_GRAMS = 2000
export const MAX_ENTRIES_PER_DAY = 100

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
/** How far back a date may be logged; +1 day absorbs timezone skew. */
const MAX_DAYS_PAST = 730
const MAX_DAYS_FUTURE = 1

export function normaliseEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

/* -------------------------------------------------------------------- auth */

export function validateSignup({ name, email, password, confirmPassword } = {}) {
  const errors = {}

  const cleanName = String(name ?? '').trim()
  if (!cleanName) errors.name = 'NAME_REQUIRED'
  else if (cleanName.length < 2) errors.name = 'NAME_TOO_SHORT'
  else if (cleanName.length > MAX_NAME_LENGTH) errors.name = 'NAME_TOO_LONG'

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

/* -------------------------------------------------------------- preferences */

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

/* -------------------------------------------------------------------- goals */

const GOAL_RULES = [
  { key: 'calories', min: 800, max: MAX_CALORIES },
  { key: 'protein', min: 0, max: MAX_MACRO_GRAMS },
  { key: 'carbs', min: 0, max: MAX_MACRO_GRAMS },
  { key: 'fat', min: 0, max: MAX_MACRO_GRAMS },
]

/** Validates a partial or complete goals update; returns null when nothing valid. */
export function validateGoals(input = {}) {
  const errors = {}
  const value = {}

  for (const rule of GOAL_RULES) {
    if (!(rule.key in input)) continue
    const raw = input[rule.key]
    if (raw === '' || raw === null || raw === undefined) {
      errors[rule.key] = 'GOAL_REQUIRED'
      continue
    }
    const number = Number(raw)
    if (!Number.isFinite(number)) errors[rule.key] = 'GOAL_INVALID'
    else if (number < rule.min || number > rule.max) errors[rule.key] = 'GOAL_RANGE'
    else value[rule.key] = rule.key === 'calories' ? Math.round(number) : Math.round(number * 10) / 10
  }

  return { ok: Object.keys(errors).length === 0, errors, value }
}

export function defaultGoals() {
  return { ...DEFAULT_GOALS }
}

/* ------------------------------------------------------------- food entries */

/** Coerces a numeric field; returns null when it is absent/blank. */
function toNumber(raw) {
  if (raw === '' || raw === null || raw === undefined) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : Number.NaN
}

function isRealDate(key) {
  if (!DATE_RE.test(key)) return false
  const [year, month, day] = key.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

function daysBetween(fromKey, toKey) {
  const from = Date.parse(`${fromKey}T00:00:00Z`)
  const to = Date.parse(`${toKey}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

export function utcTodayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/**
 * Validates a new food-log entry.
 * `name` and `calories` are required; macros default to 0 and are optional so
 * people can log quickly and refine later.
 */
export function validateFoodEntry(input = {}) {
  const errors = {}
  const value = {}

  const name = String(input.name ?? '').trim()
  if (!name) errors.name = 'FOOD_NAME_REQUIRED'
  else if (name.length > MAX_FOOD_NAME_LENGTH) errors.name = 'FOOD_NAME_TOO_LONG'
  else value.name = name

  const servingSize = String(input.servingSize ?? '').trim()
  if (servingSize.length > MAX_SERVING_LENGTH) errors.servingSize = 'SERVING_TOO_LONG'
  else value.servingSize = servingSize

  const calories = toNumber(input.calories)
  if (calories === null) errors.calories = 'CALORIES_REQUIRED'
  else if (Number.isNaN(calories)) errors.calories = 'CALORIES_INVALID'
  else if (calories < 0 || calories > MAX_CALORIES) errors.calories = 'CALORIES_RANGE'
  else value.calories = Math.round(calories)

  for (const macro of ['protein', 'carbs', 'fat']) {
    const amount = toNumber(input[macro])
    if (amount === null) {
      value[macro] = 0
      continue
    }
    if (Number.isNaN(amount)) errors[macro] = 'MACRO_INVALID'
    else if (amount < 0 || amount > MAX_MACRO_GRAMS) errors[macro] = 'MACRO_RANGE'
    else value[macro] = Math.round(amount * 10) / 10
  }

  const mealType = String(input.mealType ?? '').trim().toLowerCase()
  if (!mealType) errors.mealType = 'MEAL_TYPE_REQUIRED'
  else if (!MEAL_TYPES.includes(mealType)) errors.mealType = 'MEAL_TYPE_INVALID'
  else value.mealType = mealType

  const date = String(input.date ?? '').trim()
  if (!date) errors.date = 'DATE_REQUIRED'
  else if (!isRealDate(date)) errors.date = 'DATE_INVALID'
  else {
    const offset = daysBetween(utcTodayKey(), date)
    if (offset > MAX_DAYS_FUTURE) errors.date = 'DATE_IN_FUTURE'
    else if (offset < -MAX_DAYS_PAST) errors.date = 'DATE_TOO_OLD'
    else value.date = date
  }

  return { ok: Object.keys(errors).length === 0, errors, value }
}

/** Query-string window for GET /api/entries (both bounds optional). */
export function validateEntryQuery({ from, to, limit } = {}) {
  const errors = {}
  const value = {}

  if (from !== undefined && from !== '') {
    if (!isRealDate(String(from))) errors.from = 'DATE_INVALID'
    else value.from = String(from)
  }
  if (to !== undefined && to !== '') {
    if (!isRealDate(String(to))) errors.to = 'DATE_INVALID'
    else value.to = String(to)
  }
  if (limit !== undefined && limit !== '') {
    const parsed = Number(limit)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 500) errors.limit = 'LIMIT_INVALID'
    else value.limit = parsed
  }

  return { ok: Object.keys(errors).length === 0, errors, value }
}
