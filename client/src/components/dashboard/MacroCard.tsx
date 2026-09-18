import { MACROS } from '@/data/placeholder'
import { formatNumber } from '@/lib/format'
import { clampPercent } from '@/lib/utils'
import { useI18n } from '@/i18n'

/** Protein / carbs / fat progress bars toward daily targets. */
export function MacroCard() {
  const { t, locale } = useI18n()

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.macros.title')}</h2>
          <p className="card__subtitle">{t('dashboard.macros.subtitle')}</p>
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--space-4)' }}>
        {MACROS.map((macro) => (
          <div className="macro" key={macro.key}>
            <div className="macro__head">
              <span className="macro__name">{t(macro.key)}</span>
              <span className="macro__amount">
                {formatNumber(macro.current, locale)} / {formatNumber(macro.goal, locale)} {t('common.g')}
              </span>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={macro.goal}
              aria-valuenow={macro.current}
              aria-label={t(macro.key)}
            >
              <div
                className="bar__fill"
                style={{
                  width: `${clampPercent(macro.current, macro.goal)}%`,
                  ['--fill' as string]: macro.colorVar,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
