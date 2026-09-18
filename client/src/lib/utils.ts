import type { TranslationKey } from '@/i18n'

/** Tiny classnames helper (falsy values are dropped). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** "Sara Ahmed" → "SA" (works for Arabic and Kurdish names too). */
export function initials(name: string, max = 2): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, max)
    .map((part) => Array.from(part)[0] ?? '')
    .join('')
    .toUpperCase()
}

/** Local-time-appropriate greeting key. */
export function greetingKey(date = new Date()): TranslationKey {
  const hour = date.getHours()
  if (hour < 12) return 'dashboard.greeting.morning'
  if (hour < 17) return 'dashboard.greeting.afternoon'
  return 'dashboard.greeting.evening'
}

/** Clamp helper for progress maths. */
export function clampPercent(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(Math.max((value / max) * 100, 0), 100)
}
