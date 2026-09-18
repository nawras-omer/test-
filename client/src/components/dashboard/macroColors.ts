/**
 * The three macro series colours, as CSS custom properties.
 * Kept in one place so the progress bars, legends and charts stay in step with
 * whatever palette the user picked.
 */
export const MACRO_COLORS = {
  protein: 'var(--macro-protein)',
  carbs: 'var(--macro-carbs)',
  fat: 'var(--macro-fat)',
} as const

/** Fixed per-meal accent colours for the "today by meal" breakdown. */
export const MEAL_COLORS = {
  breakfast: 'var(--warning)',
  lunch: 'var(--macro-carbs)',
  dinner: 'var(--macro-protein)',
  snack: 'var(--macro-fat)',
} as const
