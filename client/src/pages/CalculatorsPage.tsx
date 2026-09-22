/**
 * Calculators — MyNetDiary style
 * BMI, BMR, TDEE using profile weight/height/age/sex.
 */
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
}

function bmiCategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}

export function CalculatorsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const profile = user?.profile ?? null

  const calc = useMemo(() => {
    if (!profile) return null
    const weight = profile.weightKg
    const height = profile.heightCm
    const { age, sex, activity } = profile
    if (!weight || !height) return { bmi: null, bmr: null, tdee: null as number | null, hM: 0 }

    const hM = height / 100
    const bmi = weight / (hM * hM)

    let bmr: number | null = null
    if (weight && height && age && sex) {
      const base = 10 * weight + 6.25 * height - 5 * age
      bmr = sex === 'male' ? base + 5 : base - 161
    }

    let tdee: number | null = null
    if (bmr && activity) {
      const factor = ACTIVITY_FACTOR[activity] ?? 1.2
      tdee = Math.round(bmr * factor)
    }

    return { bmi: Math.round(bmi * 10) / 10, bmr: bmr ? Math.round(bmr) : null, tdee, hM }
  }, [profile])

  const bmiAngle = useMemo(() => {
    if (!calc?.bmi) return 45
    return Math.min(Math.max(((calc.bmi - 10) / 25) * 180, 0), 180)
  }, [calc])

  return (
    <div className="mnd-page">
      <div className="mnd-container">
        <div className="mnd-header">
          <button className="mnd-header__btn">☰</button>
          <span className="mnd-header__title">Calculators</span>
          <div style={{ width: '40px' }} />
        </div>

        <SectionSubNav section="ai" />

        {!profile || !calc?.bmi ? (
          <div className="mnd-card" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: '#8e8e93' }}>{t('goals.suggest.incomplete')}</p>
            <p style={{ fontSize: '12px', color: '#aeaeb2', marginTop: '8px' }}>{t('goals.profile.hint')}</p>
          </div>
        ) : (
          <>
            {/* BMI Card with gauge */}
            <div className="mnd-card mnd-card--padded" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#e3f2fd', display: 'grid', placeItems: 'center' }}>⚖️</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('calculators.bmi.title')}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '200px', height: '110px' }}>
                  <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="bmiGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2962ff" />
                        <stop offset="50%" stopColor="#00c853" />
                        <stop offset="100%" stopColor="#ff3d00" />
                      </linearGradient>
                    </defs>
                    <path d="M 10 100 A 90 90 0 0 1 200 100" fill="none" stroke="#e5e5ea" strokeWidth="16" />
                    <path d="M 10 100 A 90 90 0 0 1 70 20" fill="none" stroke="#2962ff" strokeWidth="16" />
                    <path d="M 70 20 A 90 90 0 0 1 130 20" fill="none" stroke="#00c853" strokeWidth="16" />
                    <path d="M 130 20 A 90 90 0 0 1 200 100" fill="none" stroke="#ff3d00" strokeWidth="16" />
                    <g transform={`rotate(${bmiAngle - 90} 100 100)`}>
                      <line x1="100" y1="100" x2="100" y2="25" stroke="#1c1c1e" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="5" fill="#1c1c1e" />
                    </g>
                  </svg>
                  <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>{calc.bmi}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: calc.bmi < 18.5 ? '#2962ff' : calc.bmi < 25 ? '#00c853' : '#ff3d00' }}>
                      {t(`calculators.bmi.${bmiCategory(calc.bmi)}` as never)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: '#8e8e93' }}>
                  <span>🔵 Underweight &lt;18.5</span>
                  <span>🟢 Healthy 18.5-24.9</span>
                  <span>🔴 High 25+</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '12px', background: '#f5f7f5', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#8e8e93' }}>Weight</span>
                <strong>{profile.weightKg} kg</strong>
              </div>
              <div style={{ marginTop: '8px', padding: '12px', background: '#f5f7f5', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#8e8e93' }}>Height</span>
                <strong>{profile.heightCm} cm</strong>
              </div>
            </div>

            {/* BMR / TDEE */}
            <div className="mnd-card mnd-card--padded" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fff3e0', display: 'grid', placeItems: 'center' }}>🔥</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('calculators.bmr.title')}</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '16px' }}>{t('calculators.bmr.subtitle')}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f5f7f5', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>BMR</div>
                  <div style={{ fontSize: '22px', fontWeight: 800 }}>{calc.bmr ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>kcal / day</div>
                </div>
                <div style={{ background: '#e8f5e9', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '4px' }}>TDEE</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#00c853' }}>{calc.tdee ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: '#2e7d32' }}>with activity</div>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '12px', background: '#fff', border: '1px solid #e5e5ea', borderRadius: '12px', fontSize: '12px', color: '#8e8e93' }}>
                Formula: Mifflin-St Jeor · 10×weight + 6.25×height - 5×age {profile.sex === 'male' ? '+5' : '-161'} · ×{ACTIVITY_FACTOR[profile.activity ?? 'sedentary'] ?? 1.2} for {profile.activity}
              </div>
            </div>

            {/* Targets */}
            <div className="mnd-card mnd-card--padded">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{t('calculators.targets.title')}</h3>
              <p style={{ fontSize: '13px', color: '#8e8e93', lineHeight: '1.5' }}>{t('goals.suggest.body')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
