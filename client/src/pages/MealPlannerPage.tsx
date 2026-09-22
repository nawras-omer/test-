/**
 * Meal Planner — MyNetDiary style
 * Macro-aware placeholder respecting remaining budget.
 */
import { useEntries } from '@/lib/entries'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: '🌅', time: '8:00 AM', kcal: 0 },
  { id: 'lunch', label: 'Lunch', icon: '☀️', time: '1:00 PM', kcal: 0 },
  { id: 'dinner', label: 'Dinner', icon: '🌙', time: '7:00 PM', kcal: 0 },
  { id: 'snack', label: 'Snacks', icon: '🍎', time: '4:00 PM', kcal: 0 },
]

export function MealPlannerPage() {
  const { t } = useI18n()
  const { todayTotals, goals } = useEntries()
  const { user } = useAuth()

  const goal = user?.goals?.calories ?? goals.calories ?? 2000
  const remaining = Math.max(0, goal - todayTotals.calories)
  const proteinLeft = Math.max(0, goals.protein - todayTotals.protein)

  return (
    <div className="mnd-page">
      <div className="mnd-container">
        <div className="mnd-header">
          <button className="mnd-header__btn">☰</button>
          <span className="mnd-header__title">Meal Planner</span>
          <button style={{ background: '#ff6d00', color: '#fff', borderRadius: '16px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, border: 'none' }}>Go Premium</button>
        </div>

        <SectionSubNav section="ai" />

        <div className="mnd-card mnd-card--padded" style={{ marginBottom: '16px', background: '#e8f5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>Remaining Budget</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#1b5e20' }}>{remaining} kcal</div>
              <div style={{ fontSize: '12px', color: '#388e3c' }}>{proteinLeft.toFixed(0)}g protein left · {goal} kcal goal</div>
            </div>
            <div style={{ width: '56px', height: '56px', borderRadius: '28px', background: '#fff', display: 'grid', placeItems: 'center', fontSize: '28px' }}>🍽️</div>
          </div>
          <div style={{ marginTop: '12px', height: '8px', background: '#c8e6c9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (todayTotals.calories / goal) * 100)}%`, height: '100%', background: '#00c853', borderRadius: '4px' }} />
          </div>
        </div>

        <div className="mnd-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Today's Plan</h3>
            <span style={{ fontSize: '12px', color: '#00c853', fontWeight: 600 }}>AI Generated</span>
          </div>
          {MEALS.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f7f5', display: 'grid', placeItems: 'center', fontSize: '18px' }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.label}</div>
                <div style={{ fontSize: '11px', color: '#8e8e93' }}>{m.time} · {m.kcal} kcal planned</div>
              </div>
              <button style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#00c853', color: '#fff', border: 'none', fontSize: '18px', fontWeight: 700 }}>+</button>
            </div>
          ))}
        </div>

        <div className="mnd-card mnd-card--padded" style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>How it works</h3>
          <p style={{ fontSize: '12px', color: '#8e8e93', lineHeight: '1.6' }}>
            {t('mealPlanner.subtitle')} — This planner respects your remaining {remaining} kcal and {proteinLeft.toFixed(0)}g protein target. Premium meal generation with recipes is coming soon.
          </p>
          <button type="button" style={{ marginTop: '12px', width: '100%', padding: '14px', borderRadius: '24px', background: '#1c1c1e', color: '#fff', border: 'none', fontWeight: 700 }}>
            {t('mealPlanner.generate')}
          </button>
        </div>
      </div>
    </div>
  )
}
