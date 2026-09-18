/**
 * The bundled food database.
 *
 * Rows are positional tuples rather than objects so a thousand-entry file stays
 * readable and diff-friendly, and so TypeScript can type-check the *shape* of
 * every row (arity, unit names, numeric fields) at compile time.
 *
 * Nutrition is stored **per 100 g / 100 ml** — the reference basis used by food
 * composition tables — and the per-serving values shown in the UI are derived
 * from it (`kcal100 * grams / 100`). That keeps one number authoritative and
 * makes portion maths trivial.
 */
import type { Locale } from '@/types'

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'proteins'
  | 'grains'
  | 'dairy'
  | 'legumes'
  | 'nuts'
  | 'fats'
  | 'snacks'
  | 'sweets'
  | 'beverages'
  | 'prepared'

export type ServingUnit =
  | 'g'
  | 'ml'
  | 'cup'
  | 'tbsp'
  | 'tsp'
  | 'piece'
  | 'slice'
  | 'bowl'
  | 'plate'
  | 'glass'
  | 'can'
  | 'bottle'
  | 'handful'
  | 'serving'
  | 'scoop'
  | 'bunch'
  | 'leaf'
  | 'package'

/**
 * [slug, en, ar, ckb, servingQty, servingUnit, servingGrams,
 *  kcal100, protein100, carbs100, fat100, altEn?, altAr?, altCkb?]
 */
export type FoodRow = readonly [
  slug: string,
  en: string,
  ar: string,
  ckb: string,
  qty: number,
  unit: ServingUnit,
  grams: number,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  altEn?: string,
  altAr?: string,
  altCkb?: string,
]

/** A database entry, ready to search and to log. */
export interface Food {
  /** Stable id, e.g. `fruits:apple`. */
  id: string
  slug: string
  category: FoodCategory
  /** Display name per locale. */
  names: Record<Locale, string>
  /** Optional synonyms per locale (aubergine/eggplant, courgette/zucchini). */
  alts: Partial<Record<Locale, string>>
  serving: { qty: number; unit: ServingUnit; grams: number }
  per100: { kcal: number; protein: number; carbs: number; fat: number }
  /** Pre-normalised search haystack covering every locale + synonyms. */
  search: string
  /** True for foods the user created themselves. */
  custom?: boolean
}

/** Nutrition totals for one serving of a food. */
export interface ServingNutrition {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export const CATEGORIES: FoodCategory[] = [
  'fruits',
  'vegetables',
  'proteins',
  'grains',
  'dairy',
  'legumes',
  'nuts',
  'fats',
  'snacks',
  'sweets',
  'beverages',
  'prepared',
]
