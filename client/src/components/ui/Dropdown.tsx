import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

/** Closes a floating element when clicking outside of it (or pressing Escape). */
export function useDismissable<T extends HTMLElement>(active: boolean, onDismiss: () => void) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const node = ref.current
      if (node && !node.contains(event.target as Node)) onDismiss()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, onDismiss])

  return ref
}

interface DropdownProps {
  /** Receives the open state so the trigger can style itself. */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  /** Receives `close` so menu items can dismiss the menu after acting. */
  children: (state: { close: () => void }) => ReactNode
  align?: 'start' | 'end'
  wide?: boolean
  /** Optional accessible name for the popup. */
  menuLabel?: string
}

/**
 * Headless dropdown: trigger + panel, click-outside and Escape handling.
 * The panel is position:absolute with logical inline properties, so it flips
 * correctly in RTL layouts.
 */
export function Dropdown({ trigger, children, align = 'end', wide = false, menuLabel }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const ref = useDismissable<HTMLDivElement>(open, close)
  const id = useId()

  return (
    <div className="dropdown" ref={ref}>
      {trigger({
        open,
        toggle: () => setOpen((value) => !value),
      })}
      {open && (
        <div
          id={id}
          className={[
            'dropdown__menu',
            align === 'start' ? 'dropdown__menu--start' : '',
            wide ? 'dropdown__menu--wide' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="menu"
          aria-label={menuLabel}
        >
          {children({ close })}
        </div>
      )}
    </div>
  )
}
