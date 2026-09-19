/**
 * Multilingual vocabulary for the assistant.
 *
 * Everything here is matched against text that has already been through
 * `normalizeSearchText` (lowercase, no diacritics, folded Arabic/Kurdish
 * letter variants, punctuation → single spaces), so entries in this file must
 * be written in that same plain form: `أكلت` is stored as `اكلت`, `سێو` stays
 * as it is, and capitalisation never matters.
 *
 * Matching is whole-word: both the text and each phrase are padded with
 * spaces, which keeps "hi" out of "chicken" while still allowing multi-word
 * phrases like "how many calories".
 */
import { normalizeSearchText, type ServingUnit } from '@/data/foods'
import type { MealType } from '@/types'

/**
 * Pads a phrase so `includes` behaves like a whole-word search, after running
 * it through the app's search normaliser. This is essential: normalisation
 * folds Arabic kaf/teh-marbuta into their Kurdish forms (ك→ک, ة→ە), so a
 * vocabulary entry written in plain Arabic must be folded exactly like the
 * sentence it is compared against.
 */
const phraseCache = new Map<string, string>()

export function phrase(term: string): string {
  const cached = phraseCache.get(term)
  if (cached !== undefined) return cached
  const value = ` ${normalizeSearchText(term)} `
  phraseCache.set(term, value)
  return value
}

/** True when the (already normalised, padded) `haystack` contains a phrase. */
export function hasAny(haystack: string, phrases: readonly string[]): boolean {
  return phrases.some((candidate) => haystack.includes(phrase(candidate)))
}

/** Returns the first phrase found — useful to pick a topic or a meal. */
export function firstMatch(haystack: string, phrases: readonly string[]): string | null {
  return phrases.find((candidate) => haystack.includes(phrase(candidate))) ?? null
}

/* ------------------------------------------------------------------ intents -- */

/** "I ate…" — the user wants the food logged. */
export const LOG_VERBS = [
  'ate', 'eat', 'eaten', 'eating', 'had', 'have', 'having', 'drank', 'drink', 'logged', 'log',
  'add', 'added', 'record', 'recorded', 'track', 'tracked',
  'اكلت', 'أكلت', 'تناولت', 'شربت', 'سجل', 'سجلت', 'اضف', 'أضف', 'اضفلي',
  'خواردم', 'خواردوومه', 'خوارد', 'نووسی', 'نوسی', 'زیاد بکه', 'تۆمار بکه', 'تۆمارکرد',
]

/** "How many calories…" — estimate, do not log. */
export const QUESTION_WORDS = [
  'how many', 'how much', 'how much is', 'calories', 'kcal', 'kilocalories',
  'كم', 'کم', 'كمية', 'السعرات', 'سعرة', 'سعره', 'كم سعرة',
  'چهند', 'چەند', 'کالۆری', 'بڕی', 'چهنده',
]

export const SUGGEST_WORDS = [
  'suggest', 'recommend', 'recommendation', 'meal idea', 'meal ideas', 'idea', 'ideas',
  'what should i eat', 'what can i eat', 'what to eat', 'suggest me',
  'اقترح', 'اقتراح', 'ماذا اكل', 'ماذا آكل', 'ايش اكل', 'وجبة', 'وجبات', 'افكار',
  'پیشنیار', 'پێشنیار', 'چی بخۆم', 'چی بخورم', 'ژەم', 'ژهم', 'بیرۆکە',
]

export const SUMMARY_WORDS = [
  'how am i doing', 'my progress', 'summary', 'summarise', 'summarize', 'today so far',
  'remaining calories', 'calories left', 'how many calories left',
  'كيف حالي', 'ملخص', 'الملخص', 'المتبقي', 'المتبقية', 'كم بقي', 'وضعي',
  'راپۆرت', 'ڕاپۆرت', 'کوڵە', 'چەند ماوە', 'ماوە', 'دۆخم',
]

export const HELP_WORDS = [
  'help', 'what can you do', 'what can i ask', 'commands', 'options',
  'مساعدة', 'ساعدني', 'ماذا تستطيع', 'ماذا يمكنك',
  'یارمەتی', 'یارمهتی', 'چی دهتوانی', 'چی دەتوانی',
]

export const GREETING_WORDS = [
  'hi', 'hello', 'hey', 'good morning', 'good evening', 'salam', 'assalamu alaikum',
  'مرحبا', 'اهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير',
  'سڵاو', 'سلاو', 'بەیانیت باش', 'ئێوارەت باش',
]

export const THANKS_WORDS = ['thanks', 'thank you', 'شكرا', 'شکرا', 'سوپاس', 'زۆر سوپاس']

/** Comparison questions: "chicken vs beef protein". */
export const COMPARE_WORDS = ['vs', 'versus', 'compare', 'compared to', 'more than', 'بەراورد', 'بەراوردی', 'مقارنة', 'اكثر من', 'أكثر من', 'زیاتر']

/* -------------------------------------------------------------------- meals -- */

export const MEAL_WORDS: Array<{ meal: MealType; words: string[] }> = [
  {
    meal: 'breakfast',
    words: ['breakfast', 'morning meal', 'فطور', 'افطار', 'الإفطار', 'بەیانیان', 'ژەمی بەیانی', 'نانی بەیانی'],
  },
  {
    meal: 'lunch',
    words: ['lunch', 'midday meal', 'غداء', 'الغداء', 'ناهار', 'نیوەڕۆ', 'ژەمی نیوەڕۆ'],
  },
  {
    meal: 'dinner',
    words: ['dinner', 'supper', 'evening meal', 'عشاء', 'العشاء', 'شێو', 'ئێوارە', 'ژەمی ئێوارە'],
  },
  {
    meal: 'snack',
    words: ['snack', 'snacks', 'وجبة خفيفة', 'وجبات خفيفة', 'سناك', 'میانەوە', 'خواردنی سووک', 'ڕەمەزان'],
  },
]

/* -------------------------------------------------------------------- units -- */

/** Portion words mapped onto the serving units the database uses. */
export const UNIT_WORDS: Array<{ unit: ServingUnit | 'g' | 'ml'; words: string[] }> = [
  { unit: 'g', words: ['g', 'gram', 'grams', 'gr', 'غ', 'غرام', 'گرام', 'گم', 'گرەم'] },
  { unit: 'ml', words: ['ml', 'millilitre', 'milliliter', 'مل', 'مليلتر', 'ملیلیتر'] },
  { unit: 'cup', words: ['cup', 'cups', 'كوب', 'كوبان', 'اكواب', 'أكواب', 'کوپ', 'کوپێک', 'پەرداخی گەورە'] },
  { unit: 'tbsp', words: ['tbsp', 'tablespoon', 'tablespoons', 'ملعقة كبيرة', 'ملعقة', 'کەوچکی گەورە', 'کەوچک'] },
  { unit: 'tsp', words: ['tsp', 'teaspoon', 'teaspoons', 'ملعقة صغيرة', 'کەوچکی بچووک'] },
  { unit: 'piece', words: ['piece', 'pieces', 'حبة', 'حبات', 'قطعة', 'قطع', 'دانە', 'پارچە', 'دان'] },
  { unit: 'slice', words: ['slice', 'slices', 'شريحة', 'شرائح', 'بڕگە', 'لاپەڕە'] },
  { unit: 'bowl', words: ['bowl', 'bowls', 'صحن', 'طبق', 'سلطانية', 'قاپ', 'قاپێک'] },
  { unit: 'plate', words: ['plate', 'plates', 'طبق', 'تبق', 'تەبەق', 'تەبەقی'] },
  { unit: 'glass', words: ['glass', 'glasses', 'كاس', 'كأس', 'كوب', 'پەرداخ', 'گلاس'] },
  { unit: 'can', words: ['can', 'cans', 'علبة', 'علب', 'قوتو'] },
  { unit: 'bottle', words: ['bottle', 'bottles', 'زجاجة', 'قنينة', 'بۆتڵ', 'شووشە'] },
  { unit: 'handful', words: ['handful', 'handfuls', 'حفنة', 'مست', 'مستێک'] },
  { unit: 'serving', words: ['serving', 'servings', 'portion', 'portions', 'حصة', 'حصص', 'پێشکەش', 'بەش'] },
  { unit: 'scoop', words: ['scoop', 'scoops', 'مغرفة', 'کەوچک'] },
  { unit: 'bunch', words: ['bunch', 'bunches', 'ضمة', 'گوڵە'] },
  { unit: 'leaf', words: ['leaf', 'leaves', 'ورقة', 'گەڵا'] },
  { unit: 'package', words: ['package', 'packet', 'pack', 'bag', 'عبوة', 'كيس', 'پاکەت', 'پاکێت'] },
]

/** Rough grams for the volume/portion units — enough for an estimate. */
export const UNIT_GRAMS: Record<string, number> = {
  g: 1,
  ml: 1,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  glass: 250,
  bowl: 400,
  plate: 350,
  handful: 30,
  scoop: 30,
  bunch: 60,
  leaf: 5,
  slice: 30,
  piece: 0,
  can: 330,
  bottle: 500,
  package: 30,
  serving: 0,
}

/* ------------------------------------------------------------------ numbers -- */

export const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, single: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30,
  fifty: 50, hundred: 100, couple: 2, few: 3, several: 3,
  half: 0.5, quarter: 0.25, third: 0.33,
  واحد: 1, واحده: 1, اثنان: 2, اثنين: 2, ثنتين: 2, ثلاث: 3, ثلاثه: 3, اربع: 4, اربعه: 4,
  خمس: 5, خمسه: 5, ست: 6, سته: 6, سبع: 7, سبعه: 7, ثمان: 8, ثمانيه: 8, تسع: 9, تسعه: 9,
  عشر: 10, عشره: 10, نصف: 0.5, ربع: 0.25,
  یەک: 1, یهک: 1, دوو: 2, سێ: 3, سی: 3, چوار: 4, پێنج: 5, پینج: 5, شەش: 6, شش: 6,
  حەوت: 7, حهوت: 7, هەشت: 8, ههشت: 8, نۆ: 9, نو: 9, دە: 10, ده: 10, نیو: 0.5, نیوه: 0.5,
}

/** Numeric word lookup keyed by the normalised form of each word. */
export const NUMBER_LOOKUP: Record<string, number> = Object.fromEntries(
  Object.entries(NUMBER_WORDS).map(([word, value]) => [normalizeSearchText(word), value]),
)

/** Unit vocabulary, normalised, with multi-word units first. */
export const UNIT_LOOKUP: Array<{ unit: string; words: string[] }> = UNIT_WORDS.map((entry) => ({
  unit: entry.unit,
  words: entry.words.map((word) => normalizeSearchText(word)),
}))

/** Food words that only ever describe *when* something was eaten. */
export const MEAL_WORDS_FLAT: readonly string[] = MEAL_WORDS.flatMap((entry) => entry.words)

/** Words that carry no food meaning and are dropped before matching. */
export const STOPWORDS = [
  'i', 'me', 'my', 'a', 'an', 'the', 'of', 'for', 'with', 'and', 'plus', 'some', 'just',
  'today', 'please', 'now', 'to', 'in', 'on', 'at', 'was', 'were', 'is', 'are', 'it', 'that',
  'this', 'am', 'as', 'snack', 'should', 'shall', 'would', 'could', 'can', 'will', 'do',
  'does', 'did', 'need', 'needs', 'want', 'wants', 'get', 'got', 'about', 'tell', 'give',
  'show', 'explain', 'advise', 'recommend me', 'there', 'any', 'more', 'most', 'much',
  'many', 'in my', 'over', 'under', 'good', 'healthy', 'best', 'please tell me',
  'ان', 'أنا', 'انا', 'لي', 'من', 'على', 'في', 'مع', 'هذا', 'هذه', 'ذلك', 'ال', 'و',
  'من فضلك', 'اليوم', 'الان', 'الآن', 'هل', 'يجب', 'أريد', 'اريد', 'أحتاج', 'احتاج',
  'لي', 'ماذا', 'كم', 'أكل', 'اكل', 'آكل', 'اشرب', 'أشرب', 'جيد', 'صحي', 'أفضل',
  'من', 'لە', 'لەگەڵ', 'بۆ', 'ئەم', 'ئەو', 'هەندێک', 'تکایە', 'ئێستا', 'ئەمڕۆ',
  'بۆ من', 'پێویستە', 'دەمەوێت', 'بخۆم', 'بخۆ', 'باش', 'تەندروست', 'چاک',
]

/** Words used to split a list of foods: "rice and chicken", "أرز و دجاج". */
export const CONNECTORS = [
  ' and ', ' plus ', ' with ', ' & ', ',', ';', ' و ', '،', ' مع ', ' لەگەڵ ',
  ' vs ', ' vs. ', ' versus ', ' compared to ', ' compared with ', ' or ',
  ' مقابل ', ' بەراورد بە ', ' بەراوردی ', ' زیاتر لە ',
]

/* ------------------------------------------------------------------- topics -- */

/**
 * Small nutrition knowledge base. Each topic maps to an i18n template
 * (`assistant.topic.<key>`) and can pull live numbers from the user's goals.
 */
export const TOPIC_WORDS: Array<{ topic: string; words: string[] }> = [
  { topic: 'protein', words: ['protein', 'بروتين', 'البروتين', 'پرۆتین'] },
  { topic: 'carbs', words: ['carbs', 'carbohydrate', 'carbohydrates', 'كربوهيدرات', 'كاربوهیدرات', 'کاربۆهیدرات'] },
  { topic: 'fat', words: ['fat', 'fats', 'دهون', 'الدهون', 'چەوری', 'چهوری'] },
  { topic: 'fibre', words: ['fibre', 'fiber', 'الياف', 'ألياف', 'ڕیشاڵ', 'ریشاڵ'] },
  { topic: 'sugar', words: ['sugar', 'سكر', 'السكر', 'شەکر', 'شکر'] },
  { topic: 'water', words: ['water', 'hydration', 'ماء', 'الماء', 'مياه', 'ئاو', 'ئاوی'] },
  { topic: 'weightLoss', words: ['lose weight', 'weight loss', 'slim', 'diet', 'افقد وزن', 'انقاص الوزن', 'داڕشتن', 'کەمکردنەوەی کێش', 'کێشم کەم بکەم'] },
  { topic: 'exercise', words: ['exercise', 'workout', 'training', 'تمارين', 'رياضة', 'وەرزش', 'ڕاهێنان'] },
  { topic: 'calories', words: ['calorie', 'calories', 'energy', 'سعرة', 'سعرات', 'السعرات', 'كalore', 'کالۆری', 'وزە'] },
  { topic: 'breakfast', words: ['skip breakfast', 'skipping breakfast', 'تخطي الفطور', 'بەیانیان نەخۆم'] },
]

/** Flattened topic vocabulary — stripped from segments when comparing foods. */
export const TOPIC_WORDS_FLAT: readonly string[] = TOPIC_WORDS.flatMap((entry) => entry.words)

/** All food-ish words, used to decide that a sentence names a food at all. */
export const INTENT_WORDS: readonly string[] = [
  ...LOG_VERBS,
  ...SUGGEST_WORDS,
  ...SUMMARY_WORDS,
  ...HELP_WORDS,
  ...GREETING_WORDS,
  ...THANKS_WORDS,
  ...QUESTION_WORDS,
  ...COMPARE_WORDS,
  ...MEAL_WORDS.flatMap((entry) => entry.words),
  ...UNIT_WORDS.flatMap((entry) => entry.words),
  ...STOPWORDS,
  ...TOPIC_WORDS.flatMap((entry) => entry.words),
]
