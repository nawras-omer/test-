/**
 * Client-side mirrors of the server rules — same *codes*, so the messages are
 * translated the same way whether the error came from here or from the API.
 */
import type { ApiErrorCode } from '@/types'
import { todayKey } from './food'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
export const MIN_PASSWORD_LENGTH = 8

type FieldErrors = Record<string, ApiErrorCode>

export function validateLogin(values: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {}
  const email = values.email.trim()
  if (!email) errors.email = 'EMAIL_REQUIRED'
  else if (!EMAIL_RE.test(email)) errors.email = 'EMAIL_INVALID'
  if (!values.password) errors.password = 'PASSWORD_REQUIRED'
  return errors
}

export function validateSignup(values: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): FieldErrors {
  const errors: FieldErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()

  if (!name) errors.name = 'NAME_REQUIRED'
  else if (name.length < 2) errors.name = 'NAME_TOO_SHORT'
  else if (name.length > 60) errors.name = 'NAME_TOO_LONG'

  if (!email) errors.email = 'EMAIL_REQUIRED'
  else if (!EMAIL_RE.test(email)) errors.email = 'EMAIL_INVALID'

  if (!values.password) errors.password = 'PASSWORD_REQUIRED'
  else if (values.password.length < MIN_PASSWORD_LENGTH) errors.password = 'PASSWORD_TOO_SHORT'
  else if (!/[a-zA-Z]/.test(values.password) || !/[0-9]/.test(values.password))
    errors.password = 'PASSWORD_TOO_WEAK'

  if (values.confirmPassword !== values.password) errors.confirmPassword = 'PASSWORD_MISMATCH'

  return errors
}

/* ------------------------------------------------------------- food entry */

export const MAX_FOOD_NAME_LENGTH = 80
export const MAX_SERVING_LENGTH = 40
export const MAX_CALORIES = 20000
export const MAX_MACRO_GRAMS = 2000

export interface FoodEntryFormValues {
  name: string
  servingSize: string
  calories: string
  protein: string
  carbs: string
  fat: string
  mealType: string
  date: string
}

/**
 * Same rules (and same error codes) as the server, so a field shows the same
 * localised message whether the problem was caught here or by the API.
 */
export function validateFoodEntry(values: FoodEntryFormValues, todayIso = todayKey()): FieldErrors {
  const errors: FieldErrors = {}

  const name = values.name.trim()
  if (!name) errors.name = 'FOOD_NAME_REQUIRED'
  else if (name.length > MAX_FOOD_NAME_LENGTH) errors.name = 'FOOD_NAME_TOO_LONG'

  if (values.servingSize.trim().length > MAX_SERVING_LENGTH) errors.servingSize = 'SERVING_TOO_LONG'

  const caloriesRaw = values.calories.trim()
  if (!caloriesRaw) {
    errors.calories = 'CALORIES_REQUIRED'
  } else {
    const calories = Number(caloriesRaw)
    if (!Number.isFinite(calories)) errors.calories = 'CALORIES_INVALID'
    else if (calories < 0 || calories > MAX_CALORIES) errors.calories = 'CALORIES_RANGE'
  }

  for (const macro of ['protein', 'carbs', 'fat'] as const) {
    const raw = values[macro].trim()
    if (!raw) continue
    const amount = Number(raw)
    if (!Number.isFinite(amount)) errors[macro] = 'MACRO_INVALID'
    else if (amount < 0 || amount > MAX_MACRO_GRAMS) errors[macro] = 'MACRO_RANGE'
  }

  if (!values.mealType) errors.mealType = 'MEAL_TYPE_REQUIRED'

  const date = values.date.trim()
  if (!date) errors.date = 'DATE_REQUIRED'
  else if (date > todayIso) errors.date = 'DATE_IN_FUTURE'

  return errors
}
