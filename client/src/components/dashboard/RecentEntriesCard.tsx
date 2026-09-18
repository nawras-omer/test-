import { PlusIcon, TrashIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useToast } from '@/components/ui/Toast'
import { useEntries } from '@/lib/entries'
import { RECENT_LIMIT } from '@/lib/food'
import { formatDate, formatNumber, formatTime } from '@/lib/format'
import { parseDateKey } from '@/lib/food'
import { messageFor } from '@/lib/errors'
import { useState } from 'react'
import { useI18n } from '@/i18n'

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🥣',
  lunch: '🍽️',
  dinner: '🌙',
  snack: '🍎',
}

/** The five most recent logged foods, newest first. */
export function RecentEntriesCard() {
  const { t, locale } = useI18n()
  const { openFoodLog } = useFoodLog()
  const { recent, removeEntry, lastAddedId, status, today } = useEntries()
  const { push } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    setRemovingId(id)
    try {
      await removeEntry(id)
      push(t('food.deleted', { name }), 'default')
    } catch (error) {
      push(messageFor(t, error), 'danger')
    } finally {
      setRemovingId(null)
    }
  }

  const isToday = (date: string) => date === today

  return (
    <section className="card card--flush">
      <div className="card__header" style={{ paddingBottom: 'var(--space-5)' }}>
        <div>
          <h2 className="card__title">{t('dashboard.recent.title')}</h2>
          <p className="card__subtitle">{t('dashboard.recent.subtitle', { count: RECENT_LIMIT })}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => openFoodLog()}>
          <PlusIcon size={16} />
          {t('actions.logFood')}
        </button>
      </div>

      {status === 'loading' && recent.length === 0 ? (
        <div className="card__body stack" style={{ gap: 'var(--space-3)' }}>
          <div className="skeleton" style={{ height: 56 }} />
          <div className="skeleton" style={{ height: 56 }} />
          <div className="skeleton" style={{ height: 56 }} />
        </div>
      ) : recent.length === 0 ? (
        <div className="card__body">
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              🥗
            </span>
            <h3 className="empty-state__title">{t('dashboard.recent.empty.title')}</h3>
            <p className="empty-state__body">{t('dashboard.recent.empty.body')}</p>
            <button type="button" className="btn btn--primary" onClick={() => openFoodLog()}>
              <PlusIcon size={18} />
              {t('actions.logFood')}
            </button>
          </div>
        </div>
      ) : (
        <ul className="entry-list">
          {recent.map((entry) => (
            <li
              className="entry"
              key={entry.id}
              data-new={entry.id === lastAddedId ? 'true' : undefined}
              data-removing={entry.id === removingId ? 'true' : undefined}
            >
              <span className="entry__icon" aria-hidden="true">
                {MEAL_EMOJI[entry.mealType] ?? '🍽️'}
              </span>

              <div className="entry__info">
                <p className="entry__name">{entry.name}</p>
                <p className="entry__meta">
                  <span className="badge badge--outline">{t(`meal.${entry.mealType}`)}</span>
                  <span>{entry.servingSize || '—'}</span>
                  <span className="numeric">
                    {isToday(entry.date)
                      ? formatTime(entry.createdAt, locale)
                      : formatDate(parseDateKey(entry.date), locale, { day: 'numeric', month: 'short' })}
                  </span>
                </p>
                <p className="entry__macros numeric">
                  <span>{t('dashboard.macros.protein')} {formatNumber(entry.protein, locale)}</span>
                  <span>{t('dashboard.macros.carbs')} {formatNumber(entry.carbs, locale)}</span>
                  <span>{t('dashboard.macros.fat')} {formatNumber(entry.fat, locale)}</span>
                  <span>{t('common.g')}</span>
                </p>
              </div>

              <div className="entry__end">
                <p className="entry__kcal numeric">
                  {formatNumber(entry.calories, locale)} <span>{t('common.kcal')}</span>
                </p>
                <button
                  type="button"
                  className="entry__delete"
                  onClick={() => void handleDelete(entry.id, entry.name)}
                  disabled={removingId === entry.id}
                  aria-label={t('dashboard.recent.deleteEntry', { name: entry.name })}
                  title={t('actions.delete')}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <div className="card__footer">
          <p className="text-sm text-muted">{t('dashboard.recent.showing', { count: recent.length })}</p>
        </div>
      )}
    </section>
  )
}
