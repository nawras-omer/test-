import { useMemo, useState, type FormEvent } from 'react'
import { Field } from '@/components/ui/Field'
import { TargetIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { errorKey, fieldMessages, messageFor } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import type { ApiErrorCode, UserGoals } from '@/types'

type GoalField = keyof UserGoals

const FIELDS: { field: GoalField; labelKey: 'settings.goals.calories' | 'settings.goals.protein' | 'settings.goals.carbs' | 'settings.goals.fat'; unit: 'common.kcal' | 'common.g'; min: number; max: number }[] = [
  { field: 'calories', labelKey: 'settings.goals.calories', unit: 'common.kcal', min: 800, max: 20000 },
  { field: 'protein', labelKey: 'settings.goals.protein', unit: 'common.g', min: 0, max: 2000 },
  { field: 'carbs', labelKey: 'settings.goals.carbs', unit: 'common.g', min: 0, max: 2000 },
  { field: 'fat', labelKey: 'settings.goals.fat', unit: 'common.g', min: 0, max: 2000 },
]

function validate(values: Record<GoalField, string>): Record<string, ApiErrorCode> {
  const errors: Record<string, ApiErrorCode> = {}
  for (const { field, min, max } of FIELDS) {
    const raw = values[field].trim()
    if (!raw) errors[field] = 'GOAL_REQUIRED'
    else {
      const value = Number(raw)
      if (!Number.isFinite(value)) errors[field] = 'GOAL_INVALID'
      else if (value < min || value > max) errors[field] = 'GOAL_RANGE'
    }
  }
  return errors
}

/** Daily calorie + macro targets the dashboard measures against. */
export function GoalsCard() {
  const { t, locale } = useI18n()
  const { user, updateGoals } = useAuth()

  const initial = useMemo(() => {
    const goals = user?.goals
    return {
      calories: String(goals?.calories ?? ''),
      protein: String(goals?.protein ?? ''),
      carbs: String(goals?.carbs ?? ''),
      fat: String(goals?.fat ?? ''),
    } as Record<GoalField, string>
  }, [user?.goals])

  const [values, setValues] = useState<Record<GoalField, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const dirty = FIELDS.some(({ field }) => values[field] !== initial[field])

  function reset() {
    setValues(initial)
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const localErrors = validate(values)
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(localErrors)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSaving(true)
    try {
      await updateGoals({
        calories: Number(values.calories),
        protein: Number(values.protein),
        carbs: Number(values.carbs),
        fat: Number(values.fat),
      })
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card card--pad">
      <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="stat__icon stat__icon--accent" aria-hidden="true">
          <TargetIcon size={19} />
        </span>
        <div>
          <h2 className="card__title">{t('settings.goals.title')}</h2>
          <p className="card__subtitle">{t('settings.goals.body')}</p>
        </div>
      </div>

      <form className="stack" style={{ gap: 'var(--space-4)' }} onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p className="field__error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="food-form__grid">
          {FIELDS.map(({ field, labelKey, unit, min, max }) => (
            <Field
              key={field}
              label={t(labelKey)}
              name={`goal-${field}`}
              type="number"
              inputMode="decimal"
              min={min}
              max={max}
              step={field === 'calories' ? 1 : 0.1}
              value={values[field]}
              error={errors[field]}
              suffix={<span className="input-suffix">{t(unit)}</span>}
              onChange={(event) => setValues((previous) => ({ ...previous, [field]: event.target.value }))}
            />
          ))}
        </div>

        <p className="field__hint">{t('settings.goals.hint')}</p>

        <div className="row" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={reset} disabled={!dirty || saving}>
            {t('actions.cancel')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={!dirty || saving}>
            {saving ? <span className="btn__spinner" /> : null}
            {t('settings.goals.save')}
          </button>
        </div>

        <p className="field__hint numeric">
          {t('settings.goals.calories')}: {formatNumber(user?.goals?.calories ?? 0, locale)} {t('common.kcal')} ·{' '}
          {t('settings.goals.protein')}: {formatNumber(user?.goals?.protein ?? 0, locale)} {t('common.g')}
        </p>
      </form>
    </section>
  )
}
