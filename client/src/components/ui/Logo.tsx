import { FlameIcon } from './Icons'
import { useI18n } from '@/i18n'

interface LogoProps {
  /** Hide the wordmark and show just the mark (used on very small screens). */
  compact?: boolean
  showTagline?: boolean
  /** Rendered as <span> inside links so we never nest interactive elements badly. */
  className?: string
}

/** The Kalori lockup: gradient mark + wordmark + optional tagline. */
export function Logo({ showTagline = true, className }: LogoProps) {
  const { t } = useI18n()

  return (
    <span className={['brand', className].filter(Boolean).join(' ')}>
      <span className="brand__mark" aria-hidden="true">
        <FlameIcon size={22} />
      </span>
      <span className="brand__text">
        <span className="brand__name">Kalori</span>
        {showTagline ? <span className="brand__tagline">{t('app.tagline')}</span> : null}
      </span>
    </span>
  )
}
