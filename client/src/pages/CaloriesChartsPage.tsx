/**
 * Calories / Charts — composes Analytics + Insights.
 * Photo scan removed per user request.
 */
import { useState } from 'react'
import { AnalyticsPage } from './AnalyticsPage'
import { InsightsPage } from './InsightsPage'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

type Tab = 'analytics' | 'insights'

export function CaloriesChartsPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('analytics')

  return (
    <div className="page" data-testid="calories-charts-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('caloriesCharts.eyebrow')}</p>
          <h1 className="page__title">{t('caloriesCharts.title')}</h1>
          <p className="page__subtitle">{t('caloriesCharts.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="calories" />

      <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <button
          type="button"
          className={tab === 'analytics' ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'}
          onClick={() => setTab('analytics')}
        >
          {t('caloriesCharts.tabs.analytics')}
        </button>
        <button
          type="button"
          className={tab === 'insights' ? 'btn btn--primary btn--sm' : 'btn btn--outline btn--sm'}
          onClick={() => setTab('insights')}
        >
          {t('caloriesCharts.tabs.insights')}
        </button>
      </div>

      {tab === 'analytics' && <AnalyticsPage />}
      {tab === 'insights' && <InsightsPage />}
    </div>
  )
}
