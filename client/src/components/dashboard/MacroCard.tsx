import { MACRO_COLORS } from './macroColors'
import { useEntries } from '@/lib/entries'
import { percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import type { TranslationKey } from '@/i18n'

const MACRO_ROWS: { key: TranslationKey; field: 'protein' | 'carbs' | 'fat'; color: string }[] = [
  { key: 'dashboard.macros.protein', field: 'protein', color: MACRO_COLORS.protein },
  { key: 'dashboard.macros.carbs', field: 'carbs', color: MACRO_COLORS.carbs },
  { key: 'dashboard.macros.fat', field: 'fat', color: MACRO_COLORS.fat },
]

/** Protein / carbs / fat progress toward today's targets. */
export function MacroCard() {
  const { t, locale } = useI18n()
  const { todayTotals, goals } = useEntries()

  return (
    <section className="card card--pad">
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
    </section>
  )
}
