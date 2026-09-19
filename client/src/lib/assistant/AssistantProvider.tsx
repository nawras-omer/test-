/* eslint-disable react-refresh/only-export-components */
/**
 * Live assistant state: the transcript plus the side effects of a plan.
 *
 * The engine decides *what* the answer is; this provider decides what to do
 * about it — saving diary entries, persisting both halves of the conversation,
 * and falling back to the optional server-side LLM when the rules cannot make
 * sense of a question.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, assistantApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useCustomFoods } from '@/lib/customFoods'
import { useEntries } from '@/lib/entries'
import { entryName, entryServing, findEntryById, type LibraryEntry } from '@/lib/foods'
import { todayKey } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import { useI18n, type TranslationKey } from '@/i18n'
import type { ServingNutrition } from '@/data/foods'
import type { AssistantMessage, CustomFood, FoodEntryInput, Locale, MealType } from '@/types'
import { contextForProvider, plan, type AssistantPlan } from './engine'
import type {
  CompareData,
  FallbackData,
  FoodInfoData,
  LlmData,
  LogData,
  StoredItem,
  SuggestData,
  SummaryData,
  TopicData,
} from './payloads'
import type { ResolvedItem } from './resolve'

type AssistantStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AssistantContextValue {
  status: AssistantStatus
  messages: AssistantMessage[]
  /** A message is being planned, logged and answered. */
  sending: boolean
  /** True when a server-side LLM is configured (answers still work offline). */
  llmEnabled: boolean
  send: (text: string) => Promise<void>
  /** Saves a set of foods to the diary and confirms it in the transcript. */
  logItems: (items: StoredItem[], mealType: MealType) => Promise<void>
  /** Saves the foods on an estimate card to the diary. */
  logMessage: (message: AssistantMessage) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

const HISTORY_LIMIT = 200

/** One resolved food → a diary entry, named in the language being used. */
function toStoredItem(item: ResolvedItem, locale: Locale): StoredItem {
  const bundled = item.entry.kind === 'bundled'
  return {
    foodId: bundled ? item.entry.food.id : null,
    name: entryName(item.entry, locale),
    qty: item.qty,
    unit: item.unit,
    servings: item.servings,
    kcal: item.nutrition.kcal,
    protein: item.nutrition.protein,
    carbs: item.nutrition.carbs,
    fat: item.nutrition.fat,
  }
}

function totalsOf(items: StoredItem[]): ServingNutrition {
  return items.reduce(
    (accumulator, item) => ({
      kcal: accumulator.kcal + item.kcal,
      protein: Math.round((accumulator.protein + item.protein) * 10) / 10,
      carbs: Math.round((accumulator.carbs + item.carbs) * 10) / 10,
      fat: Math.round((accumulator.fat + item.fat) * 10) / 10,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

/** Rebuilds the entry's library object so serving labels stay localised. */
function entryFor(item: StoredItem, custom: CustomFood[]): LibraryEntry | null {
  return item.foodId ? findEntryById(item.foodId, custom) : null
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { todayTotals, remaining, goals, addEntry, today } = useEntries()
  const { foods: customFoods } = useCustomFoods()
  const { push } = useToast()
  const { t, locale } = useI18n()

  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [sending, setSending] = useState(false)
  const [llmEnabled, setLlmEnabled] = useState(false)

  const profile = user?.profile ?? null

  /** Fresh snapshot of the day, read at send time rather than captured. */
  const context = useCallback(
    () => ({
      locale,
      custom: customFoods,
      goals,
      totals: todayTotals,
      remaining,
      profile,
      now: new Date(),
    }),
    [customFoods, goals, locale, profile, remaining, todayTotals],
  )

  /* ------------------------------------------------------------- loading -- */
  const load = useCallback(async (signal?: AbortSignal) => {
    const { messages: stored } = await assistantApi.list(HISTORY_LIMIT, signal)
    setMessages(stored)
  }, [])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      await load()
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [isAuthenticated, load])

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([])
      setLlmEnabled(false)
      setStatus('idle')
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    Promise.all([load(controller.signal), assistantApi.status(controller.signal)])
      .then(([, health]) => {
        setLlmEnabled(Boolean(health?.llm))
        setStatus('ready')
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') setStatus('error')
      })
    return () => controller.abort()
  }, [isAuthenticated, user?.id, load])

  /* ------------------------------------------------------------ helpers -- */

  const persist = useCallback(
    async (input: Parameters<typeof assistantApi.append>[0]) => {
      const { message } = await assistantApi.append(input)
      setMessages((current) => [...current, message])
      return message
    },
    [],
  )

  /** Saves resolved foods to the diary and returns the ids for the UI. */
  const saveItems = useCallback(
    async (items: StoredItem[], mealType: MealType) => {
      const date = today
      for (const item of items) {
        const entry = entryFor(item, customFoods)
        const servingSize =
          item.unit && (entry === null || entry.kind === 'bundled')
            ? `${formatNumber(item.qty, locale)} ${t(`unit.${item.unit}` as TranslationKey)}`
            : entry
              ? entryServing(entry, t)
              : `${formatNumber(item.servings, locale)} × ${t('unit.serving')}`

        const input: FoodEntryInput = {
          name: item.name,
          servingSize,
          calories: item.kcal,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          mealType,
          date: date || todayKey(),
        }
        await addEntry(input)
      }
    },
    [addEntry, customFoods, locale, t, today],
  )

  /** Turns an engine plan into the message payload the UI renders. */
  const toPayload = useCallback(
    (result: AssistantPlan): { kind: string; data: Record<string, unknown>; text: string } => {
      switch (result.kind) {
        case 'reply.log':
        case 'reply.estimate': {
          const items = result.items.map((item) => toStoredItem(item, locale))
          const data: LogData = {
            items,
            totals: totalsOf(items),
            unmatched: result.unmatched,
            mealType: result.mealType,
            saved: result.kind === 'reply.log',
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.foodInfo': {
          const item = toStoredItem(result.item, locale)
          const data: FoodInfoData = {
            item,
            percentOfDay: result.percentOfDay,
            mealType: 'snack',
            saved: false,
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.compare': {
          const data: CompareData = {
            items: result.items.map((item) => toStoredItem(item, locale)),
            mealType: 'snack',
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.suggest': {
          const data: SuggestData = {
            mealType: result.mealType,
            remaining: result.remaining,
            note: result.note,
            suggestions: result.suggestions.map((suggestion) => ({
              ...toStoredItem(
                {
                  entry: suggestion.entry,
                  query: '',
                  qty: 1,
                  unit: null,
                  servings: 1,
                  nutrition: suggestion.nutrition,
                },
                locale,
              ),
              reason: suggestion.reason,
              fits: suggestion.fits,
            })),
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.summary': {
          const data: SummaryData = {
            totals: { ...result.totals },
            goals: { ...result.goals },
            remaining: result.remaining,
            percent: result.percent,
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.topic': {
          const data: TopicData = { topic: result.topic, values: result.values }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.fallback': {
          const data: FallbackData = {
            query: result.query,
            didYouMean: result.didYouMean.map((entry) => ({
              foodId: entry.kind === 'bundled' ? entry.food.id : null,
              name: entryName(entry, locale),
            })),
          }
          return { kind: result.kind, data: data as unknown as Record<string, unknown>, text: '' }
        }
        case 'reply.help':
        case 'reply.greeting':
        case 'reply.thanks':
          return { kind: result.kind, data: {}, text: '' }
        default:
          return { kind: 'reply.fallback', data: { query: '', didYouMean: [] }, text: '' }
      }
    },
    [locale],
  )

  /* ------------------------------------------------------------- sending -- */
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return
      setSending(true)

      // The transcript *before* this turn — what the LLM provider sees.
      const history = messages.map((message) => ({ role: message.role, content: message.text })).filter((m) => m.content)

      try {
        await persist({ role: 'user', text: trimmed, kind: 'text' })

        const snapshot = context()
        const result = plan(trimmed, snapshot)

        if (result.kind === 'reply.log') {
          const items = result.items.map((item) => toStoredItem(item, locale))
          await saveItems(items, result.mealType)
          push(
            t('assistant.log.saved', {
              meal: t(`meal.${result.mealType}` as TranslationKey),
              kcal: formatNumber(result.totals.kcal, locale),
            }),
            'success',
          )
        }

        let payload = toPayload(result)

        // Anything the rules could not place goes to the LLM, when configured.
        if (result.kind === 'reply.fallback' && llmEnabled) {
          try {
            const { reply } = await assistantApi.respond(
              [...history, { role: 'user', content: trimmed }],
              locale,
              contextForProvider(snapshot),
            )
            if (reply?.trim()) payload = { kind: 'reply.llm', data: {}, text: reply.trim() }
          } catch (error) {
            const degraded: LlmData = { degraded: true }
            payload = { ...payload, data: { ...payload.data, ...degraded } }
            if (!(error instanceof ApiError)) throw error
          }
        }

        await persist({ role: 'assistant', text: payload.text, kind: payload.kind, data: payload.data })
      } catch {
        push(t('assistant.error'), 'danger')
      } finally {
        setSending(false)
      }
    },
    [context, llmEnabled, locale, messages, persist, push, saveItems, sending, t, toPayload],
  )

  /** Saves foods to the diary (from a card button) and confirms in the chat. */
  const logItems = useCallback(
    async (items: StoredItem[], mealType: MealType) => {
      if (items.length === 0 || sending) return
      setSending(true)
      try {
        await saveItems(items, mealType)
        const data: LogData = {
          items,
          totals: totalsOf(items),
          unmatched: [],
          mealType,
          saved: true,
        }
        push(
          t('assistant.log.saved', {
            meal: t(`meal.${mealType}` as TranslationKey),
            kcal: formatNumber(data.totals.kcal, locale),
          }),
          'success',
        )
        await persist({
          role: 'assistant',
          text: '',
          kind: 'reply.log',
          data: data as unknown as Record<string, unknown>,
        })
      } catch {
        push(t('assistant.error'), 'danger')
      } finally {
        setSending(false)
      }
    },
    [locale, persist, push, saveItems, sending, t],
  )

  /** "Save to diary" on an estimate or single-food card. */
  const logMessage = useCallback(
    async (message: AssistantMessage) => {
      const data = message.data
      if (!data) return
      const items: StoredItem[] = Array.isArray(data.items)
        ? (data.items as StoredItem[])
        : data.item
          ? [data.item as StoredItem]
          : []
      const mealType = (typeof data.mealType === 'string' ? data.mealType : 'snack') as MealType
      await logItems(items, mealType)
    },
    [logItems],
  )

  const clear = useCallback(async () => {
    await assistantApi.clear()
    setMessages([])
    push(t('assistant.cleared'), 'success')
  }, [push, t])

  const value = useMemo<AssistantContextValue>(
    () => ({ status, messages, sending, llmEnabled, send, logItems, logMessage, clear, refresh }),
    [status, messages, sending, llmEnabled, send, logItems, logMessage, clear, refresh],
  )

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext)
  if (!context) throw new Error('useAssistant must be used inside <AssistantProvider>')
  return context
}
