/**
 * Search + presentation helpers for the food library.
 *
 * The bundled database (`@/data/foods`) is assembled once into a small index:
 * every name and synonym is normalised up front, so matching a query against
 * 1,000+ foods is a handful of string checks. Ranking favours exact names, then
 * prefixes, then synonyms, and finally anything the haystack happens to contain
 * (slugs included), so "peanut butter" finds `peanuts:peanut-butter` too.
 *
 * Custom foods live in the same result list as bundled ones — they are wrapped
 * in the same `LibraryEntry` union so the UI never has to branch.
 */
import { FOODS, normalizeSearchText, servingNutrition } from '@/data/foods'
import type { Food, FoodCategory, ServingNutrition } from '@/data/foods'
import type { CustomFood, FoodLogPrefill, Locale } from '@/types'
import type { TranslationKey } from '@/i18n'

/** Anything that can be shown in the library and used to prefill the log dialog. */
export type LibraryEntry =
  | { kind: 'bundled'; food: Food }
  | { kind: 'custom'; food: CustomFood }

/** Category filter value — the 12 categories plus two pseudo-filters. */
export type LibraryFilter = FoodCategory | 'all' | 'custom'

export const ALL_FILTER: LibraryFilter = 'all'
export const CUSTOM_FILTER: LibraryFilter = 'custom'

export interface SearchOptions {
  query?: string
  filter?: LibraryFilter
  /** The signed-in user's personal foods. */
  custom?: CustomFood[]
  /** Cap on returned rows — the UI shows "n of total". */
  limit?: number
}

export interface SearchResult {
  entries: LibraryEntry[]
  /** Matches before the limit was applied. */
  total: number
}

/* ------------------------------------------------------------------- index -- */

interface IndexedFood {
  food: Food
  /** Normalised names, one per locale, for ranking. */
  names: string[]
  /** Normalised synonyms. */
  alts: string[]
  haystack: string
  /** Tie-breaker so shorter/earlier entries win equal scores. */
  order: number
}

const CATEGORY_ORDER = new Map(FOODS.map((food, index) => [food.id, index]))

const INDEX: IndexedFood[] = FOODS.map((food) => ({
  food,
  names: [food.names.en, food.names.ar, food.names.ckb].map(normalizeSearchText),
  alts: [food.alts.en, food.alts.ar, food.alts.ckb]
    .filter((alt): alt is string => Boolean(alt))
    .map(normalizeSearchText),
  haystack: food.search,
  order: CATEGORY_ORDER.get(food.id) ?? 0,
}))

function normaliseCustom(food: CustomFood): string {
  return normalizeSearchText(food.name)
}

/* ------------------------------------------------------------------ naming -- */

/** Display name in the active locale; synonyms fall back to the English name. */
export function entryName(entry: LibraryEntry, locale: Locale): string {
  if (entry.kind === 'custom') return entry.food.name
  return entry.food.names[locale] || entry.food.names.en
}

/**
 * Secondary line: the English name when the UI is not in English (handy when
 * someone searches in a different script), or the user's own serving text.
 */
export function entryDetail(entry: LibraryEntry, locale: Locale): string | null {
  if (entry.kind === 'custom') return entry.food.servingSize || null
  if (locale === 'en') return null
  const english = entry.food.names.en
  return english && english !== entry.food.names[locale] ? english : null
}

/** Nutrition for one serving of the library entry. */
export function entryNutrition(entry: LibraryEntry): ServingNutrition {
  if (entry.kind === 'custom') {
    return {
      kcal: Math.round(entry.food.calories),
      protein: entry.food.protein,
      carbs: entry.food.carbs,
      fat: entry.food.fat,
    }
  }
  return servingNutrition(entry.food, 1)
}

/** Serving description for one serving, e.g. `1 cup · 240 g`. */
export function entryServing(entry: LibraryEntry, t: (key: TranslationKey) => string): string {
  if (entry.kind === 'custom') return entry.food.servingSize || t('library.serving.one')
  const { qty, unit, grams } = entry.food.serving
  return `${qty} ${t(`unit.${unit}` as TranslationKey)} · ${grams} ${t('common.g')}`
}

/**
 * What the food-logging dialog should contain when this entry is clicked.
 * The name is written in the language the person is logging in, so the diary
 * reads naturally for them.
 */
export function entryPrefill(
  entry: LibraryEntry,
  locale: Locale,
  t: (key: TranslationKey) => string,
): FoodLogPrefill {
  const nutrition = entryNutrition(entry)
  const name = entryName(entry, locale)
  return {
    name,
    servingSize: entryServing(entry, t),
    calories: String(nutrition.kcal),
    protein: nutrition.protein ? String(nutrition.protein) : '',
    carbs: nutrition.carbs ? String(nutrition.carbs) : '',
    fat: nutrition.fat ? String(nutrition.fat) : '',
  }
}

/* ------------------------------------------------------------------ search -- */

/** Score below which a row is not considered a match at all. */
const NO_MATCH = 0

function scoreIndexed(entry: IndexedFood, query: string, tokens: string[]): number {
  if (!tokens.every((token) => entry.haystack.includes(token))) return NO_MATCH

  let total = 0
  for (const token of tokens) {
    let best = NO_MATCH
    for (const name of entry.names) {
      if (name === token) best = Math.max(best, 120)
      else if (name.startsWith(token)) best = Math.max(best, 80)
      else if (name.includes(token)) best = Math.max(best, 55)
    }
    for (const alt of entry.alts) {
      if (alt === token) best = Math.max(best, 105)
      else if (alt.includes(token)) best = Math.max(best, 45)
    }
    // Matched somewhere in the haystack (a slug segment, e.g. "peanut butter").
    if (best === NO_MATCH) best = 25
    total += best
  }

  const average = total / tokens.length
  // Whole-phrase hit on a name is the strongest signal there is.
  let bonus = entry.haystack.includes(query) ? 18 : 0
  for (const name of entry.names) {
    if (name.startsWith(query)) {
      bonus += 25
      break
    }
  }
  // Prefer shorter names ("Apple" over "Apple pie") and earlier rows on ties.
  const lengthPenalty = Math.min(entry.names[0].length, 40) * 0.4
  return average + bonus - lengthPenalty
}

function scoreCustom(food: CustomFood, query: string, tokens: string[]): number {
  const haystack = normaliseCustom(food)
  if (!tokens.every((token) => haystack.includes(token))) return NO_MATCH
  // A personal food is what the person meant when it matches at all.
  return haystack === query ? 200 : haystack.startsWith(query) ? 150 : 120
}

/**
 * Filters and ranks the library. With no query this is plain category browsing;
 * with one it is a ranked multi-language search. `total` is the match count
 * before `limit`, so the UI can say "showing 60 of 214".
 */
export function searchLibrary({ query = '', filter = ALL_FILTER, custom = [], limit }: SearchOptions = {}): SearchResult {
  const trimmed = query.trim()
  const normalisedQuery = normalizeSearchText(trimmed)
  const tokens = normalisedQuery ? normalisedQuery.split(' ').filter(Boolean) : []
  const includeCustom = filter === ALL_FILTER || filter === CUSTOM_FILTER
  const includeBundled = filter !== CUSTOM_FILTER

  const customMatches: Array<{ entry: LibraryEntry; score: number }> = []
  if (includeCustom) {
    for (const food of custom) {
      const score = tokens.length === 0 ? 1000 : scoreCustom(food, normalisedQuery, tokens)
      if (score <= NO_MATCH) continue
      customMatches.push({ entry: { kind: 'custom', food }, score })
    }
  }

  const bundledMatches: Array<{ entry: LibraryEntry; score: number; order: number }> = []
  if (includeBundled) {
    for (const indexed of INDEX) {
      if (filter !== ALL_FILTER && indexed.food.category !== filter) continue
      const score = tokens.length === 0 ? 1000 : scoreIndexed(indexed, normalisedQuery, tokens)
      if (score <= NO_MATCH) continue
      bundledMatches.push({ entry: { kind: 'bundled', food: indexed.food }, score, order: indexed.order })
    }
  }

  customMatches.sort((a, b) => b.score - a.score)
  bundledMatches.sort((a, b) => b.score - a.score || a.order - b.order)

  const all = [...customMatches.map((match) => match.entry), ...bundledMatches.map((match) => match.entry)]
  const total = all.length
  return { entries: limit === undefined ? all : all.slice(0, limit), total }
}

/** O(1) lookup for the assistant, which stores foods by id. */
const BY_ID = new Map(FOODS.map((food) => [food.id, food]))

/**
 * Resolves a stored food id back to a library entry. Custom ids are prefixed
 * `custom:` because the two id spaces are otherwise independent.
 */
export function findEntryById(id: string, custom: CustomFood[] = []): LibraryEntry | null {
  if (id.startsWith('custom:')) {
    const food = custom.find((row) => row.id === id.slice('custom:'.length))
    return food ? { kind: 'custom', food } : null
  }
  const food = BY_ID.get(id)
  return food ? { kind: 'bundled', food } : null
}

/** Example queries shown as chips under the search box. */
export const SEARCH_SUGGESTIONS: TranslationKey[] = [
  'library.search.example.apple',
  'library.search.example.chicken',
  'library.search.example.rice',
  'library.search.example.yogurt',
]
