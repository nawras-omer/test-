import type { ReactNode } from 'react'
import { useComingSoon } from '@/hooks/useComingSoon'
import type { TranslationKey } from '@/i18n'
import { useI18n } from '@/i18n'

interface PlaceholderPageProps {
  eyebrowKey?: TranslationKey
  titleKey: TranslationKey
  subtitleKey: TranslationKey
  icon: ReactNode
  /** Feature bullets describing what will live here. */
  upcoming?: TranslationKey[]
}

/**
 * Shared shell for screens that are part of the roadmap but out of scope for the
 * foundation build. Keeps navigation honest: you can visit them, and they say so.
 */
export function PlaceholderPage({
  eyebrowKey = 'common.comingSoon',
  titleKey,
  subtitleKey,
  icon,
  upcoming = [],
}: PlaceholderPageProps) {
  const { t } = useI18n()
  const comingSoon = useComingSoon()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t(eyebrowKey)}</p>
          <h1 className="page__title">{t(titleKey)}</h1>
          <p className="page__subtitle">{t(subtitleKey)}</p>
        </div>
      </header>

      <div className="centered-panel" style={{ minHeight: '40vh' }}>
        <span className="centered-panel__icon" aria-hidden="true">
          {icon}
        </span>
        <p className="text-muted" style={{ maxWidth: '44ch' }}>
          {t('common.placeholderNote')}
        </p>
        {upcoming.length > 0 && (
          <ul className="stack" style={{ gap: 'var(--space-2)', textAlign: 'start' }}>
            {upcoming.map((key) => (
              <li className="row text-sm text-muted" key={key}>
                <span className="badge badge--brand">{t('common.soon')}</span>
                {t(key)}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn--outline" onClick={comingSoon}>
          {t('actions.retry')}
        </button>
      </div>
    </div>
  )
}
