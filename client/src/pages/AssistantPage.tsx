/**
 * AI & Information / Diet Tools - MyNetDiary style
 */
import { ChatPanel } from '@/components/assistant/ChatPanel'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'
import { useNavigate } from 'react-router-dom'

export function AssistantPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('assistant.eyebrow')}</p>
          <h1 className="page__title">{t('assistant.title')}</h1>
          <p className="page__subtitle">{t('assistant.status.note')}</p>
        </div>
      </header>

      <SectionSubNav section="ai" />

      <div className="mnd-page">
        <div className="mnd-container" style={{ padding: 0 }}>
          <div style={{ background: '#00c853', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
            <button className="mnd-header__btn" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>☰</button>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>Diet Tools</div>
            <button style={{ background: '#ff6d00', color: '#fff', borderRadius: '16px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, border: 'none' }}>Go Premium</button>
          </div>

          <div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
            <div className="mnd-settings-group">
              <div className="mnd-settings-row" onClick={() => navigate('/ai/calculators')}>
                <div className="mnd-settings-row__icon" style={{ background: '#fff3e0' }}>🔥</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">My Diet</div>
                  <div className="mnd-settings-row__sub">Find a diet that fits your lifestyle</div>
                </div>
                <button style={{ background: '#2e7d32', color: '#fff', borderRadius: '16px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, border: 'none' }}>Select</button>
              </div>
            </div>

            <div className="mnd-settings-group">
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#fff3e0' }}>👨‍🍳</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Premium Recipes & Meals</div>
                  <div className="mnd-settings-row__sub">Crafted by our Registered Dietitians</div>
                </div>
              </div>
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#fff3e0' }}>🏠</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Premium Menus</div>
                  <div className="mnd-settings-row__sub">Nutritious meal ideas from our dietitians</div>
                </div>
              </div>
              <div className="mnd-settings-row" onClick={() => navigate('/ai/meal-planner')}>
                <div className="mnd-settings-row__icon" style={{ background: '#fff3e0' }}>📅</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Meal Planner</div>
                  <div className="mnd-settings-row__sub">Plan your week's meals in advance</div>
                </div>
              </div>
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#f3e5f5' }}>🤖</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Restaurant Menu AI Scan</div>
                  <div className="mnd-settings-row__sub">Personalized dish recommendations</div>
                </div>
              </div>
            </div>

            <div className="mnd-settings-group">
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#e8f5e9' }}>⏱</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Intermittent Fasting</div>
                  <div className="mnd-settings-row__sub">Enable fasting timer and configure fasting tools</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #2a2a2a, #4a4a4a)', borderRadius: '16px', padding: '16px', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: '120px' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>Keto & Low-Carb</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#a5d6a7' }}>DIETS</div>
                <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>LEARN MORE {'>'}</div>
              </div>
              <div style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '48px' }}>🥩</div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>My Diet Trends</h3>
            <div className="mnd-settings-group">
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#e3f2fd' }}>📊</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__sub" style={{ fontSize: '13px' }}>Your weight-loss journey explained with insights from your diary</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Analysis & Insights</h3>
            <div className="mnd-settings-group">
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#e0f7fa' }}>✨</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">AI Coach</div>
                  <div className="mnd-settings-row__sub">A personal coach that knows your diet, helps you daily, and keeps you on track</div>
                </div>
              </div>
              <div className="mnd-settings-row" onClick={() => navigate('/ai/calculators')}>
                <div className="mnd-settings-row__icon" style={{ background: '#e1f5fe' }}>🔬</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Analysis: Weight Plan review needed. Please update target date.</div>
                </div>
              </div>
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#f3e5f5' }}>🍇</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Nutrient Analysis</div>
                  <div className="mnd-settings-row__sub">In-depth analysis: top meals, foods, goals, and statistics</div>
                </div>
              </div>
              <div className="mnd-settings-row" onClick={() => navigate('/calories/charts')}>
                <div className="mnd-settings-row__icon" style={{ background: '#e1f5fe' }}>📊</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Charts</div>
                </div>
              </div>
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#e1f5fe' }}>📄</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Reports & Summary Emails</div>
                </div>
              </div>
              <div className="mnd-settings-row">
                <div className="mnd-settings-row__icon" style={{ background: '#e1f5fe' }}>📅</div>
                <div className="mnd-settings-row__main">
                  <div className="mnd-settings-row__title">Weekly Averages</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Learning</h3>
            <div className="mnd-settings-group">
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#e8f5e9' }}>▲</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">App Guide</div></div></div>
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#e8f5e9' }}>📝</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">Dietitian Blog</div></div></div>
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#e8f5e9' }}>📚</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">Diet Library</div></div></div>
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#fff9c4' }}>📖</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">Advice Library</div></div></div>
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#e8f5e9' }}>▶</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">How-to Videos</div></div></div>
              <div className="mnd-settings-row"><div className="mnd-settings-row__icon" style={{ background: '#fff9c4' }}>💡</div><div className="mnd-settings-row__main"><div className="mnd-settings-row__title">Tips & Tricks</div></div></div>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', padding: '16px', border: '1px solid #e5e5ea', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <ChatPanel variant="page" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
