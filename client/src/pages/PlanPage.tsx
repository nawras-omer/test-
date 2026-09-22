/**
 * Workout Planner — MyNetDiary style wrapper around plan builder
 */
import { useMemo, useState } from 'react'
import { SwapExerciseModal } from '@/components/plan/SwapExerciseModal'
import { BoltIcon, CheckIcon, PlusIcon, SparkleIcon, TargetIcon, TrashIcon } from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import { EQUIPMENT } from '@/data/exercises'
import { useI18n, type TranslationKey } from '@/i18n'
import { SectionSubNav } from '@/components/layout/SectionSubNav'
import { usePlan } from '@/lib/plan/PlanProvider'
import {
  DEFAULT_QUESTIONNAIRE,
  PLAN_EXPERIENCES,
  PLAN_GOALS,
  PLAN_LIMITATIONS,
  PLAN_MAX_DAYS,
  PLAN_MIN_DAYS,
  dayForDate,
  estimateMinutes,
  formatDose,
  formatRest,
  planExerciseDetail,
  planNotes,
  summarisePlan,
  type PlanDay,
  type PlanExperience,
  type PlanGoal,
  type PlanItemRef,
  type PlanLimitation,
  type PlanQuestionnaire,
} from '@/lib/plan'
import { TOTAL_EXERCISES } from '@/data/exercises'
import { addDays } from '@/lib/food'
import { formatDate, formatNumber } from '@/lib/format'
import { weekStart } from '@/lib/workouts'

const GOAL_KEYS: Record<PlanGoal, TranslationKey> = {
  muscleGain: 'plan.goal.muscleGain',
  fatLoss: 'plan.goal.fatLoss',
  strength: 'plan.goal.strength',
  endurance: 'plan.goal.endurance',
}
const EXPERIENCE_KEYS: Record<PlanExperience, TranslationKey> = {
  beginner: 'plan.experience.beginner',
  intermediate: 'plan.experience.intermediate',
  advanced: 'plan.experience.advanced',
}
const LIMITATION_KEYS: Record<PlanLimitation, TranslationKey> = {
  knee: 'plan.limitation.knee',
  lowerBack: 'plan.limitation.lowerBack',
  shoulder: 'plan.limitation.shoulder',
  wrist: 'plan.limitation.wrist',
  ankle: 'plan.limitation.ankle',
  neck: 'plan.limitation.neck',
}
const DAY_OPTIONS = Array.from({ length: PLAN_MAX_DAYS - PLAN_MIN_DAYS + 1 }, (_, i) => PLAN_MIN_DAYS + i)

export function PlanPage() {
  const { t, locale } = useI18n()
  const { push } = useToast()
  const { plan, generating, saving, syncError, generate, regenerate, swap, remove } = usePlan()

  const [answers, setAnswers] = useState<PlanQuestionnaire>(DEFAULT_QUESTIONNAIRE)
  const [editing, setEditing] = useState(false)
  const [swapTarget, setSwapTarget] = useState<{ ref: PlanItemRef; name: string } | null>(null)

  const showForm = !plan || editing
  const number = (v: number) => formatNumber(v, locale)

  const weekdayName = useMemo(() => {
    const start = weekStart(new Date(), locale)
    return (weekday: number) => {
      const offset = (weekday - start.getDay() + 7) % 7
      return formatDate(addDays(start, offset), locale, { weekday: 'long' })
    }
  }, [locale])

  const summary = useMemo(() => (plan ? summarisePlan(plan) : null), [plan])
  const today = useMemo(() => {
    if (!plan) return null
    const current = dayForDate(plan)
    return current ? { index: current.index, day: current.day } : null
  }, [plan])

  function toggleEquipment(item: (typeof EQUIPMENT)[number]) {
    setAnswers((p) => ({
      ...p,
      equipment: p.equipment.includes(item) ? p.equipment.filter((e) => e !== item) : [...p.equipment, item],
    }))
  }
  function toggleLimitation(item: PlanLimitation) {
    setAnswers((p) => ({
      ...p,
      limitations: p.limitations.includes(item) ? p.limitations.filter((e) => e !== item) : [...p.limitations, item],
    }))
  }
  async function handleGenerate() {
    const gen = await generate(answers)
    setEditing(false)
    push(t('plan.toast.generated', { sessions: number(gen.days.length) }), 'success')
  }
  async function handleRegenerate() {
    const next = await regenerate()
    if (next) push(t('plan.toast.regenerated'), 'success')
  }
  async function handleSwap(exerciseId: string, name: string) {
    const from = swapTarget?.name ?? ''
    const ref = swapTarget?.ref
    setSwapTarget(null)
    if (!ref) return
    await swap(ref, exerciseId)
    push(t('plan.toast.swapped', { from, to: name }), 'success')
  }
  async function handleRemove() {
    await remove()
    setEditing(false)
    setAnswers(DEFAULT_QUESTIONNAIRE)
    push(t('plan.toast.removed'), 'success')
  }
  function startEditing() {
    setAnswers(plan ? plan.questionnaire : DEFAULT_QUESTIONNAIRE)
    setEditing(true)
  }

  return (
    <div className="mnd-page">
      <div className="mnd-container">
        <div className="mnd-header">
          <button className="mnd-header__btn">☰</button>
          <span className="mnd-header__title">Workout Planner</span>
          <button style={{ background: '#ff6d00', color: '#fff', borderRadius: '16px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, border: 'none' }}>Go Premium</button>
        </div>

        <SectionSubNav section="ai" />

        {plan && !editing ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--outline" onClick={startEditing}> {t('plan.edit')} </button>
            <button type="button" className="btn btn--outline" onClick={handleRegenerate} disabled={generating || saving}><SparkleIcon size={17} /> {t('plan.regenerate')}</button>
            <button type="button" className="btn btn--ghost btn--danger-text" onClick={handleRemove}><TrashIcon size={17} /> {t('plan.delete')}</button>
          </div>
        ) : null}

        {showForm ? (
          <section className="mnd-card mnd-card--padded" data-testid="plan-form">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#e3f2fd', display: 'grid', placeItems: 'center' }}><BoltIcon size={19} /></span>
              <div><h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('plan.form.title')}</h2><p style={{ fontSize: '12px', color: '#8e8e93' }}>{t('plan.form.subtitle')}</p></div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{t('plan.q.goal')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PLAN_GOALS.map((g) => (
                    <button key={g} type="button" className={`category-chip${answers.goal === g ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, goal: g }))}>{t(GOAL_KEYS[g])}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{t('plan.q.experience')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PLAN_EXPERIENCES.map((e) => (
                    <button key={e} type="button" className={`category-chip${answers.experience === e ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, experience: e }))}>{t(EXPERIENCE_KEYS[e])}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{t('plan.q.days')}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {DAY_OPTIONS.map((d) => (
                    <button key={d} type="button" className={`category-chip${answers.daysPerWeek === d ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, daysPerWeek: d }))}>{number(d)}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{t('plan.q.equipment')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" className={`category-chip${answers.equipment.length === EQUIPMENT.length ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, equipment: [...EQUIPMENT] }))}>{t('plan.equipment.everything')}</button>
                  <button type="button" className={`category-chip${answers.equipment.length === 1 && answers.equipment[0] === 'bodyweight' ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, equipment: ['bodyweight'] }))}>{t('plan.equipment.bodyweightOnly')}</button>
                  {EQUIPMENT.map((item) => (
                    <button key={item} type="button" className={`category-chip${answers.equipment.includes(item) ? ' category-chip--active' : ''}`} onClick={() => toggleEquipment(item)}>{t(`exercises.equipment.${item}`)}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>{t('plan.q.limitations')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" className={`category-chip${answers.limitations.length === 0 ? ' category-chip--active' : ''}`} onClick={() => setAnswers((p) => ({ ...p, limitations: [] }))}>{t('plan.limitation.none')}</button>
                  {PLAN_LIMITATIONS.map((lim) => (
                    <button key={lim} type="button" className={`category-chip${answers.limitations.includes(lim) ? ' category-chip--active' : ''}`} onClick={() => toggleLimitation(lim)}>{t(LIMITATION_KEYS[lim])}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="button" className="btn btn--primary btn--lg" onClick={handleGenerate} disabled={generating} style={{ background: '#00c853', borderColor: '#00c853' }}>{generating ? <span className="btn__spinner" /> : <SparkleIcon size={19} />} {generating ? t('plan.generating') : t('plan.generate')}</button>
              {editing && plan ? <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>{t('actions.cancel')}</button> : null}
              <span style={{ fontSize: '11px', color: '#8e8e93' }}>{t('plan.form.hint')}</span>
            </div>
          </section>
        ) : null}

        {plan && summary && !editing ? (
          <>
            <section className="mnd-card mnd-card--padded" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#e8f5e9', display: 'grid', placeItems: 'center' }}><TargetIcon size={19} /></span>
                  <div><h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('plan.summary.title')}</h2><p style={{ fontSize: '12px', color: '#8e8e93' }}>{t('plan.summary.goal', { goal: t(GOAL_KEYS[plan.questionnaire.goal]) })}</p></div>
                </div>
                <span className="badge badge--brand">{t('plan.source.badge')}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span className="chip chip--ai">{t('plan.summary.sessions', { count: number(summary.sessions) })}</span>
                <span className="chip chip--local">{t('plan.summary.exercises', { count: number(summary.exercises) })}</span>
                <span className="chip chip--local">{t('plan.summary.minutes', { minutes: number(summary.minutesPerSession) })}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                {planNotes(plan.questionnaire).map((key) => (
                  <li key={key} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#3a3a3c' }}><CheckIcon size={15} /> <span>{t(key)}</span></li>
                ))}
              </ul>
              <p style={{ fontSize: '11px', color: '#8e8e93', marginTop: '12px' }}>{t('plan.source.note', { count: number(TOTAL_EXERCISES) })}</p>
              {syncError ? <p style={{ color: '#ff3d00', fontSize: '12px' }}>{t('plan.sync.offline')}</p> : null}
            </section>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('plan.week.title')}</h2>
                <span style={{ fontSize: '12px', background: '#fff', border: '1px solid #e5e5ea', borderRadius: '12px', padding: '4px 10px' }}>{t('plan.days.value', { count: number(summary.sessions) })}</span>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {plan.days.map((day, dayIndex) => (
                  <PlanDayCard key={`${day.weekday}-${day.title}`} day={day} dayIndex={dayIndex} isToday={today?.index === dayIndex} weekday={weekdayName(day.weekday)} onSwap={(ref, name) => setSwapTarget({ ref, name })} />
                ))}
              </div>
            </section>
          </>
        ) : null}

        <SwapExerciseModal open={swapTarget !== null} onClose={() => setSwapTarget(null)} target={swapTarget} onPick={handleSwap} />
      </div>
    </div>
  )
}

interface PlanDayCardProps {
  day: PlanDay
  dayIndex: number
  isToday: boolean
  weekday: string
  onSwap: (ref: PlanItemRef, name: string) => void
}

function PlanDayCard({ day, dayIndex, isToday, weekday, onSwap }: PlanDayCardProps) {
  const { t, locale } = useI18n()
  const { nameFor } = usePlan()
  const number = (v: number) => formatNumber(v, locale)
  const formatter = { t, n: number }

  return (
    <article className={`mnd-card mnd-card--padded${isToday ? ' ' : ''}`} style={{ borderLeft: isToday ? '4px solid #00c853' : '1px solid #e5e5ea' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#8e8e93', margin: 0 }}>{weekday}</p>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0' }}>{t(`plan.dayTitle.${day.title}`)}</h3>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isToday ? <span className="badge badge--brand">{t('plan.today')}</span> : null}
          <span style={{ fontSize: '11px', background: '#f5f7f5', borderRadius: '10px', padding: '4px 8px' }}>{t('workouts.today.minutes', { minutes: number(estimateMinutes(day)) })}</span>
        </div>
      </header>

      {day.blocks.map((block, blockIndex) => (
        <div key={`${block.kind}-${blockIndex}`} style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', marginBottom: '8px' }}>{t(`plan.block.${block.kind}`)}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
            {block.items.map((item, itemIndex) => {
              const name = nameFor(item.exerciseId, locale)
              const detail = planExerciseDetail(item.exerciseId)
              return (
                <li key={`${item.exerciseId}-${itemIndex}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f5f7f5', borderRadius: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{name}</span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {detail ? (
                        <>
                          <span style={{ fontSize: '10px', background: '#fff', border: '1px solid #e5e5ea', borderRadius: '8px', padding: '2px 6px' }}>{t(`exercises.muscle.${detail.muscle}`)}</span>
                          <span style={{ fontSize: '10px', background: '#fff', border: '1px solid #e5e5ea', borderRadius: '8px', padding: '2px 6px' }}>{t(`exercises.equipment.${detail.equipment}`)}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', padding: '2px 6px' }}>{t('exercises.custom.badge')}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8e8e93', marginTop: '4px' }}>{formatDose(item, formatter)} · {formatRest(item, formatter)}</div>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onSwap({ dayIndex, blockIndex, itemIndex }, name)} style={{ width: '32px', height: '32px', borderRadius: '16px', background: '#fff' }}><PlusIcon size={15} /></button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </article>
  )
}
