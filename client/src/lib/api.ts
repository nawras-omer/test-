/**
 * Thin typed wrapper around the auth API.
 *
 * Requests are always relative (`/api/...`), so the browser talks to whatever
 * origin served the app and the dev server / reverse proxy forwards them to the
 * Express API. No CORS juggling in the client, and no localhost hard-coding.
 */
import type {
  ApiErrorCode,
  AssistantMessage,
  AssistantMessageInput,
  AuthResponse,
  CustomFood,
  CustomFoodInput,
  FoodEntry,
  FoodEntryInput,
  LoginInput,
  SignupInput,
  ProfileInput,
  User,
  UserGoals,
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

/** Query for the diary list endpoints. */
export interface EntryQuery {
  from?: string
  to?: string
  limit?: number
}

function entryQueryString(query: EntryQuery): string {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  const search = params.toString()
  return search ? `?${search}` : ''
}

export const authApi = {
  signup: (input: SignupInput) => request<AuthResponse>('/auth/signup', { method: 'POST', body: input }),

  login: (input: LoginInput) => request<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  me: (signal?: AbortSignal) => request<{ user: User }>('/auth/me', { auth: true, signal }),

  updatePreferences: (preferences: Partial<UserPreferences>) =>
    request<{ user: User }>('/auth/preferences', { method: 'PATCH', auth: true, body: preferences }),

  updateGoals: (goals: Partial<UserGoals>) =>
    request<{ user: User }>('/auth/goals', { method: 'PATCH', auth: true, body: goals }),

  updateProfile: (profile: ProfileInput) =>
    request<{ user: User }>('/auth/profile', { method: 'PATCH', auth: true, body: profile }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }).catch(() => ({ ok: true })),
}

/** Food-log endpoints. All scoped to the signed-in user by the server. */
export const entriesApi = {
  list: (query: EntryQuery = {}, signal?: AbortSignal) =>
    request<{ entries: FoodEntry[] }>(`/entries${entryQueryString(query)}`, { auth: true, signal }),

  /** Most recent entries regardless of date — powers the dashboard "recent" list. */
  recent: (limit: number, signal?: AbortSignal) =>
    request<{ entries: FoodEntry[] }>(`/entries${entryQueryString({ limit })}`, { auth: true, signal }),

  create: (input: FoodEntryInput) =>
    request<{ entry: FoodEntry }>('/entries', { method: 'POST', auth: true, body: input }),

  remove: (id: string) => request<{ ok: boolean; id: string }>(`/entries/${id}`, { method: 'DELETE', auth: true }),
}

/**
 * Personal food library. The bundled 1,000+ food database ships with the client;
 * this endpoint only stores the foods a user creates themselves.
 */
export const foodsApi = {
  list: (signal?: AbortSignal) => request<{ foods: CustomFood[] }>('/foods', { auth: true, signal }),

  create: (input: CustomFoodInput) =>
    request<{ food: CustomFood }>('/foods', { method: 'POST', auth: true, body: input }),

  remove: (id: string) => request<{ ok: boolean; id: string }>(`/foods/${id}`, { method: 'DELETE', auth: true }),
}

/**
 * Assistant endpoints. The conversation itself is computed in the browser
 * (`client/src/lib/assistant/`) against the bundled food database; the server
 * stores the transcript so it survives reloads and follows the account.
 */
export const assistantApi = {
  status: (signal?: AbortSignal) =>
    request<{ llm: boolean; provider: { configured: boolean; model: string | null } }>('/assistant/status', {
      auth: true,
      signal,
    }),

  list: (limit?: number, signal?: AbortSignal) =>
    request<{ messages: AssistantMessage[] }>(`/assistant/messages${limit ? `?limit=${limit}` : ''}`, {
      auth: true,
      signal,
    }),

  append: (message: AssistantMessageInput) =>
    request<{ message: AssistantMessage }>('/assistant/messages', { method: 'POST', auth: true, body: message }),

  clear: () => request<{ ok: boolean; removed: number }>('/assistant/messages', { method: 'DELETE', auth: true }),

  /** Open-ended question for the optional LLM provider (503 when unconfigured). */
  respond: (messages: Array<{ role: string; content: string }>, locale: string, context?: unknown) =>
    request<{ reply: string }>('/assistant/respond', {
      method: 'POST',
      auth: true,
      body: { messages, locale, context },
    }),
}
