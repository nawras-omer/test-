/**
 * Workout Today - FLEX style redesign
 * Matches FLEX app: calendar, Start Workout, My Collection, Explore
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

// navigate kept for collection clicks

const COLLECTION = [
  { id: 'cardio', name: 'Cardio', time: '32 min', color: '#4a90a4', image: '🏃' },
  { id: 'legday', name: 'Leg Day', time: '59 min', color: '#2a2a4a', image: '🦵' },
  { id: 'pullday', name: 'Pull Day', time: '1 hour', color: '#4a3a2a', image: '💪' },
  { id: 'pushday', name: 'Push Day', time: '44 min', color: '#3a4a2a', image: '🏋️' },
]

const EXPLORE = [
  { id: 'routine', name: 'Routine for You', icon: '✨', color: '#2a2a4a' },
  { id: 'muscle', name: 'Build Muscle', icon: '🔥', color: '#4a2a2a' },
]

export function WorkoutsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [selectedDay] = useState(22)

  const days = Array.from({ length: 35 }, (_, i) => {
    const d = 29 + i
    return d > 31 ? d - 31 : d
  })

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

      <div className="flex-theme">
        <div className="flex-page">
          {/* Header */}
          <div className="flex-header">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="flex-icon-btn" style={{ width: 'auto', padding: '0 16px', borderRadius: '20px', fontSize: '14px' }}>Edit</button>
              <h1>Workout</h1>
            </div>
            <div className="flex-header__actions">
              <button className="flex-icon-btn">😊</button>
              <button className="flex-icon-btn">🔍</button>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-calendar">
            <div className="flex-calendar__top">
              <div className="flex-calendar__streak">
                <span style={{ width: '28px', height: '28px', borderRadius: '14px', background: '#0a2a1a', display: 'grid', placeItems: 'center', color: '#30d158' }}>↗</span>
                <span>0 days</span>
              </div>
              <div className="flex-calendar__xp">
                <span style={{ width: '28px', height: '28px', borderRadius: '14px', border: '3px solid #ff9f0a', display: 'grid', placeItems: 'center', color: '#ff9f0a', fontSize: '12px', fontWeight: 800 }}>12</span>
                <span>7.1K</span>
                <span style={{ marginLeft: 'auto' }}>⌄</span>
              </div>
            </div>
            <div className="flex-calendar__grid">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`flex-calendar__day ${d === selectedDay ? 'flex-calendar__day--today' : ''} ${d < 10 ? 'flex-calendar__day--active' : ''}`}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* My Collection */}
          <div className="flex-section-title">
            <span>🗂️ My Collection</span>
            <span style={{ fontSize: '14px', color: '#8e8e93' }}>••• ⌄</span>
          </div>
          <div className="flex-collection-grid">
            {COLLECTION.map((item) => (
              <div
                key={item.id}
                className="flex-collection-card"
                onClick={() => navigate('/workouts/list')}
                style={{ background: item.color }}
              >
                <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '48px' }}>{item.image}</div>
                <div className="flex-collection-card__overlay">
                  <div className="flex-collection-card__title">{item.name}</div>
                  <div className="flex-collection-card__sub">{item.time}</div>
                </div>
                <div className="flex-collection-card__play">▶</div>
              </div>
            ))}
          </div>

          {/* Explore */}
          <div className="flex-section-title">
            <span>Explore</span>
            <span style={{ fontSize: '14px', color: '#0a84ff' }}>See All {'>'}</span>
          </div>
          <div className="flex-explore-grid">
            {EXPLORE.map((item) => (
              <div key={item.id} className="flex-explore-card" style={{ background: item.color }}>
                <div className="flex-explore-card__icon">{item.icon}</div>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                {item.id === 'muscle' && (
                  <div className="flex-plus" style={{ position: 'absolute', bottom: '12px', right: '12px' }}>+</div>
                )}
                {item.id === 'routine' && (
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '32px', height: '32px', borderRadius: '10px', background: '#1a1a2a', display: 'grid', placeItems: 'center' }}>⊞</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
