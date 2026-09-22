/**
 * Workout / List — FLEX Leg Day detail
 */
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

const LEG_DAY_EXERCISES = [
  { name: 'Seated Leg Curl', sets: '4 sets', icon: '🦵' },
  { name: 'Hack Squat', sets: '5 sets', icon: '🏋️' },
  { name: 'Romanian Deadlift', sets: '4 sets', icon: '💪' },
  { name: 'Leg Extension', sets: '4 sets', icon: '🦵' },
  { name: 'Machine Calf Extension', sets: '3 sets', icon: '🦶' },
  { name: 'Hyperextension', sets: '3 sets', icon: '🧎' },
  { name: 'Leg Raise', sets: '3 sets', icon: '🦵' },
  { name: 'Cable Crunch', sets: '3 sets', icon: '🔥' },
]

export function WorkoutListPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="page" data-testid="workout-list-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('workoutList.eyebrow')}</p>
          <h1 className="page__title">{t('workoutList.title')}</h1>
          <p className="page__subtitle">{t('workoutList.subtitle', { count: '300+' })}</p>
        </div>
      </header>

      <SectionSubNav section="workout" />

      <div className="flex-theme">
        <div className="flex-page">
          {/* Detail hero */}
          <div className="flex-detail__hero">
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a2a3a, #2a1a3a)', display: 'grid', placeItems: 'center', fontSize: '80px' }}>🏋️</div>
            <div className="flex-detail__hero-overlay">
              <h1>Leg Day</h1>
            </div>
            <button style={{ position: 'absolute', top: '16px', left: '16px', width: '36px', height: '36px', borderRadius: '18px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'grid', placeItems: 'center' }}>•••</button>
            <button style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '18px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', display: 'grid', placeItems: 'center' }} onClick={() => navigate('/workouts/today')}>✕</button>
          </div>

          <div className="flex-detail__meta">
            <div className="flex-detail__meta-row">
              <span>🔄 Schedule & Repeat</span>
              <span style={{ color: '#0a84ff', marginLeft: 'auto' }}>Set up schedule & repeat {'>'}</span>
            </div>
            <div className="flex-detail__meta-row">
              <span>⏱ 59 min</span>
              <span>🔥 382 cal</span>
            </div>
            <div className="flex-detail__meta-row">
              <span>🧍 Abs • Back • Legs</span>
            </div>
            <div className="flex-detail__meta-row">
              <span>🏋️ Barbell • Machines • Other</span>
            </div>
          </div>

          <div className="flex-exercise-list">
            {LEG_DAY_EXERCISES.map((ex) => (
              <div key={ex.name} className="flex-exercise-row" onClick={() => navigate('/workout')}>
                <div className="flex-exercise-row__icon">{ex.icon}</div>
                <div className="flex-exercise-row__main">
                  <div className="flex-exercise-row__name">{ex.name}</div>
                  <div className="flex-exercise-row__sets">{ex.sets} {'>'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-detail__actions">
            <button className="flex-icon-btn" style={{ width: '48px', height: '48px', borderRadius: '24px' }}>✏️</button>
            <button className="flex-start-btn" onClick={() => navigate('/workout')}>
              ▶ Start
            </button>
            <button className="flex-icon-btn" style={{ width: '48px', height: '48px', borderRadius: '24px' }}>↗</button>
          </div>
        </div>
      </div>
    </div>
  )
}
