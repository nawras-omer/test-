/**
 * Generic food names → canonical database entries.
 *
 * Search ranks composite dishes ("Rice cakes", "Rice pilaf") above the plain
 * ingredient for a one-word query, which is right for browsing the library and
 * wrong for "I ate 2 cups of rice". These aliases pin the everyday words
 * people actually type to the plain food, in all three languages; anything not
 * listed here still goes through the normal search ranking.
 */
import { FOODS } from '@/data/foods'
import { normalizeSearchText } from '@/data/foods'

/** canonical id → the everyday names that mean it (en + ar + ckb). */
export const GENERIC_FOODS: Record<string, string[]> = {
  'grains:white-rice-cooked': ['rice', 'white rice', 'cooked rice', 'ارز', 'ارز ابيض', 'ارز مطبوخ', 'برنج', 'برنجی سپی', 'برنجی کوڵاو'],
  'grains:white-bread': ['bread', 'slice of bread', 'خبز', 'خبز ابيض', 'نان', 'نانی سپی', 'نانی'],
  'proteins:chicken-breast': ['chicken', 'chicken breast', 'grilled chicken', 'دجاج', 'صدر دجاج', 'مریشک', 'سنگی مریشک'],
  'proteins:chicken-thigh': ['chicken thigh', 'فخذ دجاج', 'ڕانی مریشک'],
  'proteins:egg': ['egg', 'eggs', 'boiled egg', 'بيض', 'بيضة', 'هێلکە', 'هێلکە کوڵاو'],
  'proteins:ground-beef-85': ['beef', 'ground beef', 'minced beef', 'لحم بقري', 'لحم مفروم', 'گۆشتی ئازار', 'گۆشتی ماخە'],
  'proteins:salmon': ['fish', 'salmon', 'سمك', 'سلمون', 'ماسی', 'سەلمۆن'],
  'proteins:canned-tuna-water': ['tuna', 'تونة', 'تونا'],
  'dairy:milk-2': ['milk', 'حليب', 'شیر', 'شیری'],
  'dairy:yogurt-whole': ['yogurt', 'yoghurt', 'زبادي', 'يوغرت', 'ماست'],
  'dairy:cheddar': ['cheese', 'جبن', 'جبنة', 'پەنیر'],
  'fats:olive-oil': ['oil', 'olive oil', 'زيت', 'زيت زيتون', 'ڕۆن', 'زەیتی زەیتوون'],
  'fats:tahini': ['tahini', 'طحينة', 'تەحینە'],
  'legumes:lentils-cooked': ['lentils', 'lentil', 'عدس', 'نیسک'],
  'legumes:chickpeas-cooked': ['chickpeas', 'chickpea', 'حمص', 'نۆک'],
  'legumes:white-beans-cooked': ['beans', 'white beans', 'فاصولياء', 'فول', 'فاسۆلیا'],
  'nuts:almonds': ['almonds', 'almond', 'لوز', 'بادەم'],
  'nuts:walnuts': ['walnuts', 'walnut', 'جوز', 'گوێزی'],
  'vegetables:boiled-potato': ['potato', 'potatoes', 'boiled potato', 'بطاطس', 'بطاطا', 'پەتاتە'],
  'vegetables:tomato': ['tomato', 'tomatoes', 'طماطم', 'بندورة', 'تەماتە'],
  'vegetables:cucumber': ['cucumber', 'خيار', 'ئەیار'],
  'vegetables:spinach': ['spinach', 'سبانخ', 'سپێناخ'],
  'vegetables:broccoli': ['broccoli', 'بروكلي', 'برۆکلی'],
  'vegetables:carrot': ['carrot', 'carrots', 'جزر', 'گێزەر'],
  'vegetables:onion': ['onion', 'onions', 'بصل', 'پیاز'],
  'fruits:apple': ['apple', 'apples', 'تفاح', 'تفاحة', 'سێو'],
  'fruits:banana': ['banana', 'bananas', 'موز', 'مۆز'],
  'fruits:orange': ['orange', 'برتقال', 'پرتەقاڵ'],
  'fruits:strawberry': ['strawberries', 'strawberry', 'فراولة', 'فڕاولە', 'توفراولە'],
  'fruits:date': ['dates', 'date', 'تمر', 'بلح', 'خورما'],
  'beverages:water': ['water', 'ماء', 'ئاو'],
  'grains:spaghetti-cooked': ['pasta', 'spaghetti', 'معكرونة', 'سباغيتي', 'پاستا', 'ماکارۆنی'],
  'dairy:yogurt-low-fat': ['low fat yogurt', 'زبادي قليل الدسم', 'ماستی کەم چەوری'],
}

/** Normalised alias → food id, built once and checked for typos below. */
const ALIAS_INDEX: Map<string, string> = (() => {
  const index = new Map<string, string>()
  for (const [id, aliases] of Object.entries(GENERIC_FOODS)) {
    if (!FOODS.some((food) => food.id === id)) {
      // A typo here would silently disable an alias — fail loudly instead.
      throw new Error(`assistant: generic food id "${id}" is not in the food database`)
    }
    for (const alias of aliases) index.set(normalizeSearchText(alias), id)
  }
  return index
})()

const BY_ID = new Map(FOODS.map((food) => [food.id, food]))

/**
 * Everyday words arrive inflected: "bananas", "بيضات", "الماء", "موزة". Try the
 * few regular forms Arabic, Kurdish and English use before giving up.
 */
function candidateKeys(key: string): string[] {
  const keys = [key]
  if (key.endsWith('s')) keys.push(key.slice(0, -1))
  if (key.endsWith('es')) keys.push(key.slice(0, -2))
  if (key.endsWith('\u06D5')) keys.push(key.slice(0, -1))
  if (key.endsWith('\u0627\u062A')) keys.push(key.slice(0, -2))
  if (key.startsWith('\u0627\u0644') && key.length > 4) keys.push(key.slice(2))
  for (const suffix of ['\u06CC', '\u06A9']) {
    if (key.endsWith(suffix) && key.length > 4) keys.push(key.slice(0, -1))
  }
  return keys
}

/** Looks a plain everyday word up in the alias table (inflection tolerated). */
export function findGenericFood(query: string) {
  const key = normalizeSearchText(query)
  if (!key) return null
  for (const candidate of candidateKeys(key)) {
    const id = ALIAS_INDEX.get(candidate)
    if (id) return BY_ID.get(id) ?? null
  }
  return null
}

/** Sanity counters used by the tests. */
export const GENERIC_FOOD_COUNT = ALIAS_INDEX.size
