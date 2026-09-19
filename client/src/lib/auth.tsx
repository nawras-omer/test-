/* eslint-disable react-refresh/only-export-components */
/**
 * Authentication state.
 *
 * Token in localStorage (see lib/api.ts) → hydrated once on boot with GET /me,
 * then kept in React state. Because the provider also owns *preference* syncing,
 * a signed-in user's language, palette and colour mode follow them across
 * devices via PATCH /api/auth/preferences.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, authApi, getStoredToken, setStoredToken } from './api'
import { useTheme } from './theme'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/ui/Toast'
import type {
  LoginInput,
  ProfileInput,
  SignupInput,
  User,
  UserGoals,
  UserPreferences,
} from '@/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  isAuthenticated: boolean
  login: (input: LoginInput, remember?: boolean) => Promise<User>
  signup: (input: SignupInput, remember?: boolean) => Promise<User>
  logout: () => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  updateGoals: (goals: Partial<UserGoals>) => Promise<void>
  updateProfile: (profile: ProfileInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getStoredToken() ? 'loading' : 'anonymous'))

  const { palette, mode, applyPreferences } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const { push } = useToast()

  /** Pushes a user's stored preferences into the live theme + language. */
  const applyUserPreferences = useCallback(
    (nextUser: User) => {
      applyPreferences(nextUser.preferences)
      if (nextUser.preferences?.language) setLocale(nextUser.preferences.language)
    },
    [applyPreferences, setLocale],
  )

  /* ---------------- restore the session on boot ---------------- */
  useEffect(() => {
    if (!getStoredToken()) return
    const controller = new AbortController()

    authApi
      .me(controller.signal)
      .then(({ user: me }) => {
        setUser(me)
        applyUserPreferences(me)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return
        // Only a real "not authorised" answer invalidates the token — a flaky
        // network should not sign the user out.
        if (error instanceof ApiError && error.status === 401) {
          setStoredToken(null)
          push(t('auth.sessionExpired'), 'danger')
        }
        setStatus('anonymous')
      })

    return () => controller.abort()
    // Intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------- write preference changes back to the API ---------------- */
  const skipNextSync = useRef(true)
  const userId = user?.id ?? null

  useEffect(() => {
    // A fresh session already carries its preferences — don't echo them back.
    skipNextSync.current = true
  }, [userId])

  useEffect(() => {
    if (!user) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    const timer = window.setTimeout(() => {
      authApi
        .updatePreferences({ language: locale, palette, colorMode: mode })
        .catch(() => push(t('errors.SERVER_ERROR'), 'danger'))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [user, locale, palette, mode, push, t])

  /* ---------------- actions ---------------- */
  const startSession = useCallback(
    (nextUser: User, token: string, message: string, remember: boolean) => {
      setStoredToken(token, remember)
      setUser(nextUser)
      applyUserPreferences(nextUser)
      setStatus('authenticated')
      push(message, 'success')
    },
    [applyUserPreferences, push],
  )

  const login = useCallback(
    async (input: LoginInput, remember = true) => {
      const { token, user: nextUser } = await authApi.login(input)
      startSession(nextUser, token, t('auth.welcomeBack', { name: nextUser.name.split(' ')[0] }), remember)
      return nextUser
    },
    [startSession, t],
  )

  const signup = useCallback(
    async (input: SignupInput, remember = true) => {
      const { token, user: nextUser } = await authApi.signup(input)
      startSession(nextUser, token, t('auth.accountCreated', { name: nextUser.name.split(' ')[0] }), remember)
      return nextUser
    },
    [startSession, t],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setStoredToken(null)
    setUser(null)
    setStatus('anonymous')
    push(t('auth.signedOut'))
  }, [push, t])

  const updateGoals = useCallback(
    async (goals: Partial<UserGoals>) => {
      const { user: updated } = await authApi.updateGoals(goals)
      setUser(updated)
      push(t('settings.goals.saved'), 'success')
    },
    [push, t],
  )

  const updateProfile = useCallback(
    async (profile: ProfileInput) => {
      const { user: updated } = await authApi.updateProfile(profile)
      setUser(updated)
    },
    [],
  )

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      if (preferences.language) setLocale(preferences.language)
      applyPreferences(preferences)
      setUser((prev) => (prev ? { ...prev, preferences: { ...prev.preferences, ...preferences } } : prev))
    },
    [applyPreferences, setLocale],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      login,
      signup,
      logout,
      updatePreferences,
      updateGoals,
      updateProfile,
    }),
    [status, user, login, signup, logout, updatePreferences, updateGoals, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
