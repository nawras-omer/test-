/**
 * Pure helpers for the food diary: local-date maths, totals and defaults.
 *
 * Dates are handled as `YYYY-MM-DD` *local* calendar keys. The server stores
 * that string verbatim, which keeps "today" meaning the user's today rather
 * than the server's timezone.
 */
import type { DayTotals, EntryTotals, FoodEntry, MealType, UserGoals } from '@/types'

export const DEFAULT_GOALS: UserGoals = { calories: 2150, protein: 140, carbs: 240, fat: 70 }

/** Number of days the dashboard fetches for its weekly chart. */
export const DASHBOARD_WINDOW_DAYS = 7
/** How many entries the "recent" list shows. */
export const RECENT_LIMIT = 5

export const EMPTY_TOTALS: EntryTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }

/* --------------------------------------------------------------- date maths */

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(now = new Date()): string {
  return toDateKey(now)
}

/** Parses a `YYYY-MM-DD` key into a local-midnight Date. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function shiftDateKey(key: string, days: number): string {
  return toDateKey(addDays(parseDateKey(key), days))
}

/** Oldest → newest list of date keys ending today. */
export function lastNDateKeys(days: number, now = new Date()): string[] {
  return Array.from({ length: days }, (_, index) => toDateKey(addDays(now, index - (days - 1))))
}

/* -------------------------------------------------------------------- meals */

/** Picks the meal a person is most likely logging right now. */
export function mealTypeForNow(now = new Date()): MealType {
  const hour = now.getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 16) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

/* ------------------------------------------------------------------- totals */

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Sums calories, macros and entry count for any list of entries. */
export function summarise(entries: FoodEntry[]): EntryTotals {
  const totals = entries.reduce<EntryTotals>(
    (accumulator, entry) => ({
      calories: accumulator.calories + (Number(entry.calories) || 0),
      protein: accumulator.protein + (Number(entry.protein) || 0),
      carbs: accumulator.carbs + (Number(entry.carbs) || 0),
      fat: accumulator.fat + (Number(entry.fat) || 0),
      count: accumulator.count + 1,
    }),
    { ...EMPTY_TOTALS },
  )

  return {
    calories: Math.round(totals.calories),
    protein: round(totals.protein),
    carbs: round(totals.carbs),
    fat: round(totals.fat),
    count: totals.count,
  }
}

export function entriesForDate(entries: FoodEntry[], date: string): FoodEntry[] {
  return entries.filter((entry) => entry.date === date)
}

export function entriesForMeal(entries: FoodEntry[], mealType: MealType): FoodEntry[] {
  return entries.filter((entry) => entry.mealType === mealType)
}

/** One point per day for the weekly chart (oldest → newest). */
export function dailyTotals(entries: FoodEntry[], dateKeys: string[]): DayTotals[] {
  const byDate = new Map<string, number>()
  for (const entry of entries) {
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + (Number(entry.calories) || 0))
  }
  return dateKeys.map((date) => ({ date, calories: Math.round(byDate.get(date) ?? 0) }))
}

/** Sort: newest logged date first, then most recently created. */
export function sortByRecency(entries: FoodEntry[]): FoodEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return String(b.createdAt).localeCompare(String(a.createdAt))
  })
}

/** Calories left before hitting the goal — negative means over. */
export function remainingCalories(totals: EntryTotals, goals: UserGoals): number {
  return goals.calories - totals.calories
}

/** Share of a daily target that has been consumed, clamped to 0-100. */
export function percentOfGoal(value: number, goal: number): number {
  if (!goal || goal <= 0) return 0
  return Math.min(Math.max((value / goal) * 100, 0), 100)
}

/** Macro grams → kcal, for the "these macros add up to X" hint in the modal. */
export function macroCalories(protein: number, carbs: number, fat: number): number {
  return Math.round((Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9)
}
