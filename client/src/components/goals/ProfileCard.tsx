/**
 * Editable profile section of the goal-setting page.
 *
 * The numbers here are what the goal calculator uses, so the card also hosts
 * the "calculate from my profile" flow: suggest → show the maths → apply.
 */
import { useMemo, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { BoltIcon, CheckIcon, UserIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { errorKey, fieldMessages, messageFor } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import { GOAL_LIMITS, suggestGoals, type GoalSuggestion } from '@/lib/goals'
import { useToast } from '@/components/ui/Toast'
import { useI18n, type TranslationKey } from '@/i18n'
import { ACTIVITY_LEVELS } from '@/types'
import type { ActivityLevel, ApiErrorCode, ProfileInput, Sex } from '@/types'

type Values = {
  name: string
  sex: string
  age: string
  heightCm: string
  weightKg: string
  targetWeightKg: string
  activity: ActivityLevel
}

function toValues(user: ReturnType<typeof useAuth>['user']): Values {
  return {
    name: user?.name ?? '',
    sex: user?.profile?.sex ?? '',
    age: user?.profile?.age ? String(user.profile.age) : '',
    heightCm: user?.profile?.heightCm ? String(user.profile.heightCm) : '',
    weightKg: user?.profile?.weightKg ? String(user.profile.weightKg) : '',
    targetWeightKg: user?.profile?.targetWeightKg ? String(user.profile.targetWeightKg) : '',
    activity: user?.profile?.activity ?? 'moderate',
  }
}

const SEX_OPTIONS: { value: string; key: TranslationKey }[] = [
  { value: '', key: 'goals.profile.sex.unspecified' },
  { value: 'male', key: 'goals.profile.sex.male' },
  { value: 'female', key: 'goals.profile.sex.female' },
]

export function ProfileCard() {
  const { t, locale } = useI18n()
  const { user, updateProfile, updateGoals } = useAuth()
  const { push } = useToast()

  const initial = useMemo(() => toValues(user), [user])
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [suggestion, setSuggestion] = useState<GoalSuggestion | null>(null)
  /** "Suggest" was pressed but the profile is still missing numbers. */
  const [attempted, setAttempted] = useState(false)

  const dirty = (Object.keys(initial) as (keyof Values)[]).some((key) => values[key] !== initial[key])

  function validate(): Record<string, ApiErrorCode> {
    const found: Record<string, ApiErrorCode> = {}
    if (values.name.trim().length < 2) found.name = 'NAME_TOO_SHORT'

    const numeric: { field: keyof Values; code: ApiErrorCode; min: number; max: number }[] = [
      { field: 'age', code: 'AGE_RANGE', ...GOAL_LIMITS.age },
      { field: 'heightCm', code: 'HEIGHT_RANGE', ...GOAL_LIMITS.heightCm },
      { field: 'weightKg', code: 'WEIGHT_RANGE', ...GOAL_LIMITS.weightKg },
      { field: 'targetWeightKg', code: 'WEIGHT_RANGE', ...GOAL_LIMITS.weightKg },
    ]
    for (const { field, code, min, max } of numeric) {
      const raw = String(values[field]).trim()
      if (!raw) continue
      const value = Number(raw)
      if (!Number.isFinite(value) || value < min || value > max) found[field] = code
    }
    return found
  }

  function buildInput(): ProfileInput {
    const numeric = (raw: string) => (raw.trim() === '' ? null : Number(raw))
    return {
      name: values.name.trim(),
      sex: values.sex === '' ? null : (values.sex as Sex),
      age: numeric(values.age),
      heightCm: numeric(values.heightCm),
      weightKg: numeric(values.weightKg),
      targetWeightKg: numeric(values.targetWeightKg),
      activity: values.activity,
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const local = validate()
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(local)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSaving(true)
    try {
      await updateProfile(buildInput())
      setSuggestion(null)
      push(t('goals.profile.saved'), 'success')
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSaving(false)
    }
  }

  function handleSuggest() {
    setAttempted(true)
    setSuggestion(
      suggestGoals({
        sex: values.sex === '' ? null : (values.sex as Sex),
        age: values.age ? Number(values.age) : null,
        heightCm: values.heightCm ? Number(values.heightCm) : null,
        weightKg: values.weightKg ? Number(values.weightKg) : null,
        targetWeightKg: values.targetWeightKg ? Number(values.targetWeightKg) : null,
        activity: values.activity,
      }),
    )
  }

  async function applySuggestion() {
    if (!suggestion) return
    await updateGoals(suggestion.goals)
    push(t('goals.suggest.applied'), 'success')
    setSuggestion(null)
  }

  return (
    <section className="card card--pad" data-testid="profile-card">
      <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="stat__icon stat__icon--accent" aria-hidden="true">
          <UserIcon size={19} />
        </span>
        <div>
          <h2 className="card__title">{t('goals.profile.title')}</h2>
          <p className="card__subtitle">{t('goals.profile.body')}</p>
        </div>
      </div>

      <form className="stack" style={{ gap: 'var(--space-4)' }} onSubmit={handleSubmit} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}

        <Field
          label={t('goals.profile.name')}
          name="profile-name"
          value={values.name}
          error={errors.name}
          autoComplete="name"
          onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))}
        />

        <div className="food-form__grid">
          <div className="field">
            <label className="field__label" htmlFor="profile-sex">
              {t('goals.profile.sex')}
            </label>
            <select
              id="profile-sex"
              className="select"
              name="profile-sex"
              value={values.sex}
              onChange={(event) => setValues((previous) => ({ ...previous, sex: event.target.value }))}
            >
              {SEX_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value}>
                  {t(option.key)}
                </option>
              ))}
            </select>
            {errors.sex ? <p className="field__error">{errors.sex}</p> : null}
          </div>

          <Field
            label={t('goals.profile.age')}
            name="profile-age"
            type="number"
            inputMode="numeric"
            min={GOAL_LIMITS.age.min}
            max={GOAL_LIMITS.age.max}
            value={values.age}
            error={errors.age}
            suffix={<span className="input-suffix">{t('goals.profile.years')}</span>}
            onChange={(event) => setValues((previous) => ({ ...previous, age: event.target.value }))}
          />

          <Field
            label={t('goals.profile.height')}
            name="profile-height"
            type="number"
            inputMode="decimal"
            min={GOAL_LIMITS.heightCm.min}
            max={GOAL_LIMITS.heightCm.max}
            value={values.heightCm}
            error={errors.heightCm}
            suffix={<span className="input-suffix">{t('goals.profile.cm')}</span>}
            onChange={(event) => setValues((previous) => ({ ...previous, heightCm: event.target.value }))}
          />

          <Field
            label={t('goals.profile.weight')}
            name="profile-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={GOAL_LIMITS.weightKg.min}
            max={GOAL_LIMITS.weightKg.max}
            value={values.weightKg}
            error={errors.weightKg}
            suffix={<span className="input-suffix">{t('goals.profile.kg')}</span>}
            onChange={(event) => setValues((previous) => ({ ...previous, weightKg: event.target.value }))}
          />

          <Field
            label={t('goals.profile.targetWeight')}
            name="profile-target-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={GOAL_LIMITS.weightKg.min}
            max={GOAL_LIMITS.weightKg.max}
            value={values.targetWeightKg}
            error={errors.targetWeightKg}
            suffix={<span className="input-suffix">{t('goals.profile.kg')}</span>}
            onChange={(event) => setValues((previous) => ({ ...previous, targetWeightKg: event.target.value }))}
          />

          <div className="field">
            <label className="field__label" htmlFor="profile-activity">
              {t('goals.profile.activity')}
            </label>
            <select
              id="profile-activity"
              className="select"
              name="profile-activity"
              value={values.activity}
              onChange={(event) =>
                setValues((previous) => ({ ...previous, activity: event.target.value as ActivityLevel }))
              }
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(`goals.activity.${level}` as TranslationKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="field__hint">{t('goals.profile.hint')}</p>

        <div className="row" style={{ gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost" onClick={() => setValues(initial)} disabled={!dirty || saving}>
            {t('actions.cancel')}
          </button>
          <button type="submit" className="btn btn--primary" disabled={!dirty || saving}>
            {saving ? <span className="btn__spinner" /> : null}
            {t('goals.profile.save')}
          </button>
        </div>
      </form>

      {/* ------------------------------------------------ goal calculator -- */}
      <div className="suggest">
        <div className="row-between" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <BoltIcon size={16} />
            <strong>{t('goals.suggest.title')}</strong>
          </div>
          <button type="button" className="btn btn--outline btn--sm" onClick={handleSuggest} disabled={saving}>
            {t('goals.suggest.cta')}
          </button>
        </div>
        <p className="field__hint">{t('goals.suggest.body')}</p>

        {suggestion ? (
          <div className="suggest__result" data-testid="goal-suggestion">
            <p className="numeric">
              {t('goals.suggest.result', {
                kcal: formatNumber(suggestion.goals.calories, locale),
                protein: formatNumber(suggestion.goals.protein, locale),
                carbs: formatNumber(suggestion.goals.carbs, locale),
                fat: formatNumber(suggestion.goals.fat, locale),
              })}
            </p>
            <p className="field__hint numeric">
              {t('goals.suggest.maintenance', {
                kcal: formatNumber(suggestion.maintenance, locale),
                adjustment: formatNumber(suggestion.dailyAdjustment, locale),
              })}
            </p>
            <button type="button" className="btn btn--primary btn--sm" onClick={() => void applySuggestion()}>
              <CheckIcon size={15} />
              {t('goals.suggest.apply')}
            </button>
          </div>
        ) : attempted ? (
          <p className="field__hint" data-testid="goal-suggestion-incomplete">
            {t('goals.suggest.incomplete')}
          </p>
        ) : null}
      </div>
    </section>
  )
}
