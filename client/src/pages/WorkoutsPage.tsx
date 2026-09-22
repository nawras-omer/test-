/**
 * Workout Today - clean page, subsections in-page.
 * Quick start removed per user request.
 */
import { useI18n } from '@/i18n'
import { TodayWorkoutCard } from '@/components/workouts/TodayWorkoutCard'
import { WorkoutStreakCard } from '@/components/workouts/WorkoutStreakCard'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

export function WorkoutsPage() {
  const { t } = useI18n()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('workouts.eyebrow')}</p>
          <h1 className="page__title">{t('workouts.title')}</h1>
          <p className="page__subtitle">{t('workouts.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="workout" />

      <div className="workout-grid">
        <TodayWorkoutCard />
        <WorkoutStreakCard />
      </div>
    </div>
  )
}
