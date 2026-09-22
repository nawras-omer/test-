import { TodaySummaryCard } from '@/components/dashboard/TodaySummaryCard'
import { MealBreakdownCard } from '@/components/dashboard/MealBreakdownCard'
import { StatCards } from '@/components/dashboard/StatCards'
import { PlusIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useAuth } from '@/lib/auth'
import { useEntries } from '@/lib/entries'
import { greetingKey } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

export function DashboardPage() {
  const { t } = useI18n()
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
      </header>

      <SectionSubNav section="calories" />

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

        {/* Combined: calorie ring + macros */}
        <TodaySummaryCard />

        {/* 2nd: Today by meal with icons */}
        <MealBreakdownCard />

        <StatCards />
      </div>

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
