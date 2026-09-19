/**
 * Matches parsed food phrases against the bundled database (plus the user's own
 * foods) and turns "2 cups of rice" into real nutrition.
 */
import { normalizeSearchText, servingNutrition, type ServingNutrition } from '@/data/foods'
import { findGenericFood } from './generic'
import { searchLibrary, type LibraryEntry } from '@/lib/foods'
import type { CustomFood } from '@/types'
import { UNIT_GRAMS } from './lexicon'
import type { ParsedSegment } from './parse'

export interface ResolvedItem {
  entry: LibraryEntry
  /** What the person wrote, e.g. "grilled chicken". */
  query: string
  /** Quantity as written, e.g. 2. */
  qty: number
  /** Unit as written, e.g. `cup`, or null when they just said "2 x". */
  unit: string | null
  /** How many servings of the matched food that quantity represents. */
  servings: number
  nutrition: ServingNutrition
}

export interface ResolveResult {
  items: ResolvedItem[]
  /** Phrases we could not match to any food. */
  unmatched: string[]
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Converts a written quantity + unit into servings of the matched food. */
export function servingsFor(entry: LibraryEntry, qty: number, unit: string | null): number {
  const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1
  if (entry.kind === 'custom') return round(safeQty, 2)

  const serving = entry.food.serving
  if (!unit) return round(safeQty, 2)
  if (unit === serving.unit) return round(safeQty, 2)

  const gramsPerUnit = UNIT_GRAMS[unit] ?? 0
  if (gramsPerUnit > 0 && serving.grams > 0) {
    return round((safeQty * gramsPerUnit) / serving.grams, 2)
  }
  // Countable units ("2 slices") against a food measured in pieces, &c.
  return round(safeQty, 2)
}

function nutritionFor(entry: LibraryEntry, servings: number): ServingNutrition {
  if (entry.kind === 'custom') {
    const { calories, protein, carbs, fat } = entry.food
    return {
      kcal: Math.round(calories * servings),
      protein: round(protein * servings, 1),
      carbs: round(carbs * servings, 1),
      fat: round(fat * servings, 1),
    }
  }
  return servingNutrition(entry.food, servings)
}

function bestMatch(query: string, custom: CustomFood[]): LibraryEntry | null {
  const trimmed = query.trim()
  if (trimmed.length < 2) return null

  // The user's own foods always win, even over the generic aliases below.
  const ownKey = normalizeSearchText(trimmed)
  const own = custom.find((food) => normalizeSearchText(food.name) === ownKey)
  if (own) return { kind: 'custom', food: own }

  // "rice" / "خبز" / "هێلکە" — plain words beat composite dishes.
  const generic = findGenericFood(trimmed)
  if (generic) return { kind: 'bundled', food: generic }

  const direct = searchLibrary({ query: trimmed, custom, limit: 1 })
  if (direct.entries.length > 0) return direct.entries[0]

  // "grilled chicken breast with herbs" — fall back to the last two words,
  // which is usually the actual food ("chicken breast").
  const tokens = trimmed.split(' ').filter(Boolean)
  for (const slice of [tokens.slice(-2).join(' '), tokens.at(-1) ?? '']) {
    if (slice.length < 2) continue
    const result = searchLibrary({ query: slice, custom, limit: 1 })
    if (result.entries.length > 0) return result.entries[0]
  }
  return null
}

/** Resolves every parsed segment, keeping the order the person wrote them in. */
export function resolveItems(segments: ParsedSegment[], custom: CustomFood[]): ResolveResult {
  const items: ResolvedItem[] = []
  const unmatched: string[] = []
  const seen = new Map<string, ResolvedItem>()

  for (const segment of segments) {
    const entry = bestMatch(segment.query, custom)
    if (!entry) {
      if (segment.query.trim()) unmatched.push(segment.query.trim())
      continue
    }

    const servings = servingsFor(entry, segment.qty, segment.unit)
    const id = entry.kind === 'custom' ? `custom:${entry.food.id}` : entry.food.id

    // "rice and rice" collapses into one line with the quantities added up.
    const existing = seen.get(id)
    if (existing && existing.unit === segment.unit) {
      existing.qty = round(existing.qty + segment.qty, 2)
      existing.servings = round(existing.servings + servings, 2)
      existing.nutrition = nutritionFor(entry, existing.servings)
      continue
    }

    const item: ResolvedItem = {
      entry,
      query: segment.query.trim(),
      qty: segment.qty,
      unit: segment.unit,
      servings,
      nutrition: nutritionFor(entry, servings),
    }
    seen.set(id, item)
    items.push(item)
  }

  return { items, unmatched }
}

/** Totals for a list of resolved items. */
export function sumItems(items: ResolvedItem[]): ServingNutrition & { count: number } {
  return items.reduce(
    (accumulator, item) => ({
      kcal: accumulator.kcal + item.nutrition.kcal,
      protein: round(accumulator.protein + item.nutrition.protein, 1),
      carbs: round(accumulator.carbs + item.nutrition.carbs, 1),
      fat: round(accumulator.fat + item.nutrition.fat, 1),
      count: accumulator.count + 1,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
  )
}
