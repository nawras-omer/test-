/**
 * Assembles the bundled rows into the searchable `Food[]` database.
 *
 * Everything that touches the raw tuples lives here: normalisation of the
 * search haystack, id generation and the integrity checks that keep the data
 * honest. Import `FOODS` (or `FOODS_BY_CATEGORY`) from here — the row files
 * themselves are an implementation detail.
 */
import type { Locale } from '@/types'
import type { Food, FoodCategory, FoodRow, ServingNutrition, ServingUnit } from './types'
import { CATEGORIES } from './types'

import { fruits } from './fruits'
import { vegetables } from './vegetables'
import { proteins } from './proteins'
import { grains } from './grains'
import { dairy } from './dairy'
import { legumes } from './legumes'
import { nuts } from './nuts'
import { fats } from './fats'
import { snacks } from './snacks'
import { sweets } from './sweets'
import { beverages } from './beverages'
import { prepared } from './prepared'

/** Minimum row arity: everything before the optional synonyms. */
const REQUIRED_ARITY = 11
const MAX_ARITY = 14

/**
 * Normalises text for search.
 *
 * Rules, in order: lowercase, strip Latin diacritics, drop Arabic/Kurdish
 * diacritics and tatweel, unify the letter variants that differ only by script
 * or convention (alef forms, yeh, kaf, heh, teh marbuta) and finally collapse
 * punctuation and whitespace to single spaces. Applied to both the haystack and
 * the user's query, so `باذنجان`, `بادنجان` and `egg-plant` all land on the
 * same string.
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFKD')
    // Latin diacritics *and* the Arabic combining marks NFKD produces from
    // أ / إ / آ — stripping them here is what lets "احمد" match "أحمد".
    .replace(/[\u0300-\u036f\u0653-\u0655]/g, '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u06CC')
    .replace(/[\u064A\u06D2]/g, '\u06CC')
    .replace(/\u0629/g, '\u0647')
    .replace(/[\u0643]/g, '\u06A9')
    .replace(/[\u0647\u06D5]/g, '\u06D5')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u06CC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function buildSearch(row: FoodRow, slug: string): string {
  const parts = [
    row[1],
    row[2],
    row[3],
    row[11] ?? '',
    row[12] ?? '',
    row[13] ?? '',
    slug.replace(/-/g, ' '),
  ]
  return normalizeSearchText(parts.join(' '))
}

function names(row: FoodRow): Record<Locale, string> {
  return { en: row[1].trim(), ar: row[2].trim(), ckb: row[3].trim() }
}

function alts(row: FoodRow): Partial<Record<Locale, string>> {
  const out: Partial<Record<Locale, string>> = {}
  if (row[11]) out.en = row[11].trim()
  if (row[12]) out.ar = row[12].trim()
  if (row[13]) out.ckb = row[13].trim()
  return out
}

/** Turns one tuple into a `Food`, validating it on the way. */
export function rowToFood(category: FoodCategory, row: FoodRow): Food {
  if (row.length < REQUIRED_ARITY || row.length > MAX_ARITY) {
    throw new Error(`foods:${category} row "${row[0]}" has ${row.length} fields (expected ${REQUIRED_ARITY}–${MAX_ARITY})`)
  }
  const slug = row[0].trim()
  if (!slug) throw new Error(`foods:${category} has a row without a slug`)
  const serving = { qty: row[4], unit: row[5] as ServingUnit, grams: row[6] }
  if (!(serving.qty > 0) || !(serving.grams > 0)) {
    throw new Error(`foods:${category}:${slug} needs a positive serving quantity and weight`)
  }
  if (!row[1]?.trim() || !row[2]?.trim() || !row[3]?.trim()) {
    throw new Error(`foods:${category}:${slug} is missing one of its three names`)
  }
  return {
    id: `${category}:${slug}`,
    slug,
    category,
    names: names(row),
    alts: alts(row),
    serving,
    per100: { kcal: row[7], protein: row[8], carbs: row[9], fat: row[10] },
    search: buildSearch(row, slug),
  }
}

const GROUPS: Array<[FoodCategory, readonly FoodRow[]]> = [
  ['fruits', fruits],
  ['vegetables', vegetables],
  ['proteins', proteins],
  ['grains', grains],
  ['dairy', dairy],
  ['legumes', legumes],
  ['nuts', nuts],
  ['fats', fats],
  ['snacks', snacks],
  ['sweets', sweets],
  ['beverages', beverages],
  ['prepared', prepared],
]

function buildDatabase(): Food[] {
  const seen = new Set<string>()
  const out: Food[] = []
  for (const [category, rows] of GROUPS) {
    for (const row of rows) {
      const food = rowToFood(category, row)
      if (seen.has(food.id)) throw new Error(`foods: duplicate id "${food.id}"`)
      seen.add(food.id)
      out.push(food)
    }
  }
  return out
}

/** The whole bundled library, grouped by category in display order. */
export const FOODS: Food[] = buildDatabase()

export const FOODS_BY_CATEGORY: Record<FoodCategory, Food[]> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category] = FOODS.filter((food) => food.category === category)
    return acc
  },
  {} as Record<FoodCategory, Food[]>,
)

/** Count per category — handy for the browse screen and for tests. */
export const FOOD_COUNTS: Record<FoodCategory, number> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category] = FOODS_BY_CATEGORY[category].length
    return acc
  },
  {} as Record<FoodCategory, number>,
)

export const TOTAL_FOODS = FOODS.length

/** Nutrition for `qty` servings of a food, derived from the per-100 g basis. */
export function servingNutrition(food: Food, qty = 1): ServingNutrition {
  const grams = food.serving.grams * qty
  const factor = grams / 100
  return {
    kcal: Math.round(food.per100.kcal * factor),
    protein: Math.round(food.per100.protein * factor * 10) / 10,
    carbs: Math.round(food.per100.carbs * factor * 10) / 10,
    fat: Math.round(food.per100.fat * factor * 10) / 10,
  }
}

/** Human-readable serving label parts, e.g. `{ qty: 1, unit: 'cup' }`. */
export function servingLabel(food: Food, qty = 1): { qty: number; unit: ServingUnit; grams: number } {
  return { qty: food.serving.qty * qty, unit: food.serving.unit, grams: food.serving.grams * qty }
}

export type { Food, FoodCategory, FoodRow, ServingNutrition, ServingUnit }
export { CATEGORIES }
