/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { FoodLogModal } from './FoodLogModal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n'
import type { MealType } from '@/types'

interface OpenOptions {
  mealType?: MealType
  date?: string
}

interface FoodLogContextValue {
  /** Opens the "log food" dialog, optionally pre-set to a meal/day. */
  openFoodLog: (options?: OpenOptions) => void
  closeFoodLog: () => void
  isOpen: boolean
}

const FoodLogContext = createContext<FoodLogContextValue | null>(null)

/**
 * Owns the single food-logging dialog so any screen can trigger it — dashboard
 * header, empty states, floating action button — without prop drilling.
 */
export function FoodLogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const { push } = useToast()

  const [options, setOptions] = useState<OpenOptions | null>(null)

  const openFoodLog = useCallback((next: OpenOptions = {}) => setOptions(next), [])
  const closeFoodLog = useCallback(() => setOptions(null), [])

  const value = useMemo<FoodLogContextValue>(
    () => ({ openFoodLog, closeFoodLog, isOpen: options !== null }),
    [openFoodLog, closeFoodLog, options],
  )

  return (
    <FoodLogContext.Provider value={value}>
      {children}
      <FoodLogModal
        open={options !== null}
        onClose={closeFoodLog}
        defaultMealType={options?.mealType}
        defaultDate={options?.date}
        onSaved={(name, mealType) =>
          push(t('food.added', { name, meal: t(`meal.${mealType}`) }), 'success')
        }
      />
    </FoodLogContext.Provider>
  )
}

export function useFoodLog(): FoodLogContextValue {
  const context = useContext(FoodLogContext)
  if (!context) throw new Error('useFoodLog must be used inside <FoodLogProvider>')
  return context
}
