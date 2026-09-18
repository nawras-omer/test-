import { useEntries } from '@/lib/entries'
import { formatDate, formatNumber, weekdayLabel } from '@/lib/format'
import { parseDateKey } from '@/lib/food'
import { useI18n } from '@/i18n'

/**
 * Seven-day calorie bars built from real entries.
 * Flex columns mean the chart runs right-to-left automatically in Arabic and
 * Sorani, and empty days simply render as zero-height bars.
 */
export function WeeklyChartCard() {
  const { t, locale } = useI18n()
  const { week, goals, today } = useEntries()

  const max = Math.max(goals.calories, ...week.map((day) => day.calories), 1)
  const targetPercent = (goals.calories / max) * 100
  const hasData = week.some((day) => day.calories > 0)

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.week.title')}</h2>
          <p className="card__subtitle">{t('dashboard.week.subtitle')}</p>
        </div>
        <span className="badge badge--outline">
          {t('dashboard.week.target')}: <span className="numeric">{formatNumber(goals.calories, locale)}</span>
        </span>
      </div>

      {!hasData ? (
        <p className="text-sm text-muted" style={{ marginBlock: 'var(--space-6)' }}>
          {t('dashboard.week.empty')}
        </p>
      ) : null}

      <div className="chart" style={{ position: 'relative' }}>
        <span className="chart__target" style={{ bottom: `calc(${targetPercent}% + 22px)` }} aria-hidden="true" />
        {week.map((day) => {
          const isToday = day.date === today
          const height = day.calories > 0 ? Math.max(Math.round((day.calories / max) * 100), 3) : 0

          return (
            <div className={isToday ? 'chart__col chart__col--today' : 'chart__col'} key={day.date}>
              <span className="text-xs text-soft numeric">{day.calories > 0 ? formatNumber(day.calories, locale) : ''}</span>
              <div
                className={isToday ? 'chart__bar chart__bar--today' : 'chart__bar'}
                style={{ height: `${height}%` }}
                title={`${formatDate(parseDateKey(day.date), locale, { day: 'numeric', month: 'long' })}: ${formatNumber(day.calories, locale)} ${t('common.kcal')}`}
              />
              <span className="chart__label">{weekdayLabel(parseDateKey(day.date), locale)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
