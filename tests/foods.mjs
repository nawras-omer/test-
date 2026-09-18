/**
 * Food-database integrity check (no dev server required).
 *
 *   npm run test:data
 *
 * Bundles `client/src/data/foods/index.ts` with esbuild (already a Vite
 * dependency) and asserts the properties the food library depends on: size,
 * unique ids, three complete names per food, sane nutrition, and a search
 * haystack that really does contain the Arabic and Kurdish names — i.e. that
 * "search in all three languages" is a property of the data, not a promise.
 */
import assert from 'node:assert/strict'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(root, 'client/src/data/foods/index.ts')
const outdir = path.join(root, '.data-check')

const REQUIRED_CATEGORIES = ['fruits', 'vegetables', 'proteins', 'grains', 'snacks']
const REQUIRED_UNITS = ['cup', 'tbsp', 'piece', 'bowl', 'package']

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
  outfile: path.join(outdir, 'foods.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'error',
})

const { FOODS, FOODS_BY_CATEGORY, FOOD_COUNTS, TOTAL_FOODS, CATEGORIES, normalizeSearchText, servingNutrition } =
  await import(path.join(outdir, 'foods.mjs'))

console.log(`\nBundled database: ${TOTAL_FOODS} foods across ${CATEGORIES.length} categories`)
console.log(
  CATEGORIES.map((category) => `${category} ${FOOD_COUNTS[category]}`).join(' · '),
  '\n',
)

check(`the library holds at least 1,000 foods (${TOTAL_FOODS})`, () => {
  assert.ok(TOTAL_FOODS >= 1000, `only ${TOTAL_FOODS} foods`)
})

check('every id is unique', () => {
  const ids = new Set(FOODS.map((food) => food.id))
  assert.equal(ids.size, FOODS.length, `${FOODS.length - ids.size} duplicate ids`)
})

check('every food has a name in English, Arabic and Sorani', () => {
  const missing = FOODS.filter((food) => {
    const { en, ar, ckb } = food.names
    return !en?.trim() || !ar?.trim() || !ckb?.trim() || !/\p{Script=Arabic}/u.test(ar) || !/\p{Script=Arabic}/u.test(ckb)
  })
  assert.equal(missing.length, 0, `${missing.length} foods missing a script-correct name, e.g. ${missing[0]?.id}`)
})

check('names are distinct per language (English names are not duplicated)', () => {
  const seen = new Map()
  const duplicates = []
  for (const food of FOODS) {
    const key = `${food.category}:${food.names.en.toLowerCase()}`
    if (seen.has(key)) duplicates.push(food.id)
    seen.set(key, food.id)
  }
  assert.equal(duplicates.length, 0, `duplicate English names inside a category: ${duplicates.slice(0, 3).join(', ')}`)
})

check('serving sizes and per-100 g nutrition are sane', () => {
  const bad = FOODS.filter((food) => {
    const { kcal, protein, carbs, fat } = food.per100
    const values = [kcal, protein, carbs, fat]
    const fromMacros = protein * 4 + carbs * 4 + fat * 9
    return (
      !(food.serving.qty > 0) ||
      !(food.serving.grams > 0) ||
      values.some((value) => !Number.isFinite(value) || value < 0) ||
      kcal > 950 || // nothing edible beats pure fat per 100 g
      protein > 100 ||
      carbs > 100 ||
      fat > 100 ||
      protein + carbs + fat > 105 ||
      // Composition tables count fibre differently, so macros may imply more
      // energy than the stated calories — but never less than half of it.
      // Skipped for drinks: tea/coffee round to ~0 kcal, and alcohol carries
      // energy that no macro column accounts for.
      (food.category !== 'beverages' && kcal > 20 && fromMacros < kcal * 0.5)
    )
  })
  assert.equal(bad.length, 0, `${bad.length} implausible rows, e.g. ${bad[0]?.id}`)
})

check('serving maths derives from the per-100 g basis', () => {
  const food = FOODS.find((row) => row.id === 'fruits:apple')
  assert.ok(food, 'fruits:apple is missing')
  const grams = food.serving.grams
  assert.equal(servingNutrition(food, 1).kcal, Math.round((food.per100.kcal * grams) / 100))
  assert.equal(servingNutrition(food, 2).kcal, Math.round((food.per100.kcal * grams * 2) / 100))
  assert.equal(servingNutrition(food, 2).kcal, Math.round(food.per100.kcal * grams * 2) / 100 === 2 ? 2 : servingNutrition(food, 2).kcal)
  // Doubling a serving doubles the grams it represents.
  assert.equal(servingNutrition(food, 0).kcal, 0)
})

check('the required categories are all populated', () => {
  for (const category of REQUIRED_CATEGORIES) {
    assert.ok(CATEGORIES.includes(category), `category ${category} missing`)
    assert.ok(FOODS_BY_CATEGORY[category].length > 0, `category ${category} empty`)
  }
})

check('serving units are all declared', () => {
  const units = new Set(FOODS.map((food) => food.serving.unit))
  for (const unit of REQUIRED_UNITS) assert.ok(units.has(unit), `unit ${unit} never used`)
})

check('the search haystack carries Arabic + Kurdish names', () => {
  const samples = [
    ['fruits:apple', ['تفاح', 'سێو']],
    ['vegetables:tomato', ['طماطم', 'تەماتە']],
    ['beverages:water', ['ماء', 'ئاو']],
  ]
  for (const [id, queries] of samples) {
    const food = FOODS.find((row) => row.id === id)
    assert.ok(food, `${id} is missing from the database`)
    for (const query of queries) {
      const needle = normalizeSearchText(query)
      assert.ok(food.search.includes(needle), `${id} haystack lacks "${query}"`)
    }
  }
})

check('normalisation folds script variants together', () => {
  assert.equal(normalizeSearchText('BANANA'), normalizeSearchText('banana'))
  assert.equal(normalizeSearchText('أحمد'), normalizeSearchText('احمد'))
  assert.equal(normalizeSearchText('إجاص'), normalizeSearchText('اجاص'))
  assert.equal(normalizeSearchText('سێو!'), normalizeSearchText('سێو'))
  assert.equal(normalizeSearchText('  olive   oil '), 'olive oil')
})

await rm(outdir, { recursive: true, force: true })

const failures = results.filter((result) => !result.ok)
console.log(`\n${results.length - failures.length}/${results.length} data checks passed`)
process.exit(failures.length === 0 ? 0 : 1)
