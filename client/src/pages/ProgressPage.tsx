/**
 * Progress — FLEX Stats style
 */
import { useEffect, useState } from 'react'
import { workoutsApi } from '@/lib/api'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'
import type { WorkoutSession } from '@/types'

const EXERCISES = [
  { name: 'Bench Press', weight: '45 kg', up: true },
  { name: 'Cable Crunch', weight: '54 kg', up: true },
  { name: 'Cable Curl', weight: '6.67 kg', up: true },
  { name: 'Cable Lateral Raise', weight: '3.5 kg', up: true },
  { name: 'Cable Rear Delt Fly', weight: '8 kg', up: false },
  { name: 'Cable Tricep Kickback', weight: '14.67 kg', up: false },
  { name: 'Chest-Supported Seated Row', weight: '54.67 kg', up: true },
  { name: 'Close-Grip EZ-Bar Curl', weight: '26.67 kg', up: false },
  { name: 'Assisted Chin-Up', weight: '26.98 kg', up: false },
  { name: 'Assisted Dip', weight: '26.98 kg', up: false },
  { name: 'Barbell Squat', weight: '60 kg', up: true },
]

export function ProgressPage() {
  const { t } = useI18n()
  const [sessions, setSessions] = useState<WorkoutSession[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    workoutsApi
      .list({ limit: 200 }, controller.signal)
      .then((result) => setSessions(result.workouts))
      .catch(() => setSessions([]))
    return () => controller.abort()
  }, [])

  return (
    <div className="page" data-testid="progress-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('progress.eyebrow')}</p>
          <h1 className="page__title">{t('pages.progress.title')}</h1>
          <p className="page__subtitle">{t('pages.progress.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="workout" />

      <div className="flex-theme">
        <div className="flex-page">
          <div className="flex-header">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="flex-icon-btn" style={{ width: 'auto', padding: '0 16px', borderRadius: '20px', fontSize: '14px' }}>Edit</button>
              <h1>Stats</h1>
            </div>
            <div className="flex-header__actions">
              <button className="flex-icon-btn">😊</button>
            </div>
          </div>

          <div className="flex-stats-grid">
            <div className="flex-stat-card">
              <div className="flex-stat-card__top">
                <span className="flex-stat-card__label">Streak</span>
                <span className="flex-stat-card__icon" style={{ background: '#0a2a1a', color: '#30d158' }}>↗</span>
              </div>
              <div>
                <div className="flex-stat-card__value">0 days</div>
                <div className="flex-stat-card__sub">🌐 Below Average</div>
              </div>
            </div>
            <div className="flex-stat-card">
              <div className="flex-stat-card__top">
                <span className="flex-stat-card__label">Steps</span>
                <span className="flex-stat-card__icon" style={{ background: '#2a1a1a', color: '#ff3b30' }}>🚶</span>
              </div>
              <div>
                <div className="flex-stat-card__value">187</div>
                <div className="flex-stat-card__sub">🌐 Below Average</div>
              </div>
            </div>
            <div className="flex-stat-card">
              <div className="flex-stat-card__top">
                <span className="flex-stat-card__label">Calories</span>
                <span className="flex-stat-card__icon" style={{ color: '#ff3b30' }}>🔥</span>
              </div>
              <div>
                <div className="flex-stat-card__bar"><span>9 cal</span></div>
                <div className="flex-stat-card__value" style={{ fontSize: '20px', marginTop: '12px' }}>1,810 cal</div>
              </div>
            </div>
            <div className="flex-stat-card">
              <div className="flex-stat-card__top">
                <span className="flex-stat-card__label">Body Weight</span>
                <span className="flex-stat-card__icon" style={{ color: '#0a84ff' }}>🧍</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flex-stat-card__value" style={{ fontSize: '20px' }}>76 kg</div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '14px', background: 'var(--flex-card-2)', display: 'grid', placeItems: 'center' }}>+</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-workout-week">
            <div className="flex-workout-week__head">
              <div>
                <div style={{ fontWeight: 700 }}>0 hr</div>
                <div style={{ fontSize: '12px', color: '#8e8e93' }}>Workout This Week</div>
              </div>
              <div className="flex-workout-week__bars">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`flex-workout-week__bar ${i === 9 || i === 10 ? 'flex-workout-week__bar--active' : ''}`} style={{ height: `${4 + Math.random() * 12}px` }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--flex-card)', borderRadius: '20px', overflow: 'hidden' }}>
            {EXERCISES.map((ex) => (
              <div key={ex.name} className="flex-exercise-row" style={{ borderBottom: '1px solid var(--flex-card-2)' }}>
                <div className="flex-exercise-row__icon">🏋️</div>
                <div className="flex-exercise-row__main">
                  <div className="flex-exercise-row__name" style={{ fontSize: '14px' }}>{ex.name}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {ex.weight} {ex.up ? '↑' : '—'}
                </div>
              </div>
            ))}
          </div>

          {sessions && sessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#8e8e93', fontSize: '13px' }}>
              No workouts yet — start your first session
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
