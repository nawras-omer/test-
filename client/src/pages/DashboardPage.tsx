import { CalorieCard } from '@/components/dashboard/CalorieCard'
import { MacroCard } from '@/components/dashboard/MacroCard'
import { MealsCard } from '@/components/dashboard/MealsCard'
import { StatCards } from '@/components/dashboard/StatCards'
import { WeeklyChartCard } from '@/components/dashboard/WeeklyChartCard'
import { QuickActionsCard, StreakCard, TipCard, WaterCard } from '@/components/dashboard/SideCards'
import { CalendarIcon, PlusIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { greetingKey } from '@/lib/utils'
import { useComingSoon } from '@/hooks/useComingSoon'
import { useI18n } from '@/i18n'

export function DashboardPage() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const comingSoon = useComingSoon()

  const firstName = (user?.name ?? '').split(' ')[0]

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page__title">{t(greetingKey(), { name: firstName })}</h1>
          <p className="page__subtitle">{t('dashboard.subtitle')}</p>
        </div>

        <div className="page__actions">
          <span className="badge badge--outline">
            <CalendarIcon size={14} />
            {formatDate(new Date(), locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button type="button" className="btn btn--primary" onClick={comingSoon}>
            <PlusIcon size={18} />
            {t('actions.addMeal')}
          </button>
        </div>
      </header>

      <div className="stack" style={{ gap: 'var(--space-5)' }}>
        <StatCards />

        <div className="grid-main">
          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <CalorieCard />
            <WeeklyChartCard />
            <MealsCard />
          </div>

          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <MacroCard />
            <WaterCard />
            <StreakCard />
            <TipCard />
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </div>
  )
}
