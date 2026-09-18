/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Tone = 'default' | 'success' | 'danger'

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

interface ToastContextValue {
  push: (message: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children, duration = 4200 }: { children: ReactNode; duration?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef<number[]>([])

  const push = useCallback(
    (message: string, tone: Tone = 'default') => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
      timers.current.push(timer)
    },
    [duration],
  )

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <output key={toast.id} className="toast" data-tone={toast.tone}>
            {toast.message}
          </output>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  // Toasts are a nicety — never crash a screen because the provider is missing.
  return context ?? { push: () => undefined }
}
