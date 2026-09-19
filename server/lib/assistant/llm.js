/**
 * Optional LLM provider for the assistant.
 *
 * The chat works with **no configuration at all**: intents, food matching and
 * logging run in the browser against the bundled database (see
 * `client/src/lib/assistant/`), which keeps it instant, offline and free.
 *
 * Setting `ASSISTANT_API_KEY` (or `OPENAI_API_KEY`) turns on this provider for
 * the open-ended questions the rule engine can only answer with templates —
 * "why do I feel tired after lunch?" and similar. Any OpenAI-compatible
 * endpoint works; point `ASSISTANT_BASE_URL` at it.
 *
 *   ASSISTANT_API_KEY=sk-…            enable the provider
 *   ASSISTANT_MODEL=gpt-4o-mini       model name
 *   ASSISTANT_BASE_URL=https://…/v1   Chat Completions base URL
 */
const API_KEY = process.env.ASSISTANT_API_KEY ?? process.env.OPENAI_API_KEY ?? ''
const BASE_URL = (process.env.ASSISTANT_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')
const MODEL = process.env.ASSISTANT_MODEL ?? 'gpt-4o-mini'

export function isConfigured() {
  return Boolean(API_KEY)
}

export function providerInfo() {
  return { configured: isConfigured(), model: isConfigured() ? MODEL : null }
}

const LANGUAGE_NAMES = { en: 'English', ar: 'Arabic', ckb: 'Sorani Kurdish' }

/** Compact system prompt: the client sends structured context, not raw tables. */
function systemPrompt(locale, context) {
  const language = LANGUAGE_NAMES[locale] ?? 'English'
  return [
    'You are Kalori, a practical nutrition assistant inside a calorie-tracking app.',
    `Always answer in ${language}, in 2-4 short sentences.`,
    'Be specific with numbers (kcal, grams) and never invent medical advice.',
    'The app already logs food, suggests meals and estimates calories from the',
    'user\'s own food database — if the request is one of those, say so briefly',
    'and let the app answer with its structured card.',
    context ? `Today's context: ${JSON.stringify(context)}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Sends the recent transcript to the provider.
 * Returns `{ reply }`, or `null` when the provider is unavailable or answers
 * with something unusable — the caller then falls back to the local engine.
 */
export async function complete({ messages = [], locale = 'en', context = null, timeoutMs = 20000 } = {}) {
  if (!isConfigured()) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt(locale, context) },
          ...messages.slice(-12).map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: String(message.content ?? '').slice(0, 2000),
          })),
        ],
      }),
    })

    if (!response.ok) {
      console.warn('[assistant] provider responded %s', response.status)
      return null
    }

    const payload = await response.json()
    const reply = payload?.choices?.[0]?.message?.content
    return typeof reply === 'string' && reply.trim() ? { reply: reply.trim() } : null
  } catch (err) {
    console.warn('[assistant] provider call failed: %s', err.message)
    return null
  } finally {
    clearTimeout(timer)
  }
}
