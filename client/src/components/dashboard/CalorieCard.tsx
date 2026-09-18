import { ProgressRing } from '@/components/ui/ProgressRing'
import { PlusIcon } from '@/components/ui/Icons'
import { BURNED, CONSUMED, DAILY_GOAL } from '@/data/placeholder'
import { useComingSoon } from '@/hooks/useComingSoon'
import { formatNumber } from '@/lib/format'
import { clampPercent } from '@/lib/utils'
import { useI18n } from '@/i18n'

/** Daily energy balance: animated ring + breakdown legend. */
export function CalorieCard() {
  const { t, locale } = useI18n()
  const comingSoon = useComingSoon()

  const goal = DAILY_GOAL
  const consumed = CONSUMED
  const remaining = Math.max(goal - consumed, 0)
  const percent = Math.round(clampPercent(consumed, goal))

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('common.today')}</h2>
          <p className="card__subtitle">{t('dashboard.ring.caption', { value: formatNumber(goal, locale) })}</p>
        </div>
        <span className="badge badge--brand numeric">{percent}%</span>
      </div>

      <ProgressRing
        value={consumed}
        max={goal}
        label={`${formatNumber(consumed, locale)} / ${formatNumber(goal, locale)} ${t('common.kcal')}`}
      >
        <span className="ring__number numeric">{formatNumber(consumed, locale)}</span>
        <span className="ring__caption">
          {t('dashboard.ring.remaining')} · <span className="numeric">{formatNumber(remaining, locale)}</span>
        </span>
      </ProgressRing>

      <div className="legend" style={{ marginTop: 'var(--space-6)' }}>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--primary)' }} />
            {t('dashboard.stats.consumed')}
          </span>
          <span className="legend__value numeric">
            {formatNumber(consumed, locale)} {t('common.kcal')}
          </span>
        </div>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--track)' }} />
            {t('dashboard.stats.caloriesLeft')}
          </span>
          <span className="legend__value numeric">
            {formatNumber(remaining, locale)} {t('common.kcal')}
          </span>
        </div>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--warning)' }} />
            {t('dashboard.stats.burned')}
          </span>
          <span className="legend__value numeric">
            {formatNumber(BURNED, locale)} {t('common.kcal')}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--secondary btn--block"
        style={{ marginTop: 'var(--space-5)' }}
        onClick={comingSoon}
      >
        <PlusIcon size={18} />
        {t('actions.addMeal')}
      </button>
    </section>
  )
}
