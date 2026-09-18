/* eslint-disable react-refresh/only-export-components */
/**
 * The signed-in user's personal food library.
 *
 * Backed by `/api/foods` (one list per account), so a custom food created on a
 * laptop is there on a phone. Mutations update local state from the server's
 * canonical response — the same pattern the diary uses.
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
import { foodsApi } from './api'
import { useAuth } from './auth'
import type { CustomFood, CustomFoodInput } from '@/types'

type CustomFoodsStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CustomFoodsContextValue {
  status: CustomFoodsStatus
  /** Newest first. */
  foods: CustomFood[]
  addFood: (input: CustomFoodInput) => Promise<CustomFood>
  removeFood: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const CustomFoodsContext = createContext<CustomFoodsContextValue | null>(null)

export function CustomFoodsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState<CustomFoodsStatus>('idle')
  const [foods, setFoods] = useState<CustomFood[]>([])

  const load = useCallback(async (signal?: AbortSignal) => {
    const { foods: rows } = await foodsApi.list(signal)
    setFoods(rows)
  }, [])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      await load()
      setStatus('ready')
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return
      setStatus('error')
    }
  }, [isAuthenticated, load])

  // Load (and clear) whenever the session changes.
  useEffect(() => {
    if (!isAuthenticated) {
      setFoods([])
      setStatus('idle')
      return
    }

    const controller = new AbortController()
    setStatus('loading')
    load(controller.signal)
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        if ((error as Error)?.name !== 'AbortError') setStatus('error')
      })

    return () => controller.abort()
  }, [isAuthenticated, user?.id, load])

  const addFood = useCallback(async (input: CustomFoodInput) => {
    const { food } = await foodsApi.create(input)
    setFoods((current) => [food, ...current.filter((row) => row.id !== food.id)])
    setStatus('ready')
    return food
  }, [])

  const removeFood = useCallback(async (id: string) => {
    await foodsApi.remove(id)
    setFoods((current) => current.filter((food) => food.id !== id))
  }, [])

  const value = useMemo<CustomFoodsContextValue>(
    () => ({ status, foods, addFood, removeFood, refresh }),
    [status, foods, addFood, removeFood, refresh],
  )

  return <CustomFoodsContext.Provider value={value}>{children}</CustomFoodsContext.Provider>
}

export function useCustomFoods(): CustomFoodsContextValue {
  const context = useContext(CustomFoodsContext)
  if (!context) throw new Error('useCustomFoods must be used inside <CustomFoodsProvider>')
  return context
}
