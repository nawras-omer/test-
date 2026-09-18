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

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  preferences: UserPreferences
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
  | 'NAME_REQUIRED'
  | 'NAME_TOO_SHORT'
  | 'NAME_TOO_LONG'
  | 'EMAIL_REQUIRED'
  | 'EMAIL_INVALID'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_WEAK'
  | 'PASSWORD_MISMATCH'
  | 'UNKNOWN_ERROR'
