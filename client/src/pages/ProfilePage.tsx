import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'
import { useEntries } from '@/lib/entries'

function BMIGauge({ bmi }: { bmi: number }) {
  const angle = Math.min(Math.max((bmi - 10) / 25 * 180, 0), 180)
  return (
    <div className="mnd-bmi-gauge">
      <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%' }}>
        <path d="M 10 100 A 90 90 0 0 1 50 25" fill="none" stroke="#2962ff" strokeWidth="18" strokeLinecap="round" />
        <path d="M 50 25 A 90 90 0 0 1 150 25" fill="none" stroke="#00c853" strokeWidth="18" strokeLinecap="round" />
        <path d="M 150 25 A 90 90 0 0 1 190 100" fill="none" stroke="#ff3d00" strokeWidth="18" strokeLinecap="round" />
        <g transform={`rotate(${angle - 90} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="20" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill="#fff" stroke="#000" strokeWidth="2" />
        </g>
      </svg>
    </div>
  )
}

export function ProfilePage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { mode, toggleMode } = useTheme()
  const { goals } = useEntries()

  const [weightHistory] = useState([
    { date: '29/06', weight: 77 },
    { date: '26/07', weight: 76 },
  ])

  const bmi = useMemo(() => {
    const w = user?.profile?.weightKg ?? 76
    const h = user?.profile?.heightCm ?? 175
    if (!w || !h) return 24.8
    return w / ((h / 100) * (h / 100))
  }, [user])

  const weight = user?.profile?.weightKg ?? 76
  const height = user?.profile?.heightCm ?? 175
  const age = user?.profile?.age ?? 24

  if (!user) return null

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('nav.profile')}</p>
          <h1 className="page__title">{t('pages.profile.title')}</h1>
          <p className="page__subtitle">{t('pages.profile.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="me" />

      <div className="mnd-page">
        <div className="mnd-container">
          <div className="mnd-header">
            <button className="mnd-header__btn">☰</button>
            <h1>Profile</h1>
            <button className="mnd-header__btn" onClick={toggleMode}>{mode === 'dark' ? '☀️' : '🌙'}</button>
          </div>

          <div className="mnd-avatar-wrap">
            <div className="mnd-avatar">
              👨
              <div className="mnd-avatar__edit">✎</div>
            </div>
            <div className="mnd-avatar__name">{user.name?.split(' ')[0] || 'Nawras'}</div>
          </div>

          <div className="mnd-stats-row">
            <div className="mnd-stats-row__item">
              <div className="mnd-stats-row__value">{weight}</div>
              <div className="mnd-stats-row__label">kg</div>
            </div>
            <div className="mnd-stats-row__item">
              <div className="mnd-stats-row__value">{height}</div>
              <div className="mnd-stats-row__label">cm</div>
            </div>
            <div className="mnd-stats-row__item">
              <div className="mnd-stats-row__value">{age}</div>
              <div className="mnd-stats-row__label">y/o</div>
            </div>
          </div>

          <div className="mnd-section-head">
            <h2>Daily Nutrition Goals</h2>
            <span style={{ color: '#00c853' }}>✎</span>
          </div>

          <div className="mnd-goals-grid">
            <div className="mnd-goal-card">
              <div className="mnd-goal-card__top">
                <div className="mnd-goal-card__icon" style={{ background: '#fff3e0' }}>🔥</div>
                <span className="mnd-goal-card__label">Calories</span>
              </div>
              <div className="mnd-goal-card__value">{goals.calories}</div>
              <div className="mnd-goal-card__unit">kcal</div>
            </div>
            <div className="mnd-goal-card">
              <div className="mnd-goal-card__top">
                <div className="mnd-goal-card__icon" style={{ background: '#ffebee' }}>🎯</div>
                <span className="mnd-goal-card__label">Protein</span>
              </div>
              <div className="mnd-goal-card__value">{goals.protein}</div>
              <div className="mnd-goal-card__unit">g</div>
            </div>
            <div className="mnd-goal-card">
              <div className="mnd-goal-card__top">
                <div className="mnd-goal-card__icon" style={{ background: '#f3e5f5' }}>📈</div>
                <span className="mnd-goal-card__label">Carbs</span>
              </div>
              <div className="mnd-goal-card__value">{goals.carbs}</div>
              <div className="mnd-goal-card__unit">g</div>
            </div>
            <div className="mnd-goal-card">
              <div className="mnd-goal-card__top">
                <div className="mnd-goal-card__icon" style={{ background: '#e3f2fd' }}>↗</div>
                <span className="mnd-goal-card__label">Fat</span>
              </div>
              <div className="mnd-goal-card__value">{goals.fat}</div>
              <div className="mnd-goal-card__unit">g</div>
            </div>
          </div>

          <button className="mnd-analysis-btn">
            Analysis
            <span className="mnd-analysis-btn__new">New</span>
          </button>

          <div className="mnd-section-head">
            <h2>Weight Progress</h2>
            <span style={{ background: '#e8f5e9', color: '#00c853', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>-1.0 kg</span>
          </div>

          <div className="mnd-weight-card">
            <div className="mnd-weight-current">
              <div className="mnd-weight-current__left">
                <div className="mnd-weight-current__label">Current Weight <span style={{ background: '#e8f5e9', color: '#00c853', padding: '2px 6px', borderRadius: '8px', fontSize: '11px' }}>~1.0</span></div>
                <div className="mnd-weight-current__value">76 <span>kg</span></div>
              </div>
              <div className="mnd-weight-current__right">
                <div style={{ fontSize: '12px', color: '#8e8e93' }}>Entries</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>2</div>
              </div>
            </div>

            <div className="mnd-weight-chart">
              <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100%' }}>
                <line x1="0" y1="20" x2="300" y2="20" stroke="#e5e5ea" strokeDasharray="4 4" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e5ea" strokeDasharray="4 4" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e5ea" strokeDasharray="4 4" />
                <path d="M 30 20 L 270 80" fill="none" stroke="#00c853" strokeWidth="3" strokeLinecap="round" />
                <path d="M 30 20 L 270 80 L 270 100 L 30 100 Z" fill="url(#grad)" opacity="0.2" />
                <circle cx="30" cy="20" r="6" fill="#fff" stroke="#00c853" strokeWidth="2" />
                <circle cx="270" cy="80" r="6" fill="#fff" stroke="#00c853" strokeWidth="2" />
                <g>
                  <rect x="15" y="0" width="30" height="18" rx="9" fill="#000" />
                  <text x="30" y="12" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">77</text>
                </g>
                <g>
                  <rect x="255" y="60" width="30" height="18" rx="9" fill="#000" />
                  <text x="270" y="72" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">76</text>
                </g>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00c853" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00c853" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8e8e93', marginTop: '4px' }}>
                <span>{weightHistory[0].date}</span>
                <span>{weightHistory[1].date}</span>
              </div>
            </div>

            <div className="mnd-weight-btns">
              <button className="mnd-btn-light">↻ View All History</button>
              <button className="mnd-btn-dark">⚖️ Log Weight</button>
            </div>
          </div>

          <div className="mnd-bmi-card">
            <div className="mnd-section-head" style={{ marginTop: 0 }}>
              <h2>Your BMI</h2>
              <span style={{ background: '#e8f5e9', color: '#00c853', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Healthy</span>
            </div>
            <BMIGauge bmi={bmi} />
            <div className="mnd-bmi-value">{bmi.toFixed(1)}</div>
            <div className="mnd-bmi-labels">
              <span><span className="mnd-bmi-dot" style={{ background: '#2962ff' }}></span> Underweight<br />{'<'} 18.5</span>
              <span><span className="mnd-bmi-dot" style={{ background: '#00c853' }}></span> Healthy<br />18.5-24.9</span>
              <span><span className="mnd-bmi-dot" style={{ background: '#ff3d00' }}></span> High<br />25+</span>
            </div>
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '20px 0 12px' }}>Activity Streak</h2>
          <div className="mnd-streak-card">
            <div className="mnd-streak-item">
              <div className="mnd-streak-item__label">🔥 Current</div>
              <div className="mnd-streak-item__value">0 <span>day</span></div>
            </div>
            <div className="mnd-streak-item">
              <div className="mnd-streak-item__label">🏆 Best</div>
              <div className="mnd-streak-item__value">6 <span>day</span></div>
            </div>
            <div className="mnd-streak-item">
              <div className="mnd-streak-item__label">🎯 Logged</div>
              <div className="mnd-streak-item__value">0%</div>
            </div>
          </div>

          <div className="mnd-calendar">
            <div className="mnd-calendar__head">
              <button className="mnd-calendar__nav">{'<'}</button>
              <div className="mnd-calendar__title">September 2026</div>
              <button className="mnd-calendar__nav">{'>'}</button>
            </div>
            <div className="mnd-calendar__weekdays">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="mnd-calendar__days">
              <span className="mnd-calendar__day mnd-calendar__day--empty"></span>
              <span className="mnd-calendar__day mnd-calendar__day--empty"></span>
              <span className="mnd-calendar__day">1</span><span className="mnd-calendar__day">2</span><span className="mnd-calendar__day">3</span><span className="mnd-calendar__day">4</span><span className="mnd-calendar__day">5</span>
              <span className="mnd-calendar__day">6</span><span className="mnd-calendar__day">7</span><span className="mnd-calendar__day">8</span><span className="mnd-calendar__day">9</span><span className="mnd-calendar__day">10</span><span className="mnd-calendar__day">11</span><span className="mnd-calendar__day">12</span>
              <span className="mnd-calendar__day">13</span><span className="mnd-calendar__day">14</span><span className="mnd-calendar__day">15</span><span className="mnd-calendar__day">16</span><span className="mnd-calendar__day">17</span><span className="mnd-calendar__day">18</span><span className="mnd-calendar__day">19</span>
              <span className="mnd-calendar__day">20</span><span className="mnd-calendar__day">21</span><span className="mnd-calendar__day mnd-calendar__day--today">22</span><span className="mnd-calendar__day">23</span><span className="mnd-calendar__day">24</span><span className="mnd-calendar__day">25</span><span className="mnd-calendar__day">26</span>
              <span className="mnd-calendar__day">27</span><span className="mnd-calendar__day">28</span><span className="mnd-calendar__day">29</span><span className="mnd-calendar__day">30</span>
            </div>
          </div>

          <div className="mnd-settings-group">
            <div className="mnd-settings-row">
              <div className="mnd-settings-row__icon" style={{ background: '#f5f5f5' }}>👤</div>
              <div className="mnd-settings-row__main">
                <div className="mnd-settings-row__title">Personal Info</div>
              </div>
              <div className="mnd-settings-row__arrow">{'>'}</div>
            </div>
            <div className="mnd-settings-row">
              <div className="mnd-settings-row__icon" style={{ background: '#f5f5f5' }}>↻</div>
              <div className="mnd-settings-row__main">
                <div className="mnd-settings-row__title">View Weight History</div>
              </div>
              <div className="mnd-settings-row__arrow">{'>'}</div>
            </div>
            <div className="mnd-settings-row">
              <div className="mnd-settings-row__icon" style={{ background: '#f5f5f5' }}>🌙</div>
              <div className="mnd-settings-row__main">
                <div className="mnd-settings-row__title">Dark Mode</div>
              </div>
              <button className="mnd-header__btn" onClick={toggleMode} style={{ width: '48px' }}>{mode === 'dark' ? '🌙' : '☀️'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
