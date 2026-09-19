/**
 * Assistant engine checks (no server, no browser).
 *
 *   npm run test:assistant
 *
 * Bundles `client/src/lib/assistant/` with esbuild and drives the real
 * tokeniser/resolver through sentences in all three languages — the part of
 * the chatbot that is easiest to get subtly wrong.
 */
import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(root, 'client/src/lib/assistant/index.ts')
const outdir = path.join(root, '.data-check')

const GOALS = { calories: 2150, protein: 140, carbs: 240, fat: 70 }
const TOTALS = { calories: 900, protein: 60, carbs: 100, fat: 30, count: 2 }

const results = []
const check = (label, fn) => {
  try {
    fn()
    results.push({ label, ok: true })
    console.log(`PASS  ${label}`)
  } catch (error) {
    results.push({ label, ok: false, error })
    console.log(`FAIL  ${label}\n      ${error.message.split('\n')[0]}`)
  }
}

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

await build({
  entryPoints: [entry],
  outfile: path.join(outdir, 'assistant.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'error',
  alias: { '@': path.join(root, 'client/src') },
})

const { plan, parseUtterance, resolveItems, sumItems, servingsFor } = await import(path.join(outdir, 'assistant.mjs'))

/** Fresh context per call so tests cannot leak state into each other. */
const contextFor = (overrides = {}) => ({
  locale: 'en',
  custom: [],
  goals: GOALS,
  totals: TOTALS,
  remaining: GOALS.calories - TOTALS.calories,
  profile: { sex: 'female', age: 31, heightCm: 165, weightKg: 62, activity: 'light', targetWeightKg: 58 },
  now: new Date('2026-01-01T12:00:00'),
  ...overrides,
})

const classify = (text) => parseUtterance(text)
const act = (text, overrides) => plan(text, contextFor(overrides))

/* -------------------------------------------------------------- intents -- */

const INTENT_CASES = [
  ['I ate a chicken breast and rice', 'log'],
  ['I had 2 eggs for breakfast', 'log'],
  ['logged a bowl of yogurt', 'log'],
  ['how many calories in an apple?', 'estimate'],
  ['how much protein is in a chicken breast', 'estimate'],
  ['what should I eat for dinner?', 'suggest'],
  ['suggest a snack', 'suggest'],
  ['how am I doing today?', 'summary'],
  ['what can you do?', 'help'],
  ['hello', 'greeting'],
  ['thanks!', 'thanks'],
  ['أكلت تفاحة وموزة', 'log'],
  ['شربت كوب حليب', 'log'],
  ['كم سعرة في تفاحة؟', 'estimate'],
  ['ماذا آكل على الغداء؟', 'suggest'],
  ['كيف حالي اليوم؟', 'summary'],
  ['مساعدة', 'help'],
  ['خواردم ٢ هێلکە و نان', 'log'],
  ['چەند کالۆری لە سێو؟', 'estimate'],
  ['پێشنیار بۆ شێو بدە', 'suggest'],
  ['ڕاپۆرت', 'summary'],
]

for (const [sentence, expected] of INTENT_CASES) {
  check(`intent "${sentence}" → ${expected}`, () => {
    assert.equal(classify(sentence).intent, expected)
  })
}

/* ------------------------------------------------------------ food lists -- */

check('"I ate a chicken breast and rice" resolves two foods', () => {
  const parsed = classify('I ate a chicken breast and rice')
  assert.equal(parsed.segments.length, 2, JSON.stringify(parsed.segments))
  const { items } = resolveItems(parsed.segments, [])
  assert.equal(items.length, 2, JSON.stringify(items.map((item) => item.query)))
  const names = items.map((item) => item.entry.food.names.en.toLowerCase())
  assert.ok(names.some((name) => name.includes('chicken')), names.join(' | '))
  assert.ok(names.some((name) => name.includes('rice')), names.join(' | '))
  assert.ok(sumItems(items).kcal > 100, String(sumItems(items).kcal))
})

check('Arabic list resolves apple + banana', () => {
  const { items } = resolveItems(classify('أكلت تفاحة وموزة').segments, [])
  const names = items.map((item) => item.entry.food.names.en.toLowerCase())
  assert.equal(items.length, 2, names.join(' | '))
  assert.ok(names.some((name) => name.includes('apple')), names.join(' | '))
  assert.ok(names.some((name) => name.includes('banana')), names.join(' | '))
})

check('Sorani list resolves eggs + bread', () => {
  const { items } = resolveItems(classify('خواردم ٢ هێلکە و نان').segments, [])
  const names = items.map((item) => item.entry.food.names.en.toLowerCase())
  assert.equal(items.length, 2, names.join(' | '))
  assert.ok(names.some((name) => name.includes('egg')), names.join(' | '))
  assert.ok(
    items.some((item) => item.entry.kind === 'bundled' && item.entry.food.category === 'grains'),
    names.join(' | '),
  )
})

check('Arabic-Indic digits survive tokenising', () => {
  const parsed = classify('خواردم ٢ هێلکە')
  assert.equal(parsed.segments[0].qty, 2, JSON.stringify(parsed.segments))
})

check('quantities carry through ("2 cups of rice")', () => {
  const parsed = classify('I ate 2 cups of rice')
  const { items } = resolveItems(parsed.segments, [])
  assert.equal(items[0].qty, 2)
  assert.equal(items[0].unit, 'cup')
  assert.ok(items[0].servings >= 1, String(items[0].servings))
  assert.ok(items[0].nutrition.kcal > 300, String(items[0].nutrition.kcal))
})

check('grams convert to servings ("150 g chicken breast")', () => {
  const { items } = resolveItems(classify('I ate 150 g chicken breast').segments, [])
  assert.equal(items[0].unit, 'g')
  const servingGrams = items[0].entry.food.serving.grams
  assert.equal(items[0].servings, Math.round((150 / servingGrams) * 100) / 100)
  const expected = Math.round((items[0].entry.food.per100.kcal * 150) / 100)
  assert.ok(Math.abs(items[0].nutrition.kcal - expected) <= 2, `${items[0].nutrition.kcal} vs ${expected}`)
})

check('"half a cup" is read as 0.5', () => {
  const parsed = classify('I had half a cup of milk')
  assert.equal(parsed.segments[0].qty, 0.5, JSON.stringify(parsed.segments))
})

check('a count of a countable food ("3 dates") scales the serving', () => {
  const { items } = resolveItems(classify('I ate 3 dates').segments, [])
  assert.equal(items[0].qty, 3)
  assert.ok(items[0].nutrition.kcal > 30, String(items[0].nutrition.kcal))
})

/* --------------------------------------------------------------- planes -- */

check('a log sentence plans a diary write', () => {
  const result = act('I ate a chicken breast and rice')
  assert.equal(result.kind, 'reply.log')
  assert.equal(result.items.length, 2)
  assert.ok(result.totals.kcal > 100)
  assert.equal(result.mealType, 'lunch')
})

check('the meal name in the sentence wins', () => {
  assert.equal(act('I had 2 eggs for breakfast').mealType, 'breakfast')
  assert.equal(act('خواردم ٢ هێلکە بۆ بەیانیان').mealType, 'breakfast')
})

check('a question estimates instead of logging', () => {
  const result = act('how many calories in a bowl of rice?')
  assert.equal(result.kind, 'reply.foodInfo')
  assert.ok(result.item.nutrition.kcal > 0)
})

check('a single food question answers with its numbers', () => {
  const result = act('how much protein is in a chicken breast', { locale: 'en' })
  assert.equal(result.kind, 'reply.foodInfo')
  assert.ok(result.item.nutrition.protein > 15, String(result.item.nutrition.protein))
})

check('"how am I doing" summarises the day', () => {
  const result = act('how am I doing today?')
  assert.equal(result.kind, 'reply.summary')
  assert.equal(result.totals.calories, 900)
  assert.equal(result.remaining, 1250)
  assert.equal(result.percent, 42)
})

check('a nutrition topic answers from the knowledge base', () => {
  const protein = act('how much protein do I need?')
  assert.equal(protein.kind, 'reply.topic')
  assert.equal(protein.topic, 'protein')
  assert.equal(protein.values.goal, 140)
  assert.equal(protein.values.perMeal, 47)
  const water = act('how much water should I drink')
  assert.equal(water.kind, 'reply.topic')
  assert.equal(water.topic, 'water')
  assert.ok(water.values.litres > 1.5, String(water.values.litres))
})

check('a one-word food lookup answers with the food card', () => {
  const result = act('apple')
  assert.equal(result.kind, 'reply.foodInfo')
  assert.ok(result.item.entry.food.names.en.toLowerCase().includes('apple'))
})

check('a comparison returns every food mentioned', () => {
  const result = act('compare chicken vs beef protein')
  assert.equal(result.kind, 'reply.compare')
  assert.ok(result.items.length >= 2, JSON.stringify(result.items.map((item) => item.query)))
})

check('nonsense falls back with suggestions', () => {
  const result = act('zzz qwerty')
  assert.equal(result.kind, 'reply.fallback')
  assert.ok(Array.isArray(result.didYouMean))
})

check('greetings and thanks stay conversational', () => {
  assert.equal(act('hello').kind, 'reply.greeting')
  assert.equal(act('سڵاو').kind, 'reply.greeting')
  assert.equal(act('شكرا').kind, 'reply.thanks')
})

/* ------------------------------------------------------------ suggestions -- */

check('meal suggestions respect the remaining budget', () => {
  const result = act('what should I eat for dinner?', { remaining: 700 })
  assert.equal(result.kind, 'reply.suggest')
  assert.equal(result.suggestions.length, 3)
  for (const suggestion of result.suggestions) {
    assert.ok(suggestion.nutrition.kcal > 0)
    assert.ok(['protein', 'light', 'balanced'].includes(suggestion.reason))
  }
  assert.equal(result.note, 'ok')
})

check('suggestions are meal-appropriate', () => {
  const breakfast = act('suggest breakfast', { remaining: 900 })
  const dinner = act('suggest dinner', { remaining: 900 })
  assert.equal(breakfast.kind, 'reply.suggest')
  const breakfastCategories = breakfast.suggestions.map((item) => item.entry.food.category)
  assert.ok(
    breakfastCategories.some((category) => ['dairy', 'grains', 'fruits', 'proteins'].includes(category)),
    breakfastCategories.join(','),
  )
  assert.notDeepEqual(
    breakfast.suggestions.map((item) => item.entry.food.id),
    dinner.suggestions.map((item) => item.entry.food.id),
  )
})

check('suggestions flag a tight budget', () => {
  const result = act('what can I eat', { remaining: 120 })
  assert.equal(result.kind, 'reply.suggest')
  assert.ok(['tight', 'over'].includes(result.note), result.note)
  assert.ok(result.suggestions.length > 0)
})

check('custom foods can be suggested sources too (resolver)', () => {
  const custom = [
    {
      id: 'c1',
      name: 'Grandma soup',
      servingSize: '1 bowl',
      calories: 180,
      protein: 9,
      carbs: 20,
      fat: 6,
      createdAt: '',
      updatedAt: '',
    },
  ]
  const { items } = resolveItems(classify('I ate a bowl of grandma soup').segments, custom)
  assert.equal(items.length, 1)
  assert.equal(items[0].entry.kind, 'custom')
  assert.equal(items[0].nutrition.kcal, 180)
})

check('unknown quantities default to one serving', () => {
  const entry = { kind: 'bundled', food: { serving: { qty: 1, unit: 'cup', grams: 200 } } }
  assert.equal(servingsFor(entry, 1, null), 1)
  assert.equal(servingsFor(entry, 2, 'cup'), 2)
  assert.equal(servingsFor(entry, 400, 'g'), 2)
})

await rm(outdir, { recursive: true, force: true })

const failures = results.filter((result) => !result.ok)
console.log(`\n${results.length - failures.length}/${results.length} assistant checks passed`)
if (failures.length) console.log('failed:\n - ' + failures.map((f) => f.label).join('\n - '))
process.exit(failures.length === 0 ? 0 : 1)
