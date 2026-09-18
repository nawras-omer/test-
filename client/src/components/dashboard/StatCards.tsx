import { BoltIcon, FlameIcon, TargetIcon } from '@/components/ui/Icons'
import { useEntries } from '@/lib/entries'
import { percentOfGoal } from '@/lib/food'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'

/** KPI tiles: calories consumed, calories remaining, entries logged today. */
export function StatCards() {
  const { t, locale } = useI18n()
  const { todayTotals, goals, remaining, overGoal } = useEntries()

  const n = (value: number) => formatNumber(value, locale)
  const percent = Math.round(percentOfGoal(todayTotals.calories, goals.calories))

  const cards = [
    {
      key: 'consumed',
      icon: <FlameIcon size={20} />,
      tone: '',
      value: n(todayTotals.calories),
      unit: t('common.kcal'),
      label: t('dashboard.stats.consumed'),
      badge: t('dashboard.stats.ofGoal', { value: n(percent) }),
      badgeTone: 'badge--brand',
    },
    {
      key: 'remaining',
      icon: <TargetIcon size={20} />,
      tone: overGoal ? 'stat__icon--warning' : '',
      value: n(Math.abs(remaining)),
      unit: t('common.kcal'),
      label: t('dashboard.stats.remaining'),
      badge: overGoal
        ? t('dashboard.stats.overBy', { value: n(Math.abs(remaining)) })
        : t('dashboard.stats.goal', { value: n(goals.calories) }),
      badgeTone: overGoal ? 'badge--danger' : 'badge--outline',
      danger: overGoal,
    },
    {
      key: 'entries',
      icon: <BoltIcon size={20} />,
      tone: 'stat__icon--accent',
      value: n(todayTotals.count),
      unit: '',
      label: t('dashboard.stats.entriesToday'),
      badge: t('dashboard.stats.entryCount', { count: n(todayTotals.count) }),
      badgeTone: 'badge--outline',
    },
  ]

  return (
    <div className="grid-stats">
      {cards.map((card) => (
        <article className="stat" key={card.key} data-tone={card.danger ? 'danger' : undefined}>
          <div className="stat__top">
            <span className={`stat__icon ${card.tone}`} aria-hidden="true">
              {card.icon}
            </span>
            <span className={`badge ${card.badgeTone} numeric`}>{card.badge}</span>
          </div>
          <div>
            <p className="stat__value numeric">
              {card.value}
              {card.unit ? <span className="stat__unit">{card.unit}</span> : null}
            </p>
            <p className="stat__label">{card.label}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
