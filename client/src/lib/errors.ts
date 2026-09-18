/**
 * Translates API error *codes* into localised sentences.
 * Every code returned by the server has an `errors.<CODE>` key in all three
 * dictionaries, so no English ever leaks into the Arabic/Kurdish UI.
 */
import type { TranslationKey } from '@/i18n'
import { ApiError } from './api'

const KNOWN_CODES = [
  'NETWORK_ERROR',
  'VALIDATION_FAILED',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'RATE_LIMITED',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'SERVER_ERROR',
  'NAME_REQUIRED',
  'NAME_TOO_SHORT',
  'NAME_TOO_LONG',
  'EMAIL_REQUIRED',
  'EMAIL_INVALID',
  'PASSWORD_REQUIRED',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_TOO_WEAK',
  'PASSWORD_MISMATCH',
  /* food entries */
  'FOOD_NAME_REQUIRED',
  'FOOD_NAME_TOO_LONG',
  'SERVING_TOO_LONG',
  'CALORIES_REQUIRED',
  'CALORIES_INVALID',
  'CALORIES_RANGE',
  'MACRO_INVALID',
  'MACRO_RANGE',
  'MEAL_TYPE_REQUIRED',
  'MEAL_TYPE_INVALID',
  'DATE_REQUIRED',
  'DATE_INVALID',
  'DATE_IN_FUTURE',
  'DATE_TOO_OLD',
  'ENTRY_NOT_FOUND',
  'ENTRY_LIMIT_REACHED',
  /* goals */
  'GOAL_REQUIRED',
  'GOAL_INVALID',
  'GOAL_RANGE',
] as const

type KnownCode = (typeof KNOWN_CODES)[number]

const known = new Set<string>(KNOWN_CODES)

/** Maps a code (from the API *or* from client-side validation) to an i18n key. */
export function errorKey(code: string | undefined | null): TranslationKey {
  if (code && known.has(code)) return `errors.${code as KnownCode}` as TranslationKey
  return 'errors.UNKNOWN_ERROR'
}

type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string

/** Localised message for anything thrown by the API layer. */
export function messageFor(t: Translator, error: unknown): string {
  if (error instanceof ApiError) return t(errorKey(error.code))
  return t('errors.UNKNOWN_ERROR')
}

/** Localised per-field errors: `{ email: 'That email is already registered.' }`. */
export function fieldMessages(t: Translator, error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  const result: Record<string, string> = {}
  for (const [field, code] of Object.entries(error.fields)) {
    if (code) result[field] = t(errorKey(code))
  }
  return result
}

export { ApiError }
