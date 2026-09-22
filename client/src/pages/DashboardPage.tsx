import { TodaySummaryCard } from '@/components/dashboard/TodaySummaryCard'
import { MealBreakdownCard } from '@/components/dashboard/MealBreakdownCard'
import { StatCards } from '@/components/dashboard/StatCards'
import { PlusIcon } from '@/components/ui/Icons'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import { useAuth } from '@/lib/auth'
import { useEntries } from '@/lib/entries'
import { greetingKey } from '@/lib/utils'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

export function DashboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { openFoodLog } = useFoodLog()
  const { todayTotals, goals, status } = useEntries()

  const firstName = (user?.name ?? '').split(' ')[0]
  const showEmptyState = status === 'ready' && todayTotals.count === 0

  // Mock steps like MyNetDiary screenshot
  const steps = 187
  const exerciseCal = 0
  const water = 0

  const remaining = goals.calories - todayTotals.calories

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('dashboard.eyebrow')}</p>
          <h1 className="page__title">{t(greetingKey(), { name: firstName })}</h1>
          <p className="page__subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </header>

      <SectionSubNav section="calories" />

      {/* MyNetDiary style dashboard */}
      <div className="mnd-page">
        <div className="mnd-container">
          <div className="mnd-dashboard__header">
            <button className="mnd-header__btn">☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', borderRadius: '20px', padding: '6px 14px', border: '1px solid #e5e5ea' }}>
              <span style={{ color: '#ff6d00' }}>🔥</span> <span style={{ fontWeight: 700 }}>0</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '18px' }}>Dashboard</div>
            <button style={{ background: '#ff6d00', color: '#fff', borderRadius: '16px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, border: 'none' }}>Go Premium</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '16px 0 8px' }}>
            <button style={{ width: '36px', height: '36px', borderRadius: '18px', background: '#fff', border: '1px solid #e5e5ea', display: 'grid', placeItems: 'center' }}>{'<'}</button>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, border: '1px solid #e5e5ea' }}>
              📅 Today
            </div>
            <button style={{ width: '36px', height: '36px', borderRadius: '18px', background: '#fff', border: '1px solid #e5e5ea', display: 'grid', placeItems: 'center' }}>{'>'}</button>
          </div>

          <div className="mnd-budget-grid">
            <div className="mnd-budget-side">
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Exercise</div>
                <div className="mnd-budget-item__value">{exerciseCal}</div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Steps</div>
                <div className="mnd-budget-item__value">{steps} <span style={{ fontSize: '12px' }}>👣</span></div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Water</div>
                <div className="mnd-budget-item__value">{water} <span style={{ fontSize: '14px' }}>💧</span></div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Notes</div>
                <div className="mnd-budget-item__value" style={{ fontSize: '16px' }}>📎</div>
              </div>
            </div>

            <div className="mnd-budget-center">
              <div className="mnd-budget-center__budget">Calorie Budget</div>
              <div className="mnd-budget-center__value">{goals.calories.toLocaleString()}</div>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '12px auto' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path d="M 50 10 A 40 40 0 1 1 49.9 10" fill="none" stroke="#e5e5ea" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#00c853" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(todayTotals.calories / goals.calories) * 251} 251`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#00c853' }}>{todayTotals.calories}</div>
                    <div style={{ fontSize: '14px', color: '#8e8e93' }}>{remaining} <br /> left</div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '16px' }}>🍎</div>
              </div>
              <div style={{ color: '#00c853', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => openFoodLog()}>View All Meals</div>
            </div>

            <div className="mnd-budget-side">
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Breakfast</div>
                <div className="mnd-budget-item__value">0</div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Lunch</div>
                <div className="mnd-budget-item__value">0</div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Dinner</div>
                <div className="mnd-budget-item__value">0</div>
              </div>
              <div className="mnd-budget-item">
                <div className="mnd-budget-item__label">Snacks</div>
                <div className="mnd-budget-item__value">0</div>
              </div>
            </div>
          </div>

          <div className="mnd-macros-bar">
            <div className="mnd-macro-item">
              <div className="mnd-macro-item__head"><span>T. Carbs</span><span>0%</span></div>
              <div className="mnd-macro-item__bar"><div className="mnd-macro-item__fill" style={{ width: '0%' }} /></div>
              <div className="mnd-macro-item__foot"><span className="mnd-macro-item__grams">0g</span><span>left 220g</span></div>
            </div>
            <div className="mnd-macro-item">
              <div className="mnd-macro-item__head"><span>Protein</span><span>0%</span></div>
              <div className="mnd-macro-item__bar"><div className="mnd-macro-item__fill" style={{ width: '0%' }} /></div>
              <div className="mnd-macro-item__foot"><span className="mnd-macro-item__grams">0g</span><span>left 98g</span></div>
            </div>
            <div className="mnd-macro-item">
              <div className="mnd-macro-item__head"><span>Fat</span><span>0%</span></div>
              <div className="mnd-macro-item__bar"><div className="mnd-macro-item__fill" style={{ width: '0%' }} /></div>
              <div className="mnd-macro-item__foot"><span className="mnd-macro-item__grams">0g</span><span>left 76g</span></div>
            </div>
          </div>

          {/* Keep existing detailed cards below for functionality */}
          <div style={{ padding: '0 16px', display: 'grid', gap: '16px' }}>
            {showEmptyState ? (
              <section className="card card--pad empty-hero">
                <div>
                  <h2 className="empty-state__title">{t('dashboard.empty.title')}</h2>
                  <p className="empty-state__body">{t('dashboard.empty.body')}</p>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => openFoodLog()}>
                  <PlusIcon size={18} />
                  {t('dashboard.empty.cta')}
                </button>
              </section>
            ) : null}

            <TodaySummaryCard />
            <MealBreakdownCard />
            <StatCards />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="fab"
        onClick={() => openFoodLog()}
        aria-label={t('actions.logFood')}
      >
        <PlusIcon size={22} />
        <span>{t('actions.logFood')}</span>
      </button>
    </div>
  )
}
