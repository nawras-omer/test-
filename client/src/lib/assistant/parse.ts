/**
 * Turns a sentence into an intent plus a list of (quantity, food) segments.
 *
 * Deliberately rule-based: it runs in the browser with no key, no latency and
 * no data leaving the device, and it understands the exact three languages the
 * app ships. `client/src/lib/assistant/engine.ts` sits on top of this and
 * decides what to actually do; the optional server-side LLM
 * (`server/lib/assistant/llm.js`) only handles the open-ended questions that
 * rules cannot answer.
 */
import { normalizeSearchText } from '@/data/foods'
import type { MealType } from '@/types'
import {
  COMPARE_WORDS,
  CONNECTORS,
  GREETING_WORDS,
  HELP_WORDS,
  LOG_VERBS,
  MEAL_WORDS,
  MEAL_WORDS_FLAT,
  NUMBER_LOOKUP,
  QUESTION_WORDS,
  STOPWORDS,
  SUGGEST_WORDS,
  SUMMARY_WORDS,
  THANKS_WORDS,
  TOPIC_WORDS,
  TOPIC_WORDS_FLAT,
  UNIT_LOOKUP,
  hasAny,
  phrase,
} from './lexicon'

export type AssistantIntent =
  | 'log'
  | 'estimate'
  | 'suggest'
  | 'summary'
  | 'help'
  | 'greeting'
  | 'thanks'
  | 'unknown'

/** Verbs that mean "record this" even inside a question. */
const STRONG_LOG_VERBS = [
  'ate', 'eaten', 'drank', 'logged', 'recorded', 'tracked', 'added',
  'اكلت', 'أكلت', 'شربت', 'سجلت', 'خواردم', 'خواردوومه', 'نووسی', 'زیادم کرد',
]

const QUESTION_STARTERS = [
  'how many', 'how much', 'what is', 'what are', 'which', 'is there', 'does',
  'كم', 'کم', 'ما هي', 'ما هو', 'هل',
  'چهند', 'چەند', 'بڕی', 'چی', 'ئایا',
]

export interface ParsedSegment {
  /** What the person wrote for this food, after quantities are removed. */
  query: string
  qty: number
  unit: string | null
}

export interface ParsedUtterance {
  raw: string
  /** Normalised, padded text — what all the lexicon matching ran against. */
  norm: string
  intent: AssistantIntent
  /** Food segments in the order they were mentioned. */
  segments: ParsedSegment[]
  mealType: MealType | null
  /** Knowledge-base topic, when the sentence matched one (used as a fallback). */
  topic: string | null
  /** True when the sentence asks for a comparison ("chicken vs beef"). */
  comparison: boolean
}

const ARABIC_INDIC = /[\u0660-\u0669\u06F0-\u06F9]/g
const DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

/** ٢٫٥ → 2.5 — Arabic-Indic digits and separators become plain ASCII. */
export function toAsciiNumberText(input: string): string {
  return input
    .replace(ARABIC_INDIC, (digit) => DIGIT_MAP[digit] ?? digit)
    .replace(/[\u066B\u066C]/g, (separator) => (separator === '\u066B' ? '.' : ''))
}

/** Matches a unit at `index`. Multi-word units are tried first so that
 * "ملعقة كبيرة" (tablespoon) cannot be swallowed by "ملعقة" alone. */
function unitAt(tokens: string[], index: number): { unit: string; consumed: number } | null {
  for (const entry of UNIT_LOOKUP) {
    for (const word of entry.words) {
      const parts = word.split(' ')
      if (parts.length > 1 && tokens.slice(index, index + parts.length).join(' ') === word) {
        return { unit: entry.unit, consumed: parts.length }
      }
    }
  }
  for (const entry of UNIT_LOOKUP) {
    for (const word of entry.words) {
      if (!word.includes(' ') && tokens[index] === word) return { unit: entry.unit, consumed: 1 }
    }
  }
  return null
}

/**
 * Reads a leading quantity ("2", "٢", "two", "half a") plus an optional unit
 * out of a segment and returns what is left as the food query.
 */
function parseSegment(segment: string): ParsedSegment {
  const tokens = segment.split(' ').filter(Boolean)
  let qty = 1
  let unit: string | null = null
  const used = new Set<number>()

  for (let index = 0; index < tokens.length; index += 1) {
    if (used.has(index)) continue
    const token = tokens[index]

    const numeric = /^\d+(?:[.,]\d+)?$/.test(token) ? Number(token.replace(',', '.')) : null
    const wordValue = NUMBER_LOOKUP[token]

    if (numeric === null && wordValue === undefined) continue

    qty = numeric ?? wordValue ?? 1
    used.add(index)

    // "half" / "نصف" reads better as "half a cup".
    if (wordValue !== undefined && ['half', 'quarter', 'third', 'نصف', 'ربع', 'نیو', 'چارەک'].includes(token)) {
      const next = tokens[index + 1]
      if (next === 'a' || next === 'an' || next === 'of') used.add(index + 1)
    }
    if (tokens[index + 1] === 'of') used.add(index + 1)

    const unitIndex = tokens.findIndex((_, offset) => offset > index && !used.has(offset))
    const found = unitIndex === -1 ? null : unitAt(tokens, unitIndex)
    if (found) {
      unit = found.unit
      for (let offset = 0; offset < found.consumed; offset += 1) used.add(unitIndex + offset)
      if (tokens[unitIndex + found.consumed] === 'of') used.add(unitIndex + found.consumed)
    }
    break
  }

  const query = tokens.filter((_, index) => !used.has(index)).join(' ')
  return { query, qty, unit }
}

/**
 * Removes intent/stop words so what is left is (mostly) food names.
 *
 * Longest phrases go first ("how many" before "many", "من فضلك" before "من"),
 * otherwise a short word would nibble the middle out of a longer one.
 */
function stripIntentWords(text: string): string {
  let out = ` ${text.trim()} `
  const removable = [
    ...LOG_VERBS,
    ...SUGGEST_WORDS,
    ...SUMMARY_WORDS,
    ...HELP_WORDS,
    ...GREETING_WORDS,
    ...THANKS_WORDS,
    ...QUESTION_WORDS,
    ...COMPARE_WORDS,
    ...MEAL_WORDS_FLAT,
    ...STOPWORDS,
  ]
  const unique = [...new Set(removable)].sort((a, b) => b.length - a.length)
  for (const word of unique) out = out.split(phrase(word)).join(' ')
  return out.trim()
}

/**
 * Arabic and Kurdish attach the conjunction: "تفاحة وموزة" is *two* foods with
 * no space after the waw. Split a leading "و"/"w" off a token when the rest of
 * the token is long enough to still be a word on its own.
 */
function splitAttachedConjunctions(part: string): string[] {
  const tokens = part.split(' ').filter(Boolean)
  const parts: string[] = []
  let current: string[] = []
  for (const token of tokens) {
    const isWaw = (token.startsWith('و') || token.startsWith('وە')) && token.length >= 4
    if (isWaw) {
      const rest = token.startsWith('وە') ? token.slice(2) : token.slice(1)
      if (rest.length >= 2) {
        if (current.length > 0) {
          parts.push(current.join(' '))
          current = []
        }
        current.push(rest)
        continue
      }
    }
    current.push(token)
  }
  if (current.length > 0) parts.push(current.join(' '))
  return parts
}

function splitSegments(text: string): string[] {
  let working = ` ${text.trim()} `
  for (const connector of CONNECTORS) {
    const bare = connector.trim()
    const normed = phrase(connector).trim()
    // "&" and "," normalise to nothing — split on the raw character instead,
    // never on an empty phrase (that would split *every* space).
    const padded = normed === '' || bare === ',' || bare === ';' || bare === '،' ? ` ${bare} ` : phrase(connector)
    working = working.split(padded).join(' | ')
  }
  return working
    .split('|')
    .flatMap((part) => splitAttachedConjunctions(part.trim().replace(/\s+/g, ' ')))
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export function detectMeal(norm: string): MealType | null {
  for (const entry of MEAL_WORDS) {
    if (hasAny(norm, entry.words)) return entry.meal
  }
  return null
}

function detectTopic(norm: string): string | null {
  for (const entry of TOPIC_WORDS) {
    if (hasAny(norm, entry.words)) return entry.topic
  }
  return null
}

/**
 * Classifies the sentence and extracts its food segments.
 *
 * Precedence: help → greeting/thanks → summary → suggest → log → estimate.
 * A past-tense "I ate…" always wins over the question check, so
 * "how many calories did I just log" is still treated as a lookup, while
 * "I ate 2 eggs" is logged.
 */
export function parseUtterance(text: string): ParsedUtterance {
  const raw = text.trim()
  const ascii = toAsciiNumberText(raw)
  const norm = ` ${normalizeSearchText(ascii)} `

  const mealType = detectMeal(norm)
  const topic = detectTopic(norm)
  const comparison = hasAny(norm, COMPARE_WORDS)
  const strongLog = hasAny(norm, STRONG_LOG_VERBS)
  const question = hasAny(norm, QUESTION_STARTERS) || hasAny(norm, QUESTION_WORDS)

  let intent: AssistantIntent = 'unknown'
  if (hasAny(norm, HELP_WORDS)) intent = 'help'
  else if (hasAny(norm, THANKS_WORDS)) intent = 'thanks'
  else if (hasAny(norm, GREETING_WORDS) && norm.trim().split(' ').length <= 4) intent = 'greeting'
  else if (hasAny(norm, SUMMARY_WORDS)) intent = 'summary'
  else if (hasAny(norm, SUGGEST_WORDS)) intent = 'suggest'
  else if (strongLog) intent = 'log'
  else if (hasAny(norm, LOG_VERBS) && !question) intent = 'log'
  else if (question) intent = 'estimate'
  else if (comparison) intent = 'estimate'

  // Split *first*, then drop the filler words per segment: "rice and chicken"
  // must stay two foods, and each half still carries its own quantity.
  const segments = splitSegments(norm)
    .map((part) => {
      // Re-pad after stripping: `phrase()` matches whole words, so a bare
      // "water" would never match the padded " water ".
      let part2 = ` ${stripIntentWords(part)} `
      // "chicken vs beef protein" / "how much protein in chicken" — the macro
      // word is the question, not a food: drop it and keep the real foods.
      if (comparison || question) {
        for (const word of TOPIC_WORDS_FLAT) part2 = part2.split(phrase(word)).join(' ')
      }
      return parseSegment(part2)
    })
    .filter((segment) => segment.query.replace(/[^\p{L}\p{N}]/gu, '').length >= 2)

  return { raw, norm, intent, segments, mealType, topic, comparison }
}
