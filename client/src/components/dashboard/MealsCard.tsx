import { MEALS } from '@/data/placeholder'
import { PlusIcon } from '@/components/ui/Icons'
import { useComingSoon } from '@/hooks/useComingSoon'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'

/** Sample meal log — the first thing the real food diary will replace. */
export function MealsCard() {
  const { t, locale } = useI18n()
  const comingSoon = useComingSoon()

  return (
    <section className="card card--flush">
      <div className="card__header" style={{ paddingBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.meals.title')}</h2>
          <p className="card__subtitle">{t('dashboard.meals.subtitle')}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={comingSoon}>
          <PlusIcon size={16} />
          {t('actions.addMeal')}
        </button>
      </div>

      <ul className="meal-list">
        {MEALS.map((meal) => (
          <li className="meal" key={meal.id}>
            <span className="meal__icon" aria-hidden="true">
              {meal.emoji}
            </span>
            <div className="meal__info">
              <p className="meal__name">{t(meal.nameKey)}</p>
              <p className="meal__meta">
                <span className="badge badge--outline">{t(meal.slotKey)}</span>
                <span className="numeric">{meal.time}</span>
                <span>{t(meal.portionKey)}</span>
              </p>
            </div>
            <p className="meal__kcal numeric">
              {formatNumber(meal.kcal, locale)} <span>{t('common.kcal')}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="card__footer">
        <p className="text-sm text-muted">{t('dashboard.placeholder')}</p>
      </div>
    </section>
  )
}
