/**
 * Goal-setting page: today's progress against your targets, the targets
 * themselves, the profile the calculator reads, and the weekly summary.
 */
import { GoalProgressCard } from '@/components/goals/GoalProgressCard'
import { ProfileCard } from '@/components/goals/ProfileCard'
import { WeeklySummaryCard } from '@/components/goals/WeeklySummaryCard'
import { GoalsCard } from '@/components/settings/GoalsCard'
import { TargetIcon } from '@/components/ui/Icons'
import { useI18n } from '@/i18n'

export function GoalsPage() {
  const { t } = useI18n()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('pages.goals.eyebrow')}</p>
          <h1 className="page__title">{t('pages.goals.title')}</h1>
          <p className="page__subtitle">{t('pages.goals.subtitle')}</p>
        </div>

        <div className="page__actions">
          <span className="badge badge--outline">
            <TargetIcon size={14} />
            {t('goals.targets.title')}
          </span>
        </div>
      </header>

      <div className="stack" style={{ gap: 'var(--space-5)' }}>
        <GoalProgressCard />

        <div className="grid-2">
          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <GoalsCard />
          </div>
          <ProfileCard />
        </div>

        <WeeklySummaryCard />
      </div>
    </div>
  )
}
