import { DAILY_GOAL, WEEKLY_CALORIES, lastSevenDays } from '@/data/placeholder'
import { formatDate, formatNumber, weekdayLabel } from '@/lib/format'
import { useI18n } from '@/i18n'

/**
 * Seven-day calorie bars. Built from flex columns, so the chart runs
 * right-to-left automatically in Arabic and Sorani.
 */
export function WeeklyChartCard() {
  const { t, locale } = useI18n()
  const days = lastSevenDays()
  const max = Math.max(DAILY_GOAL, ...WEEKLY_CALORIES)
  const targetPercent = (DAILY_GOAL / max) * 100

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.week.title')}</h2>
          <p className="card__subtitle">{t('dashboard.week.subtitle')}</p>
        </div>
        <span className="badge badge--outline">
          {t('dashboard.week.target')}: <span className="numeric">{formatNumber(DAILY_GOAL, locale)}</span>
        </span>
      </div>

      <div className="chart" style={{ position: 'relative' }}>
        <span className="chart__target" style={{ bottom: `calc(${targetPercent}% + 22px)` }} aria-hidden="true" />
        {WEEKLY_CALORIES.map((value, index) => {
          const day = days[index]
          const isToday = index === WEEKLY_CALORIES.length - 1
          const height = Math.round((value / max) * 100)

          return (
            <div className={isToday ? 'chart__col chart__col--today' : 'chart__col'} key={value + '-' + index}>
              <span className="text-xs text-soft numeric">{formatNumber(value, locale)}</span>
              <div
                className={isToday ? 'chart__bar chart__bar--today' : 'chart__bar'}
                style={{ height: `${height}%` }}
                title={`${formatDate(day, locale, { day: 'numeric', month: 'long' })}: ${formatNumber(value, locale)} ${t('common.kcal')}`}
              />
              <span className="chart__label">{weekdayLabel(day, locale)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
