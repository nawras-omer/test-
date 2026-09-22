import { ProgressRing } from '@/components/ui/ProgressRing'
import { PlusIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useEntries } from '@/lib/entries'
import { percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import { MACRO_COLORS } from './macroColors'
import type { TranslationKey } from '@/i18n'

const MACRO_ROWS: { key: TranslationKey; field: 'protein' | 'carbs' | 'fat'; color: string }[] = [
  { key: 'dashboard.macros.protein', field: 'protein', color: MACRO_COLORS.protein },
  { key: 'dashboard.macros.carbs', field: 'carbs', color: MACRO_COLORS.carbs },
  { key: 'dashboard.macros.fat', field: 'fat', color: MACRO_COLORS.fat },
]

/** Combined ring + macros - user requested to combine these two cards */
export function TodaySummaryCard() {
  const { t, locale } = useI18n()
  const { openFoodLog } = useFoodLog()
  const { todayTotals, goals, remaining, overGoal, status } = useEntries()

  const n = (value: number) => formatNumber(value, locale)
  const percent = Math.round(percentOfGoal(todayTotals.calories, goals.calories))
  const loading = status === 'loading' && todayTotals.count === 0

  return (
    <section className="card card--pad">
      {/* Ring section */}
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
        <span className="ring__number numeric">{loading ? '—' : n(todayTotals.calories)}</span>
        <span className="ring__caption">
          {overGoal
            ? `${t('dashboard.ring.over')} · ${n(Math.abs(remaining))}`
            : `${t('dashboard.ring.remaining')} · ${n(Math.max(remaining, 0))}`}
        </span>
      </ProgressRing>

      <div className="legend" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
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
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--divider)', margin: 'var(--space-6) 0' }} />

      {/* Macros section */}
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.macros.title')}</h2>
          <p className="card__subtitle">{t('dashboard.macros.subtitle')}</p>
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--space-4)' }}>
        {MACRO_ROWS.map((row) => {
          const consumed = todayTotals[row.field]
          const goal = goals[row.field]
          const left = Math.max(Math.round((goal - consumed) * 10) / 10, 0)
          const complete = goal > 0 && consumed >= goal

          return (
            <div className="macro" key={row.key}>
              <div className="macro__head">
                <span className="macro__name">{t(row.key)}</span>
                <span className="macro__amount">
                  {formatNumber(consumed, locale)} / {formatNumber(goal, locale)} {t('common.g')}
                </span>
              </div>
              <div
                className="bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={consumed}
                aria-label={t(row.key)}
              >
                <div
                  className="bar__fill"
                  style={{
                    width: `${percentOfGoal(consumed, goal)}%`,
                    ['--fill' as string]: row.color,
                  }}
                />
              </div>
              <p className="macro__note">
                {complete
                  ? t('dashboard.macros.complete')
                  : t('dashboard.macros.left', { value: formatNumber(left, locale), unit: t('common.g') })}
              </p>
            </div>
          )
        })}
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
