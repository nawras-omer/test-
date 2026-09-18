/* eslint-disable react-refresh/only-export-components */
/**
 * Runtime localisation: English · العربية · کوردیی سۆرانی
 *
 * Switching language updates the dictionary *and* flips <html dir> so the whole
 * layout mirrors, then persists the choice for the next visit. Numbers and dates
 * go through Intl, so they localise along with the copy.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '@/types'
import { en, type Dictionary, type TranslationKey } from './en'
import { ar } from './ar'
import { ckb } from './ckb'

export type { TranslationKey }

export interface LocaleMeta {
  code: Locale
  /** Endonym — always shown in its own script, e.g. "کوردیی سۆرانی". */
  native: string
  english: string
  dir: 'ltr' | 'rtl'
  intl: string
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', native: 'English', english: 'English', dir: 'ltr', intl: 'en-US' },
  { code: 'ar', native: 'العربية', english: 'Arabic', dir: 'rtl', intl: 'ar-EG' },
  { code: 'ckb', native: 'کوردیی سۆرانی', english: 'Sorani Kurdish', dir: 'rtl', intl: 'ckb-IQ' },
]

export const DEFAULT_LOCALE: Locale = 'en'
const STORAGE_KEY = 'kalori.locale'

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar, ckb }

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
}

export function isRTLLocale(locale: Locale): boolean {
  return getLocaleMeta(locale).dir === 'rtl'
}

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar' || value === 'ckb'
}

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

/** Best-effort match against the visitor's browser languages. */
function detectLocale(): Locale {
  const stored = readStoredLocale()
  if (stored) return stored
  const candidates = typeof navigator === 'undefined' ? [] : [navigator.language, ...(navigator.languages ?? [])]
  for (const candidate of candidates) {
    const base = String(candidate ?? '').toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = DICTIONARIES[locale]?.[key] ?? en[key] ?? key
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

interface I18nContextValue {
  locale: Locale
  meta: LocaleMeta
  dir: 'ltr' | 'rtl'
  isRTL: boolean
  locales: LocaleMeta[]
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale())

  const meta = getLocaleMeta(locale)
  const dir = meta.dir

  // Keep <html lang/dir> and the document title in sync with the locale.
  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dir
    document.title = `${translate(locale, 'nav.dashboard')} · Kalori`
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* storage unavailable — runtime switching still works */
    }
  }, [locale, dir])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ locale, meta, dir, isRTL: dir === 'rtl', locales: LOCALES, setLocale, t }),
    [locale, meta, dir, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

/** Convenience hook for components that only need the translate function. */
export function useTranslation() {
  const { t, locale, dir, isRTL, meta } = useI18n()
  return { t, locale, dir, isRTL, meta }
}
