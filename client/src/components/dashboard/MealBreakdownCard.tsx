import { MEAL_COLORS } from './macroColors'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useEntries } from '@/lib/entries'
import { entriesForMeal, percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import { MEAL_TYPES, type MealType } from '@/types'

/** Where today's calories came from, split by meal — each row opens the dialog. */
export function MealBreakdownCard() {
  const { t, locale } = useI18n()
  const { openFoodLog } = useFoodLog()
  const { todayEntries, todayTotals, today } = useEntries()

  const n = (value: number) => formatNumber(value, locale)

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.meals.title')}</h2>
          <p className="card__subtitle">{t('dashboard.meals.subtitle')}</p>
        </div>
      </div>

      {todayTotals.count === 0 ? (
        <p className="text-sm text-muted">{t('dashboard.meals.empty')}</p>
      ) : (
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          {MEAL_TYPES.map((mealType: MealType) => {
            const entries = entriesForMeal(todayEntries, mealType)
            const calories = entries.reduce((total, entry) => total + entry.calories, 0)
            const share = percentOfGoal(calories, todayTotals.calories)

            return (
              <div className="macro" key={mealType}>
                <div className="macro__head">
                  <span className="macro__name">{t(`meal.${mealType}`)}</span>
                  <span className="macro__amount numeric">
                    {calories > 0
                      ? `${n(calories)} ${t('common.kcal')}`
                      : t('dashboard.meals.none')}
                  </span>
                </div>
                <div className="bar" role="presentation">
                  <div
                    className="bar__fill"
                    style={{
                      width: `${share}%`,
                      ['--fill' as string]: MEAL_COLORS[mealType],
                    }}
                  />
                </div>
                <p className="macro__note">
                  {entries.length > 0 ? t('dashboard.meals.items', { count: n(entries.length) }) : '—'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <div className="quick-actions" style={{ marginTop: 'var(--space-5)' }}>
        {MEAL_TYPES.map((mealType) => (
          <button
            type="button"
            className="quick-action"
            key={mealType}
            onClick={() => openFoodLog({ mealType, date: today })}
          >
            + {t(`meal.${mealType}`)}
          </button>
        ))}
      </div>
    </section>
  )
}
