import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './Icons'
import { useI18n } from '@/i18n'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  /** Sticky action row, usually the submit/cancel buttons. */
  footer?: ReactNode
  /** Rendered above the title (optional eyebrow). */
  eyebrow?: string
}

/**
 * Accessible dialog primitive.
 *
 * Renders into a portal, traps Tab focus, closes on Escape or backdrop click,
 * locks background scrolling and returns focus to the trigger on close. The
 * layout uses logical properties, so the header, close button and footer mirror
 * correctly in RTL; on narrow screens the dialog becomes a bottom sheet.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, eyebrow }: ModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const subtitleId = useId()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  // While open: remember the trigger, focus the first field, lock scrolling.
  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    const firstField = dialog?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea, button',
    )
    // Wait a frame so the element is laid out (and screens readers announce it).
    const frame = window.requestAnimationFrame(() => (firstField ?? dialog)?.focus())

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div
      className="modal-overlay"
      // Only a click that starts *and* ends on the backdrop dismisses.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div className="modal__heading">
            {eyebrow ? <p className="modal__eyebrow">{eyebrow}</p> : null}
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className="modal__subtitle" id={subtitleId}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon size={20} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
