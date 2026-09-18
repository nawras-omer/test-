import type { ReactNode } from 'react'
import { AlertIcon, CheckCircleIcon, InfoIcon } from './Icons'

type Tone = 'danger' | 'success' | 'info'

const ICONS: Record<Tone, ReactNode> = {
  danger: <AlertIcon size={18} />,
  success: <CheckCircleIcon size={18} />,
  info: <InfoIcon size={18} />,
}

export function Alert({
  tone = 'danger',
  children,
  role = 'alert',
}: {
  tone?: Tone
  children: ReactNode
  role?: 'alert' | 'status'
}) {
  return (
    <div className={`alert alert--${tone}`} role={role}>
      <span className="alert__icon">{ICONS[tone]}</span>
      <span>{children}</span>
    </div>
  )
}
