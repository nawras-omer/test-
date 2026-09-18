/**
 * Placeholder data for the foundation build.
 * Every value the user can *read* is localised (names go through translation
 * keys); every value is replaced by real API data when tracking lands.
 */
import type { TranslationKey } from '@/i18n'

export const DAILY_GOAL = 2150
export const CONSUMED = 1420
export const BURNED = 310
export const CALORIES_LEFT = DAILY_GOAL - CONSUMED + BURNED

export const WATER_GOAL = 8
export const WATER_DONE = 5

export const STREAK_DAYS = 6
/** Oldest → newest; the last entry is "today". */
export const STREAK_WEEK = [true, true, true, false, true, true, true]

export const WEEKLY_CALORIES = [1980, 2240, 1760, 2090, 1520, 2310, CONSUMED]

export interface MacroTarget {
  key: TranslationKey
  current: number
  goal: number
  /** CSS custom property feeding the bar colour. */
  colorVar: string
}

export const MACROS: MacroTarget[] = [
  { key: 'dashboard.macros.protein', current: 96, goal: 140, colorVar: 'var(--macro-protein)' },
  { key: 'dashboard.macros.carbs', current: 148, goal: 240, colorVar: 'var(--macro-carbs)' },
  { key: 'dashboard.macros.fat', current: 46, goal: 70, colorVar: 'var(--macro-fat)' },
]

export interface MealEntry {
  id: string
  slotKey: TranslationKey
  nameKey: TranslationKey
  portionKey: TranslationKey
  kcal: number
  time: string
  emoji: string
}

export const MEALS: MealEntry[] = [
  {
    id: 'breakfast',
    slotKey: 'dashboard.meals.breakfast',
    nameKey: 'demo.food.oats',
    portionKey: 'demo.portion.bowl',
    kcal: 380,
    time: '07:45',
    emoji: '🥣',
  },
  {
    id: 'lunch',
    slotKey: 'dashboard.meals.lunch',
    nameKey: 'demo.food.chickenSalad',
    portionKey: 'demo.portion.plate',
    kcal: 520,
    time: '12:30',
    emoji: '🥗',
  },
  {
    id: 'snack',
    slotKey: 'dashboard.meals.snack',
    nameKey: 'demo.food.apple',
    portionKey: 'demo.portion.piece',
    kcal: 95,
    time: '16:10',
    emoji: '🍎',
  },
  {
    id: 'dinner',
    slotKey: 'dashboard.meals.dinner',
    nameKey: 'demo.food.salmon',
    portionKey: 'demo.portion.plate',
    kcal: 425,
    time: '19:40',
    emoji: '🐟',
  },
]

/** Tip of the day rotates deterministically by day of the month. */
export const TIP_KEYS: TranslationKey[] = [
  'dashboard.tips.1',
  'dashboard.tips.2',
  'dashboard.tips.3',
]

export function tipKeyFor(date = new Date()): TranslationKey {
  return TIP_KEYS[date.getDate() % TIP_KEYS.length]
}

/** Body-weight placeholder; a real weigh-in log will replace it. */
export const WEIGHT_KG = 68.4
export const WEIGHT_DELTA_KG = -0.6

/** Last 7 calendar days, oldest first — used for the weekly chart labels. */
export function lastSevenDays(today = new Date()): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return date
  })
}
