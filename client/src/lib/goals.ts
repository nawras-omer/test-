/**
 * Goal maths: the calculator behind the goal-setting page and the numbers
 * behind the weekly summary.
 *
 * Everything here is pure so the tests can drive it directly:
 *   • `suggestGoals` — Mifflin–St Jeor BMR → TDEE → a daily target, adjusted
 *     towards the user's target weight.
 *   • `weeklyReport` — average intake and a goal-achievement rate over the
 *     last N days, plus per-day totals for the summary list.
 */
import { ACTIVITY_FACTORS } from '@/types'
import type { EntryTotals, FoodEntry, UserGoals, UserProfile } from '@/types'
import { EMPTY_TOTALS, entriesForDate, lastNDateKeys, summarise } from './food'

/** A day counts as "on target" within ±10% of the calorie goal. */
export const ACHIEVEMENT_TOLERANCE = 0.1
/** Weight change per week the calculator aims for when a target is set. */
export const WEEKLY_WEIGHT_CHANGE_KG = 0.5
/** One kilogram of body weight ≈ 7,700 kcal. */
const KCAL_PER_KG = 7700

/** Macro split of the daily calorie target: 25 / 45 / 30. */
export const MACRO_SPLIT = { protein: 0.25, carbs: 0.45, fat: 0.3 }

export const GOAL_LIMITS = {
  calories: { min: 800, max: 20000 },
  macros: { min: 0, max: 2000 },
  age: { min: 10, max: 120 },
  heightCm: { min: 80, max: 250 },
  weightKg: { min: 25, max: 400 },
} as const

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Mifflin–St Jeor resting energy expenditure.
 *
 * When sex is unknown we take the midpoint of the male (+5) and female (−161)
 * constants rather than guessing, which keeps the suggestion sane.
 */
export function basalMetabolicRate(profile: Pick<UserProfile, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number | null {
  const { sex, age, heightCm, weightKg } = profile
  if (!age || !heightCm || !weightKg) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : -78
  return Math.round(base + offset)
}

/** Daily energy expenditure = BMR × activity factor. */
export function maintenanceCalories(profile: UserProfile): number | null {
  const bmr = basalMetabolicRate(profile)
  if (bmr === null) return null
  const factor = ACTIVITY_FACTORS[profile.activity] ?? ACTIVITY_FACTORS.moderate
  return Math.round(bmr * factor)
}

/** Splits a calorie target into macro grams. */
export function macroSplit(calories: number): Omit<UserGoals, 'calories'> {
  return {
    protein: Math.round((calories * MACRO_SPLIT.protein) / 4),
    carbs: Math.round((calories * MACRO_SPLIT.carbs) / 4),
    fat: Math.round((calories * MACRO_SPLIT.fat) / 9),
  }
}

export interface GoalSuggestion {
  goals: UserGoals
  /** Resting + activity total the target was derived from. */
  maintenance: number
  bmr: number
  /** Positive when the target aims to lose weight, negative to gain. */
  dailyAdjustment: number
}

/**
 * Suggests daily targets from the profile. Returns null while the profile is
 * missing the numbers the formula needs (age, height, weight).
 */
export function suggestGoals(profile: UserProfile): GoalSuggestion | null {
  const bmr = basalMetabolicRate(profile)
  const maintenance = maintenanceCalories(profile)
  if (bmr === null || maintenance === null) return null

  let adjustment = 0
  if (profile.targetWeightKg && profile.weightKg && profile.targetWeightKg !== profile.weightKg) {
    const direction = profile.targetWeightKg < profile.weightKg ? -1 : 1
    adjustment = direction * ((WEEKLY_WEIGHT_CHANGE_KG * KCAL_PER_KG) / 7)
  } else if (profile.activity === 'sedentary') {
    adjustment = -150 // nudge, keep it gentle
  }

  const calories = Math.round(
    clamp(maintenance + adjustment, GOAL_LIMITS.calories.min, GOAL_LIMITS.calories.max),
  )
  return {
    goals: { calories, ...macroSplit(calories) },
    maintenance,
    bmr,
    dailyAdjustment: Math.round(adjustment),
  }
}

/** Whether the profile has everything the calculator needs. */
export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile && profile.age && profile.heightCm && profile.weightKg)
}

/* ------------------------------------------------------------------ weekly -- */

export interface WeeklyDay {
  date: string
  totals: EntryTotals
  /** Intake as a share of the calorie goal (1 = exactly on target). */
  ratio: number
  /** Anything was logged that day. */
  logged: boolean
  /** Logged and within ±10% of the goal. */
  onTarget: boolean
}

export interface WeeklyReport {
  days: WeeklyDay[]
  /** Average kcal per logged day. */
  averageIntake: number
  /** Average kcal across the whole window (empty days count as zero). */
  averagePerDay: number
  /** Share of logged days that landed within ±10% of the goal, as a percent. */
  achievementRate: number
  loggedDays: number
  onTargetDays: number
  totalCalories: number
  goal: number
  macroAverages: { protein: number; carbs: number; fat: number }
  bestDay: WeeklyDay | null
}

/**
 * Summarises the last `windowDays` days (default: the dashboard's 7-day chart)
 * against the calorie goal.
 */
export function weeklyReport(
  entries: FoodEntry[],
  goals: UserGoals,
  windowDays = 7,
  now = new Date(),
): WeeklyReport {
  const keys = lastNDateKeys(windowDays, now)
  const days: WeeklyDay[] = keys.map((date) => {
    const totals = summarise(entriesForDate(entries, date))
    const ratio = goals.calories > 0 ? totals.calories / goals.calories : 0
    const logged = totals.count > 0
    return {
      date,
      totals,
      ratio,
      logged,
      onTarget: logged && Math.abs(ratio - 1) <= ACHIEVEMENT_TOLERANCE,
    }
  })

  const loggedDays = days.filter((day) => day.logged)
  const macroTotals = loggedDays.reduce(
    (accumulator, day) => ({
      protein: accumulator.protein + day.totals.protein,
      carbs: accumulator.carbs + day.totals.carbs,
      fat: accumulator.fat + day.totals.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  )

  const totalCalories = days.reduce((sum, day) => sum + day.totals.calories, 0)
  const onTargetDays = days.filter((day) => day.onTarget).length
  const denominator = loggedDays.length || 1

  return {
    days,
    averageIntake: Math.round(totalCalories / denominator),
    averagePerDay: Math.round(totalCalories / Math.max(windowDays, 1)),
    achievementRate: loggedDays.length > 0 ? Math.round((onTargetDays / loggedDays.length) * 100) : 0,
    loggedDays: loggedDays.length,
    onTargetDays,
    totalCalories: Math.round(totalCalories),
    goal: goals.calories,
    macroAverages: {
      protein: round(macroTotals.protein / denominator, 1),
      carbs: round(macroTotals.carbs / denominator, 1),
      fat: round(macroTotals.fat / denominator, 1),
    },
    bestDay: loggedDays.reduce<WeeklyDay | null>((best, day) => {
      if (!best) return day
      const bestDistance = Math.abs(best.ratio - 1)
      const dayDistance = Math.abs(day.ratio - 1)
      return dayDistance < bestDistance ? day : best
    }, null),
  }
}

/** Totals for an empty set of entries — handy default for cards. */
export const NO_TOTALS: EntryTotals = EMPTY_TOTALS
