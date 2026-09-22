import { useI18n } from '@/i18n'
import { useState } from 'react'

export function CommunityPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('Home')

  const tabs = ['Home', 'Groups', 'Friends', 'Chats', 'Favorites', 'Ask RD']

  return (
    <div className="page" data-testid="community-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('community.eyebrow')}</p>
          <h1 className="page__title">{t('community.title')}</h1>
          <p className="page__subtitle">{t('community.subtitle')}</p>
        </div>
      </header>

      <div className="mnd-page">
        <div className="mnd-container" style={{ padding: 0 }}>
          <div style={{ background: '#00c853', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>Community</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>🔔</span>
              <span>•••</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '12px 16px', background: '#00c853' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? '#00c853' : '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #e5e5ea' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: '#f2f2f7', display: 'grid', placeItems: 'center' }}>👤</div>
            <div style={{ flex: 1, background: '#f2f2f7', borderRadius: '20px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '14px' }}>
              ✎ How is your journey?
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#e5e5ea', overflow: 'hidden' }}>👨</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Keith in Tennessee</span>
                  <span style={{ color: '#ff9f0a' }}>★</span>
                  <span style={{ fontSize: '12px', color: '#8e8e93' }}>• 2d ago</span>
                  <span style={{ marginLeft: 'auto', color: '#8e8e93' }}>•••</span>
                </div>
                <div style={{ fontSize: '12px', color: '#8e8e93' }}>Started a healthy lifestyle in August 2025</div>
              </div>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '12px' }}>
              My fitness journey has inspired me to build a website to help others. Check it out! SeniorSwitch.life
              <br /><br />
              Also, I'm pursuing NASM certification... <span style={{ color: '#00c853', cursor: 'pointer' }}>See more</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ position: 'relative', aspectRatio: '1', background: '#f2f2f7' }}>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: '#fff', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>280.0 lb<br /><span style={{ fontSize: '12px', fontWeight: 400 }}>Aug 17, 2025</span></div>
              </div>
              <div style={{ position: 'relative', aspectRatio: '1', background: '#f2f2f7' }}>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: '#fff', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>162.8 lb<br /><span style={{ fontSize: '12px', fontWeight: 400 }}>Sep 20</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🍏</span>
              <span style={{ fontWeight: 700, color: '#00c853', fontSize: '18px' }}>MyNetDiary</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', padding: '8px 0', borderTop: '1px solid #f2f2f7' }}>
              <button style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>👍 108</button>
              <button style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>💬 13</button>
              <button style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginLeft: 'auto', cursor: 'pointer' }}>↗</button>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px', textAlign: 'center', color: '#8e8e93', fontSize: '13px' }}>
            {t('community.comingSoon')} — {activeTab} feed coming soon
          </div>
        </div>
      </div>
    </div>
  )
}
