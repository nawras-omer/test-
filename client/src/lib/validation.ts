/**
 * Client-side mirrors of the server rules — same *codes*, so the messages are
 * translated the same way whether the error came from here or from the API.
 */
import type { ApiErrorCode } from '@/types'

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
