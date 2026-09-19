/**
 * The assistant's brain.
 *
 * `plan()` is pure: given a sentence and a snapshot of the user's day it
 * returns a *plan* — what kind of answer to give, which foods were understood
 * and what the numbers are. Executing side effects (actually saving the diary
 * entries, persisting the transcript) happens in
 * `client/src/components/assistant/AssistantProvider.tsx`, which keeps this
 * file trivially testable — see `tests/assistant.mjs`.
 */
import { FOODS_BY_CATEGORY } from '@/data/foods'
import type { FoodCategory, ServingNutrition } from '@/data/foods'
import { mealTypeForNow } from '@/lib/food'
import { searchLibrary, type LibraryEntry } from '@/lib/foods'
import type { CustomFood, EntryTotals, Locale, MealType, UserGoals, UserProfile } from '@/types'
import { parseUtterance, type ParsedUtterance } from './parse'
import { resolveItems, sumItems, type ResolvedItem } from './resolve'

export interface AssistantContext {
  locale: Locale
  custom: CustomFood[]
  goals: UserGoals
  totals: EntryTotals
  remaining: number
  profile?: UserProfile | null
  now?: Date
}

export type SuggestionReason = 'protein' | 'light' | 'balanced' | 'budget'

export interface Suggestion {
  entry: LibraryEntry
  nutrition: ServingNutrition
  reason: SuggestionReason
  /** Per-serving nutrition already fits what is left today. */
  fits: boolean
}

export type AssistantPlan =
  | { kind: 'reply.greeting' }
  | { kind: 'reply.thanks' }
  | { kind: 'reply.help' }
  | {
      kind: 'reply.summary'
      totals: EntryTotals
      goals: UserGoals
      remaining: number
      percent: number
    }
  | { kind: 'reply.topic'; topic: string; values: Record<string, number> }
  | {
      kind: 'reply.suggest'
      mealType: MealType
      remaining: number
      suggestions: Suggestion[]
      /** Why the suggestions look like this — drives the caption. */
      note: 'ok' | 'tight' | 'over'
    }
  | {
      kind: 'reply.estimate'
      items: ResolvedItem[]
      totals: ServingNutrition & { count: number }
      unmatched: string[]
      mealType: MealType
    }
  | {
      kind: 'reply.log'
      items: ResolvedItem[]
      totals: ServingNutrition & { count: number }
      unmatched: string[]
      mealType: MealType
    }
  | { kind: 'reply.foodInfo'; item: ResolvedItem; percentOfDay: number }
  | { kind: 'reply.compare'; items: ResolvedItem[] }
  | { kind: 'reply.fallback'; query: string; didYouMean: LibraryEntry[] }

/** Categories worth suggesting for each meal. */
const MEAL_POOLS: Record<MealType, FoodCategory[]> = {
  breakfast: ['dairy', 'grains', 'fruits', 'proteins', 'nuts'],
  lunch: ['proteins', 'grains', 'vegetables', 'legumes', 'prepared'],
  dinner: ['proteins', 'vegetables', 'legumes', 'grains', 'prepared'],
  snack: ['fruits', 'nuts', 'dairy', 'snacks', 'sweets'],
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Ranks library foods for the meal the person asked about, using what is left
 * of today's budget: a portion that lands near a third of the remaining
 * calories, with extra weight on protein when protein is the limiting macro.
 */
export function suggestFoods(
  context: AssistantContext,
  mealType: MealType,
  limit = 3,
): { suggestions: Suggestion[]; note: 'ok' | 'tight' | 'over' } {
  const { remaining, totals, goals } = context
  const note: 'ok' | 'tight' | 'over' = remaining < 0 ? 'over' : remaining < 250 ? 'tight' : 'ok'

  const budget = remaining > 0 ? remaining : Math.max(goals.calories * 0.25, 300)
  const targetKcal = clamp(budget * 0.35, 90, 650)
  const proteinDensityNeeded = goals.protein > 0 ? clamp((goals.protein - totals.protein) / Math.max(budget, 1), 0, 0.4) : 0

  const pool = MEAL_POOLS[mealType].flatMap((category) => FOODS_BY_CATEGORY[category] ?? [])
  const scored = pool
    .map((food) => {
      const nutrition = {
        kcal: Math.round((food.per100.kcal * food.serving.grams) / 100),
        protein: round((food.per100.protein * food.serving.grams) / 100, 1),
        carbs: round((food.per100.carbs * food.serving.grams) / 100, 1),
        fat: round((food.per100.fat * food.serving.grams) / 100, 1),
      }
      const kcalScore = 1 - Math.abs(nutrition.kcal - targetKcal) / Math.max(targetKcal * 2, 200)
      const density = nutrition.kcal > 0 ? (nutrition.protein * 4) / nutrition.kcal : 0
      const proteinScore = clamp(density / 0.35, 0, 1.4)
      const score = kcalScore * 0.62 + proteinScore * 0.38 + (proteinDensityNeeded > 0.12 ? density * 0.5 : 0)
      const reason: SuggestionReason =
        density >= 0.3 ? 'protein' : nutrition.kcal <= 200 ? 'light' : 'balanced'
      return { food, nutrition, score, reason }
    })
    .sort((a, b) => b.score - a.score)

  const suggestions: Suggestion[] = []
  for (const candidate of scored) {
    // A little variety: at most two suggestions from the same category.
    const sameCategory = suggestions.filter(
      (item) => item.entry.kind === 'bundled' && item.entry.food.category === candidate.food.category,
    ).length
    if (sameCategory >= 2) continue
    suggestions.push({
      entry: { kind: 'bundled', food: candidate.food },
      nutrition: candidate.nutrition,
      reason: candidate.reason,
      fits: candidate.nutrition.kcal <= Math.max(remaining, 0) || remaining <= 0,
    })
    if (suggestions.length >= limit) break
  }

  return { suggestions, note }
}

function topicValues(topic: string, context: AssistantContext): Record<string, number> {
  const { goals, totals, remaining, profile } = context
  const perMealProtein = Math.round(goals.protein / 3)
  const weight = profile?.weightKg ?? null

  switch (topic) {
    case 'protein':
      return {
        goal: goals.protein,
        remaining: Math.max(Math.round(goals.protein - totals.protein), 0),
        perMeal: perMealProtein,
        perKg: weight ? round(weight * 1.6, 0) : 0,
      }
    case 'carbs':
      return { goal: goals.carbs, remaining: Math.max(Math.round(goals.carbs - totals.carbs), 0), perMeal: Math.round(goals.carbs / 3) }
    case 'fat':
      return { goal: goals.fat, remaining: Math.max(Math.round(goals.fat - totals.fat), 0), limit: Math.round((goals.calories * 0.35) / 9) }
    case 'calories':
      return { goal: goals.calories, consumed: totals.calories, remaining: Math.round(remaining) }
    case 'water':
      return { litres: weight ? round(weight * 0.033, 1) : 2 }
    case 'fibre':
      return { goal: Math.round((goals.calories / 1000) * 14) }
    case 'sugar':
      return { limit: Math.round((goals.calories * 0.1) / 4) }
    case 'weightLoss':
      return { daily: 500, weekly: 0.5, kcal: Math.max(Math.round(goals.calories - 500), 1200) }
    case 'exercise':
      return { minutes: 150, kcal: Math.round(goals.calories * 0.15) }
    case 'breakfast':
      return { kcal: Math.round(goals.calories * 0.25) }
    default:
      return {}
  }
}

/**
 * Turns one sentence into a plan. `parsed` can be supplied by tests to skip the
 * tokeniser.
 */
export function plan(text: string, context: AssistantContext, parsed?: ParsedUtterance): AssistantPlan {
  const utterance = parsed ?? parseUtterance(text)
  const mealType = utterance.mealType ?? mealTypeForNow(context.now ?? new Date())

  const { items, unmatched } = resolveItems(utterance.segments, context.custom)
  const totals = sumItems(items)

  // "chicken vs beef" is a comparison whatever else the sentence looks like.
  if (utterance.comparison && items.length > 1) return { kind: 'reply.compare', items }

  const topicPlan = (): AssistantPlan =>
    utterance.topic ? { kind: 'reply.topic', topic: utterance.topic, values: topicValues(utterance.topic, context) } : fallback()

  const fallback = (): AssistantPlan => {
    const query = utterance.segments.map((segment) => segment.query).join(' ').trim() || utterance.raw
    const { entries } = searchLibrary({ query, custom: context.custom, limit: 3 })
    return { kind: 'reply.fallback', query, didYouMean: entries }
  }

  switch (utterance.intent) {
    case 'help':
      return { kind: 'reply.help' }
    case 'thanks':
      return { kind: 'reply.thanks' }
    case 'greeting':
      return items.length === 0 ? { kind: 'reply.greeting' } : logPlan()
    case 'summary':
      return {
        kind: 'reply.summary',
        totals: context.totals,
        goals: context.goals,
        remaining: Math.round(context.remaining),
        percent: context.goals.calories > 0 ? Math.round((context.totals.calories / context.goals.calories) * 100) : 0,
      }
    case 'suggest': {
      const { suggestions, note } = suggestFoods(context, mealType)
      return { kind: 'reply.suggest', mealType, remaining: Math.round(context.remaining), suggestions, note }
    }
    case 'log':
      return items.length > 0 ? logPlan() : topicPlan()
    case 'estimate': {
      if (items.length === 0) return topicPlan()
      if (utterance.comparison && items.length > 1) return { kind: 'reply.compare', items }
      if (items.length === 1) {
        const percentOfDay =
          context.goals.calories > 0 ? Math.round((items[0].nutrition.kcal / context.goals.calories) * 100) : 0
        return { kind: 'reply.foodInfo', item: items[0], percentOfDay }
      }
      return { kind: 'reply.estimate', items, totals, unmatched, mealType }
    }
    default: {
      if (items.length === 1) {
        const percentOfDay =
          context.goals.calories > 0 ? Math.round((items[0].nutrition.kcal / context.goals.calories) * 100) : 0
        return { kind: 'reply.foodInfo', item: items[0], percentOfDay }
      }
      if (items.length > 1) return { kind: 'reply.estimate', items, totals, unmatched, mealType }
      return topicPlan()
    }
  }

  function logPlan(): AssistantPlan {
    return { kind: 'reply.log', items, totals, unmatched, mealType }
  }
}

/** Compact context object handed to the optional LLM provider. */
export function contextForProvider(context: AssistantContext): Record<string, number | string> {
  return {
    locale: context.locale,
    goalCalories: context.goals.calories,
    consumedCalories: context.totals.calories,
    remainingCalories: Math.round(context.remaining),
    protein: `${Math.round(context.totals.protein)}/${context.goals.protein} g`,
    carbs: `${Math.round(context.totals.carbs)}/${context.goals.carbs} g`,
    fat: `${Math.round(context.totals.fat)}/${context.goals.fat} g`,
  }
}

export { parseUtterance }
export type { ParsedUtterance }
