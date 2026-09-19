/**
 * Weekly summary: average intake and the goal-achievement rate, plus a small
 * per-day bar so the two headline numbers are easy to sanity-check.
 */
import { useMemo } from 'react'
import { ChartIcon } from '@/components/ui/Icons'
import { useEntries } from '@/lib/entries'
import { DASHBOARD_WINDOW_DAYS } from '@/lib/food'
import { formatNumber, weekdayLabel } from '@/lib/format'
import { ACHIEVEMENT_TOLERANCE, weeklyReport } from '@/lib/goals'
import { parseDateKey } from '@/lib/food'
import { useI18n } from '@/i18n'

export function WeeklySummaryCard() {
  const { t, locale } = useI18n()
  const { entries, goals, today } = useEntries()

  const report = useMemo(
    () => weeklyReport(entries, goals, DASHBOARD_WINDOW_DAYS, parseDateKey(today)),
    [entries, goals, today],
  )

  const peak = Math.max(...report.days.map((day) => day.totals.calories), goals.calories, 1)

  return (
    <section className="card card--pad" data-testid="weekly-summary">
      <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="stat__icon stat__icon--accent" aria-hidden="true">
          <ChartIcon size={19} />
        </span>
        <div>
          <h2 className="card__title">{t('weekly.title')}</h2>
          <p className="card__subtitle">{t('weekly.body')}</p>
        </div>
      </div>

      <div className="weekly-facts">
        <div className="weekly-fact">
          <span className="weekly-fact__label">{t('weekly.average')}</span>
          <span className="weekly-fact__value numeric" data-testid="weekly-average">
            {formatNumber(report.averageIntake, locale)} <small>{t('common.kcal')}</small>
          </span>
          <span className="weekly-fact__hint">
            {t('weekly.averageHint', { kcal: formatNumber(report.goal, locale) })}
          </span>
        </div>

        <div className="weekly-fact">
          <span className="weekly-fact__label">{t('weekly.rate')}</span>
          <span className="weekly-fact__value numeric" data-testid="weekly-rate">
            {formatNumber(report.achievementRate, locale)}%
          </span>
          <span className="weekly-fact__hint">
            {t('weekly.rateHint', {
              onTarget: formatNumber(report.onTargetDays, locale),
              logged: formatNumber(report.loggedDays, locale),
              tolerance: formatNumber(Math.round(ACHIEVEMENT_TOLERANCE * 100), locale),
            })}
          </span>
        </div>

        <div className="weekly-fact">
          <span className="weekly-fact__label">{t('weekly.logged')}</span>
          <span className="weekly-fact__value numeric">
            {formatNumber(report.loggedDays, locale)} <small>/ {formatNumber(report.days.length, locale)}</small>
          </span>
          <span className="weekly-fact__hint">
            {t('weekly.loggedHint', {
              count: formatNumber(report.loggedDays, locale),
              total: formatNumber(report.days.length, locale),
            })}
          </span>
        </div>

        <div className="weekly-fact">
          <span className="weekly-fact__label">{t('weekly.total')}</span>
          <span className="weekly-fact__value numeric">
            {formatNumber(report.totalCalories, locale)} <small>{t('common.kcal')}</small>
          </span>
          <span className="weekly-fact__hint">
            {t('weekly.totalHint', { average: formatNumber(report.averagePerDay, locale) })}
          </span>
        </div>
      </div>

      {report.loggedDays === 0 ? (
        <p className="field__hint" data-testid="weekly-empty">
          {t('weekly.empty')}
        </p>
      ) : (
        <>
          <div className="weekly-chart" role="img" aria-label={t('weekly.title')}>
            {report.days.map((day) => {
              return (
                <div className="weekly-chart__col" key={day.date} title={`${day.date} · ${formatNumber(day.totals.calories, locale)} ${t('common.kcal')}`}>
                  <div className="weekly-chart__track">
                    <div
                      className={`weekly-chart__bar${day.onTarget ? ' weekly-chart__bar--on' : ''}${day.ratio > 1 + ACHIEVEMENT_TOLERANCE ? ' weekly-chart__bar--over' : ''}`}
                      style={{ height: `${(day.totals.calories / peak) * 100}%` }}
                    />
                  </div>
                  <span className="weekly-chart__label">{weekdayLabel(parseDateKey(day.date), locale)}</span>
                </div>
              )
            })}
          </div>

          <p className="card__subtitle" style={{ marginTop: 'var(--space-4)' }}>
            {t('weekly.macros')}
          </p>
          <p className="weekly-macros numeric">
            <span>
              {t('dashboard.macros.protein')} {formatNumber(report.macroAverages.protein, locale)} {t('common.g')}
            </span>
            <span>
              {t('dashboard.macros.carbs')} {formatNumber(report.macroAverages.carbs, locale)} {t('common.g')}
            </span>
            <span>
              {t('dashboard.macros.fat')} {formatNumber(report.macroAverages.fat, locale)} {t('common.g')}
            </span>
          </p>
        </>
      )}
    </section>
  )
}
