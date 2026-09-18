import type { Locale } from '@/types'

/** BCP-47 tags used for Intl formatting (and for <html lang>). */
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  ar: 'ar-EG',
  ckb: 'ckb-IQ', // Sorani Kurdish; falls back gracefully when unsupported
}

function supported(tag: string): string {
  try {
    return Intl.NumberFormat.supportedLocalesOf([tag]).length > 0 ? tag : 'en-US'
  } catch {
    return 'en-US'
  }
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()

function numberFormatter(locale: Locale): Intl.NumberFormat {
  const tag = supported(INTL_LOCALE[locale])
  const key = `n:${tag}`
  let f = cache.get(key) as Intl.NumberFormat | undefined
  if (!f) {
    f = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
    cache.set(key, f)
  }
  return f
}

function dateFormatter(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = supported(INTL_LOCALE[locale])
  const key = `d:${tag}:${JSON.stringify(options)}`
  let f = cache.get(key) as Intl.DateTimeFormat | undefined
  if (!f) {
    f = new Intl.DateTimeFormat(tag, options)
    cache.set(key, f)
  }
  return f
}

export function formatNumber(value: number, locale: Locale): string {
  return numberFormatter(locale).format(value)
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' },
): string {
  const date = value instanceof Date ? value : new Date(value)
  return dateFormatter(locale, options).format(date)
}

/** Short weekday label for chart axes — localised automatically by Intl. */
export function weekdayLabel(date: Date, locale: Locale): string {
  return dateFormatter(locale, { weekday: 'short' }).format(date)
}

/** "2 days ago"-style relative labels. */
export function relativeDays(days: number, locale: Locale): string {
  const tag = supported(INTL_LOCALE[locale])
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' })
  return rtf.format(-days, 'day')
}

export function formatTime(value: Date | string, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)
  return dateFormatter(locale, { hour: '2-digit', minute: '2-digit' }).format(date)
}
