/**
 * Workout Session - FLEX dark logging style
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ExercisePickerModal } from '@/components/workouts/ExercisePickerModal'
import { RestTimer } from '@/components/workouts/RestTimer'
import { SessionSummary } from '@/components/workouts/SessionSummary'
import { StartSessionPanel } from '@/components/workouts/StartSessionPanel'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatDecimal, formatNumber } from '@/lib/format'
import { usePlan } from '@/lib/plan/PlanProvider'
import {
  addExercise,
  addSet,
  clockFormat,
  exerciseStatus,
  manualSession,
  nextExerciseIndex,
  restSecondsFor,
  sessionFromPlanDay,
  sessionIsEmpty,
  formatSetSummary,
  sessionProgress,
  toggleSet,
  totalDoneSets,
  totalPlannedSets,
  updateSet,
} from '@/lib/workoutLog'
import { useWorkoutLog } from '@/lib/workoutLogProvider'
import type { WorkoutSession } from '@/types'
import { useI18n } from '@/i18n'

interface Rest {
  key: string
  seconds: number
  label: string
}

export function WorkoutSessionPage() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { push } = useToast()
  const { plan, nameFor } = usePlan()
  const { status, active, start, update, finish, remove, syncError, saveState, lastPerformance } = useWorkoutLog()
  const [searchParams] = useSearchParams()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const sessionRef = useRef<WorkoutSession | null>(null)
  const [finished, setFinished] = useState<WorkoutSession | null>(null)
  const [rest, setRest] = useState<Rest | null>(null)
  const [current, setCurrent] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [busy, setBusy] = useState(false)
  const [startError, setStartError] = useState(false)
  const [tick, setTick] = useState(() => Date.now())

  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  const adopt = useCallback((next: WorkoutSession | null) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  const apply = useCallback(
    (change: (current: WorkoutSession) => WorkoutSession) => {
      const cur = sessionRef.current
      if (!cur) return null
      const next = change(cur)
      sessionRef.current = next
      setSession(next)
      update(next)
      return next
    },
    [update],
  )

  useEffect(() => {
    if (session || !active) return
    adopt(active)
    setCurrent(nextExerciseIndex(active, 0))
  }, [active, adopt, session])

  const sessionId = session?.id ?? null
  const sessionOpen = session?.status === 'active'
  useEffect(() => {
    if (!sessionOpen) return
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [sessionOpen, sessionId])

  const elapsed = useMemo(() => {
    if (!session) return 0
    const started = Date.parse(session.startedAt)
    const end = session.finishedAt ? Date.parse(session.finishedAt) : tick
    return Math.max(0, Math.round((end - started) / 1000))
  }, [session, tick])

  const fmtNumber = (value: number) => formatNumber(value, locale)
  const fmtDecimal = (value: number) => formatDecimal(value, locale)
  const setFormatter = { t, n: fmtDecimal }

  const begin = useCallback(
    async (fresh: WorkoutSession) => {
      setBusy(true)
      setStartError(false)
      const stored = await start(fresh)
      setBusy(false)
      if (!stored) {
        setStartError(true)
        return
      }
      setFinished(null)
      adopt(stored)
      setCurrent(nextExerciseIndex(stored, 0))
      push(t('workouts.session.started'), 'success')
    },
    [push, start, t, adopt],
  )

  const startDay = useCallback(
    (dayIndex: number) => {
      if (!plan) return
      const fresh = sessionFromPlanDay(plan, dayIndex)
      if (!fresh) return
      void begin(fresh)
    },
    [begin, plan],
  )

  const startManual = useCallback(() => {
    void begin(manualSession(new Date()))
  }, [begin])

  const autoStarted = useRef(false)
  useEffect(() => {
    if (autoStarted.current) return
    if (searchParams.get('start') !== 'manual') return
    if (status !== 'ready' || active) return
    autoStarted.current = true
    startManual()
    navigate('/workout', { replace: true })
  }, [active, navigate, searchParams, startManual, status])

  const toggle = (exerciseIndex: number, setIndex: number) => {
    const wasDone = sessionRef.current?.exercises[exerciseIndex]?.sets[setIndex]?.done ?? false
    const next = apply((cur) => toggleSet(cur, exerciseIndex, setIndex))
    if (!next) return
    const exercise = next.exercises[exerciseIndex]
    if (!exercise) return
    if (!wasDone) {
      setRest({
        key: `${exerciseIndex}-${setIndex}-${Date.now()}`,
        seconds: restSecondsFor(next, exerciseIndex),
        label: nameFor(exercise.exerciseId, locale),
      })
      if (exerciseStatus(exercise) === 'done') {
        const following = nextExerciseIndex(next, exerciseIndex + 1)
        if (following > exerciseIndex) setCurrent(following)
      }
    } else {
      setRest(null)
    }
  }

  const jumpTo = (index: number) => {
    setCurrent(index)
    itemRefs.current[index]?.scrollIntoView?.({ block: 'nearest' })
  }

  const closeSession = async () => {
    if (!session) return
    setBusy(true)
    const stored = await finish(session)
    setBusy(false)
    setRest(null)
    if (!stored) return
    setFinished(stored)
    adopt(null)
    push(t('workouts.summary.saved'), 'success')
  }

  const confirmRemove = async () => {
    if (!session) return
    const id = session.id
    setConfirmDiscard(false)
    setRest(null)
    adopt(null)
    await remove(id)
    navigate('/workouts')
  }

  const doneSets = session ? totalDoneSets(session) : 0
  const plannedSets = session ? totalPlannedSets(session) : 0
  const progress = session ? sessionProgress(session) : 0
  const allDone = session ? session.exercises.every((ex) => ex.sets.every((s) => s.done)) : false
  const sessionTitle = session
    ? session.titleKey
      ? t(`plan.dayTitle.${session.titleKey}`)
      : session.name || t('workouts.history.manual')
    : ''

  if (finished) {
    return (
      <div className="page">
        <SessionSummary session={finished} onDone={() => navigate('/workouts')} onViewHistory={() => navigate('/history')} />
      </div>
    )
  }

  if (!session) {
    if (status === 'loading') {
      return <p className="field__hint">{t('common.loading')}</p>
    }
    return (
      <div className="page">
        <StartSessionPanel busy={busy} error={startError} onStartDay={startDay} onStartManual={startManual} />
      </div>
    )
  }

  return (
    <div className="page" data-testid="workout-session-page" style={{ background: '#0a0a0a', minHeight: '100vh', margin: '-24px -16px', padding: '0' }}>
      <div className="flex-theme" style={{ margin: 0, borderRadius: 0 }}>
        <div className="flex-page" style={{ maxWidth: '600px' }}>
          <div className="flex-log__header">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="flex-icon-btn" onClick={() => navigate('/workouts/today')}>✕</button>
              <button className="flex-icon-btn">⌄</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '10px', background: '#0a2a1a', display: 'grid', placeItems: 'center' }}>⏸</span>
                {clockFormat(elapsed)}
              </div>
              <button className="flex-icon-btn">💬</button>
            </div>
          </div>

          <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#2a2a4a', display: 'grid', placeItems: 'center', fontSize: '20px' }}>🏋️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {sessionTitle || 'Leg Day'} <span style={{ fontSize: '14px', opacity: 0.5 }}>✎</span>
              </div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>Set up schedule & repeat {'>'}</div>
            </div>
          </div>

          <div style={{ background: '#1c1c1e', borderRadius: '12px', padding: '3px', marginBottom: '16px' }}>
            <div style={{ height: '6px', borderRadius: '6px', background: 'linear-gradient(90deg, #0a84ff, #30d158)', width: `${Math.round(progress * 100)}%` }} />
          </div>

          {syncError && <p style={{ color: '#ff3b30', fontSize: '12px', marginBottom: '12px' }}>{t('errors.NETWORK_ERROR')}</p>}

          {rest && (
            <RestTimer
              restKey={rest.key}
              seconds={rest.seconds}
              label={rest.label}
              onElapsed={() => {
                push(t('workouts.rest.done'), 'default')
                setRest(null)
              }}
              onSkip={() => setRest(null)}
            />
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {session.exercises.map((exercise, exIndex) => {
              const previous = lastPerformance(exercise.exerciseId, session.id)
              const isCurrent = exIndex === current
              const exName = nameFor(exercise.exerciseId, locale)
              const isExDone = exerciseStatus(exercise) === 'done'

              return (
                <div
                  key={`${exercise.exerciseId}-${exIndex}`}
                  ref={(node) => {
                    itemRefs.current[exIndex] = node
                  }}
                  className="flex-log__exercise"
                  style={{ border: isCurrent ? '1px solid #0a84ff' : '1px solid transparent' }}
                >
                  <div className="flex-log__exercise-head" onClick={() => setCurrent(exIndex)}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fff', display: 'grid', placeItems: 'center', color: '#000', fontSize: '20px' }}>🏋️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{exName}</div>
                      <div style={{ fontSize: '12px', color: '#8e8e93' }}>4 back/ 11-2</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'transparent', border: 'none', color: '#8e8e93' }}>•••</button>
                      <button style={{ background: 'transparent', border: 'none', color: '#8e8e93' }}>⌄</button>
                    </div>
                  </div>

                  <div className="flex-log__table-head">
                    <span>PREVIOUS</span>
                    <span>WEIGHT</span>
                    <span>REP</span>
                    <span></span>
                  </div>

                  {exercise.sets.map((set, setIndex) => {
                    const isW = setIndex < 2
                    return (
                      <div key={setIndex} className="flex-log__set-row">
                        <div className="flex-log__prev">
                          {isW && <span className="flex-log__prev-badge">W</span>}
                          <span style={{ fontSize: '12px' }}>
                            {previous ? formatSetSummary(previous, setFormatter) : setIndex === 0 ? '13.5 kg × 10' : '22.5 kg × 10'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            value={set.weightKg}
                            onChange={(e) => apply((cur) => updateSet(cur, exIndex, setIndex, { weightKg: Number(e.target.value) }))}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontSize: '18px',
                              fontWeight: 600,
                              width: '60px',
                              textAlign: 'left',
                            }}
                          />
                          <span style={{ fontSize: '12px', color: '#8e8e93' }}>kg</span>
                        </div>
                        <div className="flex-log__rep">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => apply((cur) => updateSet(cur, exIndex, setIndex, { reps: Number(e.target.value) }))}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              fontSize: '18px',
                              fontWeight: 600,
                              width: '40px',
                              textAlign: 'center',
                            }}
                          />
                        </div>
                        <div className={`flex-log__check ${set.done ? 'flex-log__check--done' : ''}`} onClick={() => toggle(exIndex, setIndex)}>
                          ✓
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex-log__actions">
                    <button className="flex-log__btn" onClick={() => apply((cur) => addSet(cur, exIndex))}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '9px', border: '1px solid #636366', display: 'grid', placeItems: 'center' }}>+</span> Add Set
                    </button>
                    <button className="flex-log__btn">↻ Super Set</button>
                    <button className="flex-log__btn" style={{ marginLeft: 'auto' }}>✓✓</button>
                  </div>

                  {isExDone && (
                    <div style={{ padding: '8px 16px', fontSize: '12px', color: '#30d158', textAlign: 'center' }}>
                      ✓ Exercise completed
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingBottom: '24px' }}>
            <button
              className="flex-icon-btn"
              style={{ width: 'auto', padding: '0 20px', borderRadius: '20px' }}
              onClick={() => setPickerOpen(true)}
            >
              + Exercise
            </button>
            <button
              style={{
                flex: 1,
                background: allDone ? '#30d158' : '#2c2c2e',
                color: allDone ? '#fff' : '#8e8e93',
                borderRadius: '20px',
                padding: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
              disabled={busy || sessionIsEmpty(session)}
              onClick={() => void closeSession()}
            >
              Finish Workout • {fmtNumber(doneSets)}/{fmtNumber(plannedSets)} • {fmtDecimal(session.totals.volumeKg)} kg
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              style={{ background: 'transparent', border: '1px solid #2c2c2e', color: '#8e8e93', borderRadius: '16px', padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setConfirmDiscard(true)}
            >
              Discard
            </button>
            <Link to="/workouts" style={{ background: 'transparent', border: '1px solid #2c2c2e', color: '#8e8e93', borderRadius: '16px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none' }}>
              Back
            </Link>
          </div>

          {saveState === 'saving' && <div style={{ textAlign: 'center', color: '#8e8e93', fontSize: '12px' }}>Saving...</div>}
        </div>
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(exerciseId) => {
          const next = apply((cur) => addExercise(cur, exerciseId))
          if (next) jumpTo(next.exercises.length - 1)
        }}
      />

      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title={t('workouts.session.discard')}
        eyebrow={t('workouts.session.title')}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmDiscard(false)}>
              {t('workouts.session.cancel')}
            </button>
            <button type="button" className="btn btn--danger" onClick={() => void confirmRemove()}>
              {t('workouts.session.discard')}
            </button>
          </>
        }
      >
        <p>{t('workouts.session.discard.title')}</p>
      </Modal>
    </div>
  )
}
