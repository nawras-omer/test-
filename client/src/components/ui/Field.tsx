import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertIcon, EyeIcon, EyeOffIcon } from './Icons'
import { useI18n } from '@/i18n'

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: string
  /** Leading adornment (mail, lock, …). */
  icon?: ReactNode
  /** Trailing adornment rendered inside the control (e.g. a password toggle). */
  trailing?: ReactNode
  optionalLabel?: string
}

/** Labelled text input with icon, hint and error wiring (aria-describedby). */
export function Field({
  label,
  error,
  hint,
  icon,
  trailing,
  optionalLabel,
  className,
  ...inputProps
}: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {optionalLabel ? <span className="text-soft"> · {optionalLabel}</span> : null}
      </label>

      <div className="input-wrap">
        {icon ? <span className="input-wrap__icon">{icon}</span> : null}
        <input
          id={id}
          className={['input', icon ? 'input--with-icon' : '', error ? 'input--error' : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...inputProps}
        />
        {trailing}
      </div>

      {error ? (
        <p className="field__error" id={errorId}>
          <AlertIcon size={14} />
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Password input with a show/hide toggle; the label follows the active language. */
export function PasswordField({ label, error, hint, ...inputProps }: Omit<FieldProps, 'icon' | 'trailing'>) {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      type={visible ? 'text' : 'password'}
      className="input--with-action"
      trailing={
        <button
          type="button"
          className="input-action"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      }
      {...inputProps}
    />
  )
}
