import {
  BarcodeIcon,
  BookmarkIcon,
  DropletIcon,
  FlameIcon,
  PlusIcon,
  ScaleIcon,
  SparkleIcon,
} from '@/components/ui/Icons'
import {
  STREAK_DAYS,
  STREAK_WEEK,
  WATER_DONE,
  WATER_GOAL,
  lastSevenDays,
  tipKeyFor,
} from '@/data/placeholder'
import { useComingSoon } from '@/hooks/useComingSoon'
import { formatNumber, weekdayLabel } from '@/lib/format'
import { useI18n } from '@/i18n'

/* ------------------------------------------------------------------ water -- */
export function WaterCard() {
  const { t, locale } = useI18n()
  const comingSoon = useComingSoon()

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <span className="stat__icon stat__icon--accent" style={{ width: 32, height: 32 }} aria-hidden="true">
            <DropletIcon size={17} />
          </span>
          <h2 className="card__title">{t('dashboard.water.title')}</h2>
        </div>
        <span className="text-sm text-muted numeric">
          {t('dashboard.water.progress', {
            done: formatNumber(WATER_DONE, locale),
            goal: formatNumber(WATER_GOAL, locale),
          })}
        </span>
      </div>

      <div className="drops">
        {Array.from({ length: WATER_GOAL }, (_, index) => (
          <span
            key={index}
            className={index < WATER_DONE ? 'drop drop--filled' : 'drop'}
            aria-hidden="true"
          >
            <DropletIcon size={16} />
          </span>
        ))}
      </div>

      <button type="button" className="btn btn--outline btn--sm btn--block" style={{ marginTop: 'var(--space-4)' }} onClick={comingSoon}>
        <PlusIcon size={16} />
        {t('dashboard.water.add')}
      </button>
    </section>
  )
}

/* ----------------------------------------------------------------- streak -- */
export function StreakCard() {
  const { t, locale } = useI18n()
  const days = lastSevenDays()

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <span className="stat__icon stat__icon--warning" style={{ width: 32, height: 32 }} aria-hidden="true">
            <FlameIcon size={17} />
          </span>
          <h2 className="card__title">{t('dashboard.streak.title')}</h2>
        </div>
        <span className="badge badge--brand numeric">{t('dashboard.streak.value', { count: formatNumber(STREAK_DAYS, locale) })}</span>
      </div>

      <div className="streak">
        {STREAK_WEEK.map((done, index) => (
          <span key={index} className={done ? 'streak__day streak__day--done' : 'streak__day'}>
            {weekdayLabel(days[index], locale).slice(0, 2)}
          </span>
        ))}
      </div>

      <p className="text-xs text-soft" style={{ marginTop: 'var(--space-4)' }}>
        {t('dashboard.streak.body')}
      </p>
    </section>
  )
}

/* -------------------------------------------------------------------- tip -- */
export function TipCard() {
  const { t } = useI18n()

  return (
    <section className="card card--pad" style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary-border)' }}>
      <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <SparkleIcon size={18} />
        <h2 className="card__title">{t('dashboard.tip.title')}</h2>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(tipKeyFor())}
      </p>
    </section>
  )
}

/* ----------------------------------------------------------- quick actions -- */
export function QuickActionsCard() {
  const { t } = useI18n()
  const comingSoon = useComingSoon()

  const actions = [
    { key: 'log-meal', icon: <PlusIcon size={18} />, label: t('dashboard.quick.logMeal') },
    { key: 'scan', icon: <BarcodeIcon size={18} />, label: t('dashboard.quick.scan') },
    { key: 'weigh-in', icon: <ScaleIcon size={18} />, label: t('dashboard.quick.weighIn') },
    { key: 'recipe', icon: <BookmarkIcon size={18} />, label: t('dashboard.quick.recipe') },
  ]

  return (
    <section className="card card--pad">
      <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="card__title">{t('dashboard.quick.title')}</h2>
      </div>

      <div className="quick-actions">
        {actions.map((action) => (
          <button type="button" className="quick-action" key={action.key} onClick={comingSoon}>
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-soft" style={{ marginTop: 'var(--space-4)' }}>
        {t('common.placeholderNote')}
      </p>
    </section>
  )
}
