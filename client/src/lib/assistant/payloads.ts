/**
 * Shape of what the assistant stores for each kind of answer.
 *
 * A message is `{ kind, data }`, never prose: the UI renders the words from the
 * active dictionary, so switching language re-renders the whole conversation.
 * Foods are stored by id (`foodId`) so their names localise too — custom foods
 * fall back to the name the user typed.
 */
import type { ServingNutrition } from '@/data/foods'
import type { EntryTotals, MealType, UserGoals } from '@/types'
import type { SuggestionReason } from './engine'

export interface StoredItem {
  /** Bundled food id (`category:slug`), or null for a custom food. */
  foodId: string | null
  /** Name as it was written at log time — the fallback when there is no id. */
  name: string
  qty: number
  unit: string | null
  servings: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface LogData {
  items: StoredItem[]
  totals: ServingNutrition
  unmatched: string[]
  mealType: MealType
  /** False on an "estimate" card that has not been saved to the diary yet. */
  saved: boolean
}

export interface EstimateData extends LogData {
  /** "estimate" cards are the same payload with `saved: false`. */
}

export interface FoodInfoData {
  item: StoredItem
  percentOfDay: number
  mealType: MealType
  saved: boolean
}

export interface CompareData {
  items: StoredItem[]
  mealType: MealType
}

export interface SuggestData {
  mealType: MealType
  remaining: number
  note: 'ok' | 'tight' | 'over'
  suggestions: Array<StoredItem & { reason: SuggestionReason; fits: boolean }>
}

export interface SummaryData {
  totals: EntryTotals
  goals: UserGoals
  remaining: number
  percent: number
}

export interface TopicData {
  topic: string
  values: Record<string, number>
}

export interface FallbackData {
  query: string
  didYouMean: Array<{ foodId: string | null; name: string }>
}

export interface LlmData {
  /** True when the provider was configured but failed, so we answered locally. */
  degraded?: boolean
}

/** Messages the user has to send themselves — the greeting bubble. */
export const GREETING_KIND = 'reply.greeting'

/** Narrowing helper: read a message payload as `T` with a shape check. */
export function asData<T>(data: Record<string, unknown> | null): T | null {
  return data && typeof data === 'object' ? (data as unknown as T) : null
}
