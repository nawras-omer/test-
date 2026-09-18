import { ProgressRing } from '@/components/ui/ProgressRing'
import { PlusIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useEntries } from '@/lib/entries'
import { percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'

/** Today's energy balance: consumed vs goal, with the remaining budget. */
export function CalorieCard() {
  const { t, locale } = useI18n()
  const { openFoodLog } = useFoodLog()
  const { todayTotals, goals, remaining, overGoal, status } = useEntries()

  const n = (value: number) => formatNumber(value, locale)
  const percent = Math.round(percentOfGoal(todayTotals.calories, goals.calories))
  const loading = status === 'loading' && todayTotals.count === 0

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('common.today')}</h2>
          <p className="card__subtitle">{t('dashboard.ring.caption', { value: n(goals.calories) })}</p>
        </div>
        <span className={`badge numeric ${overGoal ? 'badge--danger' : 'badge--brand'}`}>{percent}%</span>
      </div>

      <ProgressRing
        value={todayTotals.calories}
        max={goals.calories}
        over={overGoal}
        label={`${n(todayTotals.calories)} / ${n(goals.calories)} ${t('common.kcal')}`}
      >
        <span className="ring__number numeric">
          {loading ? '—' : n(todayTotals.calories)}
        </span>
        <span className="ring__caption">
          {overGoal
            ? `${t('dashboard.ring.over')} · ${n(Math.abs(remaining))}`
            : `${t('dashboard.ring.remaining')} · ${n(Math.max(remaining, 0))}`}
        </span>
      </ProgressRing>

      <div className="legend" style={{ marginTop: 'var(--space-6)' }}>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--primary)' }} />
            {t('dashboard.stats.consumed')}
          </span>
          <span className="legend__value numeric">
            {n(todayTotals.calories)} {t('common.kcal')}
          </span>
        </div>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--track)' }} />
            {overGoal ? t('dashboard.ring.over') : t('dashboard.stats.remaining')}
          </span>
          <span className="legend__value numeric">
            {n(Math.abs(remaining))} {t('common.kcal')}
          </span>
        </div>
        <div className="legend__item">
          <span className="legend__key">
            <span className="legend__dot" style={{ ['--dot' as string]: 'var(--macro-protein)' }} />
            {t('dashboard.macros.protein')}
          </span>
          <span className="legend__value numeric">
            {n(todayTotals.protein)} {t('common.g')}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--secondary btn--block"
        style={{ marginTop: 'var(--space-5)' }}
        onClick={() => openFoodLog()}
      >
        <PlusIcon size={18} />
        {t('actions.logFood')}
      </button>
    </section>
  )
}
