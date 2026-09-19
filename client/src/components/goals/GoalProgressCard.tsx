/**
 * "Today against your targets" — the visual progress indicators for the
 * goal-setting page: a calorie ring plus one bar per macro, each with the
 * numbers spelled out (no percentage guessing).
 */
import { MACRO_COLORS } from '@/components/dashboard/macroColors'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { TargetIcon } from '@/components/ui/Icons'
import { percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useEntries } from '@/lib/entries'
import { useI18n, type TranslationKey } from '@/i18n'

const MACRO_ROWS: { key: TranslationKey; field: 'protein' | 'carbs' | 'fat'; color: string }[] = [
  { key: 'dashboard.macros.protein', field: 'protein', color: MACRO_COLORS.protein },
  { key: 'dashboard.macros.carbs', field: 'carbs', color: MACRO_COLORS.carbs },
  { key: 'dashboard.macros.fat', field: 'fat', color: MACRO_COLORS.fat },
]

export function GoalProgressCard() {
  const { t, locale } = useI18n()
  const { todayTotals, goals, remaining, overGoal } = useEntries()

  const percent = percentOfGoal(todayTotals.calories, goals.calories)

  return (
    <section className="card card--pad" data-testid="goal-progress">
      <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="stat__icon stat__icon--accent" aria-hidden="true">
          <TargetIcon size={19} />
        </span>
        <div>
          <h2 className="card__title">{t('goals.progress.title')}</h2>
          <p className="card__subtitle">{t('goals.progress.body')}</p>
        </div>
      </div>

      <div className="goal-progress">
        <ProgressRing
          value={todayTotals.calories}
          max={goals.calories}
          over={overGoal}
          label={t('goals.progress.title')}
        >
          <span className="ring__number numeric">{formatNumber(todayTotals.calories, locale)}</span>
          <span className="ring__caption">
            {t('common.of')} {formatNumber(goals.calories, locale)} {t('common.kcal')}
          </span>
        </ProgressRing>

        <div className="goal-progress__side">
          <p className={`goal-progress__headline${overGoal ? ' goal-progress__headline--over' : ''}`}>
            {overGoal
              ? t('goals.progress.over', { kcal: formatNumber(Math.abs(remaining), locale) })
              : t('goals.progress.remaining', { kcal: formatNumber(remaining, locale) })}
          </p>
          <p className="goal-progress__percent numeric">
            {t('goals.progress.percent', { percent: formatNumber(percent, locale) })}
          </p>

          <dl className="goal-facts">
            <div>
              <dt>{t('goals.progress.consumed')}</dt>
              <dd className="numeric">
                {formatNumber(todayTotals.calories, locale)} {t('common.kcal')}
              </dd>
            </div>
            <div>
              <dt>{t('goals.progress.target')}</dt>
              <dd className="numeric">
                {formatNumber(goals.calories, locale)} {t('common.kcal')}
              </dd>
            </div>
          </dl>

          {todayTotals.count === 0 ? <p className="field__hint">{t('goals.progress.empty')}</p> : null}
        </div>
      </div>

      <div className="stack" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
        <p className="card__subtitle">{t('goals.progress.macros')}</p>
        {MACRO_ROWS.map((row) => {
          const consumed = todayTotals[row.field]
          const goal = goals[row.field]
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
                  style={{ width: `${percentOfGoal(consumed, goal)}%`, ['--fill' as string]: row.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
