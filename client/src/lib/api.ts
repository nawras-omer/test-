/**
 * Thin typed wrapper around the auth API.
 *
 * Requests are always relative (`/api/...`), so the browser talks to whatever
 * origin served the app and the dev server / reverse proxy forwards them to the
 * Express API. No CORS juggling in the client, and no localhost hard-coding.
 */
import type {
  ApiErrorCode,
  AuthResponse,
  LoginInput,
  SignupInput,
  User,
  UserPreferences,
} from '@/types'

const TOKEN_KEY = 'kalori.auth.token'

/**
 * "Keep me signed in" → localStorage (survives restarts).
 * Unchecked → sessionStorage (cleared when the tab closes).
 */
export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string | null, remember = true): void {
  try {
    if (!token) {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
      return
    }
    const target = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    other.removeItem(TOKEN_KEY)
    target.setItem(TOKEN_KEY, token)
  } catch {
    /* private mode / storage disabled — the session simply won't persist */
  }
}

export class ApiError extends Error {
  readonly code: ApiErrorCode | string
  readonly status: number
  /** field name -> error code, used to attach messages to inputs */
  readonly fields: Record<string, string>

  constructor(code: ApiErrorCode | string, status: number, fields: Record<string, string> = {}) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, signal } = options
  const headers: Record<string, string> = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getStoredToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new ApiError('NETWORK_ERROR', 0)
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const code = (payload as { error?: { code?: string } } | null)?.error?.code ?? fallbackCode(response.status)
    const fields = (payload as { error?: { fields?: Record<string, string> } } | null)?.error?.fields ?? {}
    throw new ApiError(code, response.status, fields)
  }

  return payload as T
}

function fallbackCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 404) return 'NOT_FOUND'
  if (status >= 500) return 'SERVER_ERROR'
  return 'UNKNOWN_ERROR'
}

export const authApi = {
  signup: (input: SignupInput) => request<AuthResponse>('/auth/signup', { method: 'POST', body: input }),

  login: (input: LoginInput) => request<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  me: (signal?: AbortSignal) => request<{ user: User }>('/auth/me', { auth: true, signal }),

  updatePreferences: (preferences: Partial<UserPreferences>) =>
    request<{ user: User }>('/auth/preferences', { method: 'PATCH', auth: true, body: preferences }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }).catch(() => ({ ok: true })),
}
