/** Shared domain types — the single place both the UI and the API agree on. */

export type Locale = 'en' | 'ar' | 'ckb'

/** Sorani Kurdish is written right-to-left, like Arabic. */
export const RTL_LOCALES: Locale[] = ['ar', 'ckb']

export type Palette = 'green' | 'blue' | 'purple' | 'warm'
export type ColorMode = 'light' | 'dark'

export interface UserPreferences {
  language: Locale
  palette: Palette
  colorMode: ColorMode
}

/** Daily targets the dashboard measures against. */
export interface UserGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  preferences: UserPreferences
  goals: UserGoals
}

export interface AuthResponse {
  token: string
  user: User
}

export interface SignupInput {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

export interface LoginInput {
  email: string
  password: string
}

/* ------------------------------------------------------------------ diary -- */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** A logged food. `date` is the user's local calendar day (YYYY-MM-DD). */
export interface FoodEntry {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: MealType
  date: string
  createdAt: string
  updatedAt: string
}

/** Payload accepted by POST /api/entries (numbers arrive from form inputs). */
export interface FoodEntryInput {
  name: string
  servingSize?: string
  calories: number | string
  protein?: number | string
  carbs?: number | string
  fat?: number | string
  mealType: MealType
  date: string
}

export interface EntryTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  count: number
}

export interface DayTotals {
  date: string
  calories: number
}

/** Validation/business error codes returned by the API (translated client-side). */
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'VALIDATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'RATE_LIMITED'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR'
  /* auth fields */
  | 'NAME_REQUIRED'
  | 'NAME_TOO_SHORT'
  | 'NAME_TOO_LONG'
  | 'EMAIL_REQUIRED'
  | 'EMAIL_INVALID'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_WEAK'
  | 'PASSWORD_MISMATCH'
  /* food entries */
  | 'FOOD_NAME_REQUIRED'
  | 'FOOD_NAME_TOO_LONG'
  | 'SERVING_TOO_LONG'
  | 'CALORIES_REQUIRED'
  | 'CALORIES_INVALID'
  | 'CALORIES_RANGE'
  | 'MACRO_INVALID'
  | 'MACRO_RANGE'
  | 'MEAL_TYPE_REQUIRED'
  | 'MEAL_TYPE_INVALID'
  | 'DATE_REQUIRED'
  | 'DATE_INVALID'
  | 'DATE_IN_FUTURE'
  | 'DATE_TOO_OLD'
  | 'ENTRY_NOT_FOUND'
  | 'ENTRY_LIMIT_REACHED'
  /* goals */
  | 'GOAL_REQUIRED'
  | 'GOAL_INVALID'
  | 'GOAL_RANGE'
