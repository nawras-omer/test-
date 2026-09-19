import { Link } from 'react-router-dom'
import { ChatPanel } from '@/components/assistant/ChatPanel'
import { CalorieCard } from '@/components/dashboard/CalorieCard'
import { MacroCard } from '@/components/dashboard/MacroCard'
import { MealBreakdownCard } from '@/components/dashboard/MealBreakdownCard'
import { RecentEntriesCard } from '@/components/dashboard/RecentEntriesCard'
import { StatCards } from '@/components/dashboard/StatCards'
import { WeeklyChartCard } from '@/components/dashboard/WeeklyChartCard'
import { CalendarIcon, PlusIcon, SparkleIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useAuth } from '@/lib/auth'
import { useEntries } from '@/lib/entries'
import { formatDate } from '@/lib/format'
import { greetingKey } from '@/lib/utils'
import { useI18n } from '@/i18n'

export function DashboardPage() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { openFoodLog } = useFoodLog()
  const { todayTotals, status } = useEntries()

  const firstName = (user?.name ?? '').split(' ')[0]
  const showEmptyState = status === 'ready' && todayTotals.count === 0

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
          <Link className="btn btn--outline" to="/assistant">
            <SparkleIcon size={17} />
            {t('assistant.open')}
          </Link>
          <button type="button" className="btn btn--primary" onClick={() => openFoodLog()}>
            <PlusIcon size={18} />
            {t('actions.logFood')}
          </button>
        </div>
      </header>

      <div className="stack" style={{ gap: 'var(--space-5)' }}>
        {showEmptyState ? (
          <section className="card card--pad empty-hero">
            <div>
              <h2 className="empty-state__title">{t('dashboard.empty.title')}</h2>
              <p className="empty-state__body">{t('dashboard.empty.body')}</p>
            </div>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => openFoodLog()}>
              <PlusIcon size={18} />
              {t('dashboard.empty.cta')}
            </button>
          </section>
        ) : null}

        <StatCards />

        <div className="grid-main">
          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <CalorieCard />
            <WeeklyChartCard />
            <RecentEntriesCard />
          </div>

          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <MacroCard />
            <MealBreakdownCard />
            {/* The assistant keeps its history beside the dashboard, as its own
                column — on phones it fills the width and scrolls internally. */}
            <ChatPanel />
          </div>
        </div>
      </div>

      {/* Quick "log food" affordance, thumb-reachable on phones. */}
      <button
        type="button"
        className="fab"
        onClick={() => openFoodLog()}
        aria-label={t('actions.logFood')}
      >
        <PlusIcon size={22} />
        <span>{t('actions.logFood')}</span>
      </button>
    </div>
  )
}
