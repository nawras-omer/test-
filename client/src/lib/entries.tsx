/* eslint-disable react-refresh/only-export-components */
/**
 * Food-diary state for the signed-in user.
 *
 * Two reads back the dashboard:
 *   • a 7-day window (today's totals, macros, weekly chart)
 *   • the N most recent entries regardless of date (the "recent" list)
 *
 * Mutations update local state from the server's canonical response, so widgets
 * refresh the moment an entry is saved — no refetch, no stale numbers.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { entriesApi } from './api'
import {
  DASHBOARD_WINDOW_DAYS,
  EMPTY_TOTALS,
  RECENT_LIMIT,
  dailyTotals,
  entriesForDate,
  lastNDateKeys,
  remainingCalories,
  sortByRecency,
  summarise,
  todayKey,
} from './food'
import { useAuth } from './auth'
import type { DayTotals, EntryTotals, FoodEntry, FoodEntryInput, UserGoals } from '@/types'

type EntriesStatus = 'idle' | 'loading' | 'ready' | 'error'

interface EntriesContextValue {
  status: EntriesStatus
  /** Entries inside the dashboard window (last 7 days), newest first. */
  entries: FoodEntry[]
  /** The N most recent entries, whatever their date. */
  recent: FoodEntry[]
  /** Today's calendar key (recomputes if the app stays open past midnight). */
  today: string
  todayEntries: FoodEntry[]
  todayTotals: EntryTotals
  week: DayTotals[]
  goals: UserGoals
  /** Calories left today; negative when the goal is exceeded. */
  remaining: number
  overGoal: boolean
  /** Id of the entry saved most recently — used to highlight the new row. */
  lastAddedId: string | null
  addEntry: (input: FoodEntryInput) => Promise<FoodEntry>
  removeEntry: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const EntriesContext = createContext<EntriesContextValue | null>(null)

export function EntriesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()

  const [status, setStatus] = useState<EntriesStatus>('idle')
  const [windowEntries, setWindowEntries] = useState<FoodEntry[]>([])
  const [recent, setRecent] = useState<FoodEntry[]>([])
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)
  const [today, setToday] = useState<string>(() => todayKey())

  const goals = user?.goals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }

  /* ------------------------------------------------------------ loading -- */
  const load = useCallback(async (signal?: AbortSignal) => {
    const to = todayKey()
    const from = lastNDateKeys(DASHBOARD_WINDOW_DAYS)[0]

    const [windowResult, recentResult] = await Promise.all([
      entriesApi.list({ from, to }, signal),
      entriesApi.recent(RECENT_LIMIT, signal),
    ])

    setWindowEntries(windowResult.entries)
    setRecent(recentResult.entries)
  }, [])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    try {
      await load()
      setStatus('ready')
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return
      setStatus('error')
    }
  }, [isAuthenticated, load])

  // Load (and clear) whenever the session changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setWindowEntries([])
      setRecent([])
      setLastAddedId(null)
      setStatus('idle')
      return
    }

    const controller = new AbortController()
    setStatus('loading')
    load(controller.signal)
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [isAuthenticated, user?.id, load])

  /* -------------------------------------------------- midnight rollover -- */
  // Keeps "today" honest when the app is left open overnight.
  useEffect(() => {
    if (!isAuthenticated) return
    const timer = window.setInterval(() => {
      const next = todayKey()
      setToday((current) => {
        if (current === next) return current
        void load().catch(() => undefined)
        return next
      })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated, load])

  /* ----------------------------------------------------------- mutations -- */
  const addEntry = useCallback(async (input: FoodEntryInput) => {
    const { entry } = await entriesApi.create(input)

    setWindowEntries((current) => sortByRecency([...current.filter((row) => row.id !== entry.id), entry]))
    setRecent((current) => sortByRecency([...current.filter((row) => row.id !== entry.id), entry]).slice(0, RECENT_LIMIT))
    setLastAddedId(entry.id)
    setStatus('ready')
    return entry
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await entriesApi.remove(id)
    setWindowEntries((current) => current.filter((entry) => entry.id !== id))
    setRecent((current) => current.filter((entry) => entry.id !== id))
    setLastAddedId((current) => (current === id ? null : current))
  }, [])

  /* ------------------------------------------------------------- derived -- */
  const todayEntries = useMemo(() => entriesForDate(windowEntries, today), [windowEntries, today])
  const todayTotals = useMemo(() => summarise(todayEntries), [todayEntries])
  const week = useMemo(() => dailyTotals(windowEntries, lastNDateKeys(DASHBOARD_WINDOW_DAYS)), [windowEntries])
  const remaining = useMemo(() => remainingCalories(todayTotals, goals), [todayTotals, goals])

  const value = useMemo<EntriesContextValue>(
    () => ({
      status,
      entries: windowEntries,
      recent,
      today,
      todayEntries,
      todayTotals: status === 'ready' || status === 'idle' ? todayTotals : EMPTY_TOTALS,
      week,
      goals,
      remaining,
      overGoal: remaining < 0,
      lastAddedId,
      addEntry,
      removeEntry,
      refresh,
    }),
    [status, windowEntries, recent, today, todayEntries, todayTotals, week, goals, remaining, lastAddedId, addEntry, removeEntry, refresh],
  )

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
}

export function useEntries(): EntriesContextValue {
  const context = useContext(EntriesContext)
  if (!context) throw new Error('useEntries must be used inside <EntriesProvider>')
  return context
}
