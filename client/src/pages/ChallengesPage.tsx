import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

const CHALLENGES = [
  { name: 'Power Push', progress: 100, current: '74 kg / 74 kg', xp: 200, icon: '🏋️' },
  { name: 'Starter Squat', progress: 89, current: '60 kg / 67 kg', xp: 100, icon: '🦵' },
  { name: 'Popular Kid', progress: 0, current: '0/5', xp: 500, icon: '🚩' },
  { name: 'Fitness Ally', progress: 0, current: '0/5', xp: 350, icon: '⭐' },
  { name: 'Perfect Week', progress: 0, current: '0/7', xp: 350, icon: '📅' },
]

const ACHIEVEMENTS = [
  { name: '7 DAYS', icon: '🔥' },
  { name: 'Streak 7', icon: '🔥' },
  { name: 'Grow', icon: '🌱' },
]

export function ChallengesPage() {
  const { t } = useI18n()

  return (
    <div className="page" data-testid="challenges-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('challenges.eyebrow')}</p>
          <h1 className="page__title">{t('challenges.title')}</h1>
          <p className="page__subtitle">{t('challenges.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="workout" />

      <div className="flex-theme">
        <div className="flex-page">
          <div className="flex-header">
            <h1>Challenges</h1>
            <div className="flex-header__actions">
              <button className="flex-icon-btn">😊</button>
            </div>
          </div>

          <div className="flex-challenges__header">
            <div className="flex-challenges__level">
              <div className="flex-challenges__level-ring">12</div>
              <div className="flex-challenges__xp">7,149</div>
              <span style={{ color: '#8e8e93' }}>✳</span>
            </div>
            <div className="flex-challenges__lv">Lv 12</div>
          </div>

          <div className="flex-challenge-cards">
            <div className="flex-challenge-card">
              <div className="flex-challenge-card__xp">200 ✳</div>
              <div className="flex-challenge-card__icon">🔥</div>
              <div style={{ fontWeight: 700, marginTop: '12px' }}>Weekly Wonder</div>
              <div style={{ height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '8px' }}>
                <div style={{ width: '0%', height: '100%', background: '#000', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>0/4</div>
            </div>
            <div className="flex-challenge-card" style={{ background: '#fff3e0' }}>
              <div className="flex-challenge-card__icon" style={{ background: '#000' }}>📷</div>
              <div style={{ fontWeight: 700, marginTop: '12px' }}>Picture Perfect</div>
            </div>
          </div>

          <div className="flex-challenge-list">
            {CHALLENGES.map((c) => (
              <div key={c.name} className="flex-challenge-row">
                <div className="flex-challenge-row__icon">{c.icon}</div>
                <div className="flex-challenge-row__main">
                  <div className="flex-challenge-row__name">{c.name}</div>
                  <div className="flex-challenge-row__bar">
                    <div className="flex-challenge-row__bar-fill" style={{ width: `${c.progress}%` }} />
                  </div>
                  <div className="flex-challenge-row__meta">{c.current}</div>
                </div>
                <div className="flex-challenge-row__xp">{c.xp} ✳</div>
              </div>
            ))}
            <div style={{ textAlign: 'center', padding: '12px', color: '#636366', fontSize: '13px' }}>View more...</div>
          </div>

          <div className="flex-section-title">
            <span>Achievements</span>
            <span style={{ fontSize: '13px', color: '#8e8e93' }}>See All {'>'}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {ACHIEVEMENTS.map((a) => (
              <div key={a.name} style={{ minWidth: '80px', height: '80px', background: 'var(--flex-card)', borderRadius: '16px', display: 'grid', placeItems: 'center', fontSize: '28px', border: '2px solid #ff9f0a' }}>
                {a.icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
