import { BoltIcon, DropletIcon, FlameIcon, TargetIcon } from '@/components/ui/Icons'
import { BURNED, CALORIES_LEFT, CONSUMED, DAILY_GOAL, WATER_DONE, WATER_GOAL } from '@/data/placeholder'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'

/** Four KPI tiles above the fold. */
export function StatCards() {
  const { t, locale } = useI18n()
  const n = (value: number) => formatNumber(value, locale)

  const stats = [
    {
      key: 'calories-left',
      icon: <TargetIcon size={20} />,
      tone: '',
      value: n(CALORIES_LEFT),
      unit: t('common.kcal'),
      label: t('dashboard.stats.caloriesLeft'),
    },
    {
      key: 'consumed',
      icon: <FlameIcon size={20} />,
      tone: '',
      value: n(CONSUMED),
      unit: t('common.kcal'),
      label: t('dashboard.stats.consumed'),
    },
    {
      key: 'burned',
      icon: <BoltIcon size={20} />,
      tone: 'stat__icon--warning',
      value: n(BURNED),
      unit: t('common.kcal'),
      label: t('dashboard.stats.burned'),
    },
    {
      key: 'water',
      icon: <DropletIcon size={20} />,
      tone: 'stat__icon--accent',
      value: `${n(WATER_DONE)}/${n(WATER_GOAL)}`,
      unit: t('common.cups'),
      label: t('dashboard.stats.water'),
    },
  ]

  return (
    <div className="grid-stats">
      {stats.map((stat) => (
        <article className="stat" key={stat.key}>
          <div className="stat__top">
            <span className={`stat__icon ${stat.tone}`} aria-hidden="true">
              {stat.icon}
            </span>
            <span className="badge badge--outline">{t('dashboard.stats.goal', { value: n(DAILY_GOAL) })}</span>
          </div>
          <div>
            <p className="stat__value numeric">
              {stat.value}
              <span className="stat__unit">{stat.unit}</span>
            </p>
            <p className="stat__label">{stat.label}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
