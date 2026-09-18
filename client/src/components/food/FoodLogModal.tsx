import { useMemo, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import {
  MoonDinnerIcon,
  SnackIcon,
  SunLunchIcon,
  SunriseIcon,
  TargetIcon,
} from '@/components/ui/Icons'
import { useEntries } from '@/lib/entries'
import { errorKey, fieldMessages, messageFor } from '@/lib/errors'
import { formatDate, formatNumber } from '@/lib/format'
import { macroCalories, mealTypeForNow, parseDateKey } from '@/lib/food'
import { validateFoodEntry } from '@/lib/validation'
import { useI18n } from '@/i18n'
import { MEAL_TYPES, type FoodLogPrefill, type MealType } from '@/types'

const MEAL_ICONS: Record<MealType, typeof SunriseIcon> = {
  breakfast: SunriseIcon,
  lunch: SunLunchIcon,
  dinner: MoonDinnerIcon,
  snack: SnackIcon,
}

interface FoodLogModalProps {
  open: boolean
  onClose: () => void
  /** Called with the saved entry so the caller can show a success message. */
  onSaved?: (entryName: string, mealType: MealType) => void
  /** Pre-selected meal / date, e.g. when opened from a specific day. */
  defaultMealType?: MealType
  defaultDate?: string
  /** Food chosen in the library — name, serving and nutrition are filled in. */
  prefill?: FoodLogPrefill
}

interface FormValues {
  name: string
  servingSize: string
  calories: string
  protein: string
  carbs: string
  fat: string
  mealType: MealType
  date: string
}

/** Formats a library food as form values, leaving the meal/date to the caller. */
function formFromPrefill(prefill: FoodLogPrefill, mealType: MealType, date: string): FormValues {
  return {
    name: prefill.name ?? '',
    servingSize: prefill.servingSize ?? '',
    calories: prefill.calories === undefined || prefill.calories === '' ? '' : String(prefill.calories),
    protein: prefill.protein === undefined || prefill.protein === '' ? '' : String(prefill.protein),
    carbs: prefill.carbs === undefined || prefill.carbs === '' ? '' : String(prefill.carbs),
    fat: prefill.fat === undefined || prefill.fat === '' ? '' : String(prefill.fat),
    mealType,
    date,
  }
}

function emptyForm(mealType: MealType, date: string): FormValues {
  return {
    name: '',
    servingSize: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType,
    date,
  }
}

/**
 * The food-logging dialog: name, serving size, calories, macros, meal and date.
 * Fully localised and RTL-aware; saving hands the canonical entry back to the
 * diary store, which refreshes every dashboard widget immediately.
 */
export function FoodLogModal({
  open,
  onClose,
  onSaved,
  defaultMealType,
  defaultDate,
  prefill,
}: FoodLogModalProps) {
  const { t, locale } = useI18n()
  const { today, addEntry } = useEntries()

  // The provider remounts this component on every opening (see the `key` it
  // passes), so the initial state *is* the reset — no effect, no stale frame.
  const [values, setValues] = useState<FormValues>(() => {
    const mealType = defaultMealType ?? mealTypeForNow()
    const date = defaultDate ?? today
    return prefill ? formFromPrefill(prefill, mealType, date) : emptyForm(mealType, date)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update =
    (field: keyof FormValues) => (event: { target: { value: string } }) =>
      setValues((previous) => ({ ...previous, [field]: event.target.value }))

  const preview = useMemo(() => {
    const calories = Number(values.calories) || 0
    const fromMacros = macroCalories(Number(values.protein), Number(values.carbs), Number(values.fat))
    return { calories, fromMacros }
  }, [values.calories, values.protein, values.carbs, values.fat])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const localErrors = validateFoodEntry(values, today)
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(localErrors)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSubmitting(true)
    try {
      const entry = await addEntry({
        name: values.name.trim(),
        servingSize: values.servingSize.trim(),
        calories: Number(values.calories),
        protein: values.protein.trim() === '' ? 0 : Number(values.protein),
        carbs: values.carbs.trim() === '' ? 0 : Number(values.carbs),
        fat: values.fat.trim() === '' ? 0 : Number(values.fat),
        mealType: values.mealType,
        date: values.date,
      })
      onSaved?.(entry.name, entry.mealType)
      onClose()
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSubmitting(false)
    }
  }

  const dateLabel = formatDate(parseDateKey(values.date || today), locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('food.modal.title')}
      subtitle={t('food.modal.subtitle', { date: dateLabel })}
      eyebrow={t('dashboard.eyebrow')}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
            {t('actions.cancel')}
          </button>
          <button type="submit" form="food-log-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <span className="btn__spinner" /> : <TargetIcon size={18} />}
            {t('food.submit')}
          </button>
        </>
      }
    >
      <form className="food-form" id="food-log-form" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert>{formError}</Alert> : null}

        <fieldset className="food-form__group">
          <legend className="food-form__legend">{t('food.section.food')}</legend>

          <Field
            label={t('food.name')}
            name="name"
            value={values.name}
            onChange={update('name')}
            placeholder={t('food.name.placeholder')}
            error={errors.name}
            maxLength={80}
            autoComplete="off"
            required
          />

          <Field
            label={t('food.serving')}
            name="servingSize"
            value={values.servingSize}
            onChange={update('servingSize')}
            placeholder={t('food.serving.placeholder')}
            error={errors.servingSize}
            maxLength={40}
            optionalLabel={t('common.optional')}
            autoComplete="off"
          />
        </fieldset>

        <fieldset className="food-form__group">
          <legend className="food-form__legend">{t('food.section.nutrition')}</legend>

          <div className="food-form__grid">
            <Field
              label={t('food.calories')}
              name="calories"
              type="number"
              inputMode="decimal"
              min={0}
              max={20000}
              step={1}
              value={values.calories}
              onChange={update('calories')}
              placeholder={t('food.calories.placeholder')}
              error={errors.calories}
              suffix={<span className="input-suffix">{t('common.kcal')}</span>}
              required
            />

            <Field
              label={t('food.protein')}
              name="protein"
              type="number"
              inputMode="decimal"
              min={0}
              max={2000}
              step={0.1}
              value={values.protein}
              onChange={update('protein')}
              error={errors.protein}
              suffix={<span className="input-suffix">{t('common.g')}</span>}
            />

            <Field
              label={t('food.carbs')}
              name="carbs"
              type="number"
              inputMode="decimal"
              min={0}
              max={2000}
              step={0.1}
              value={values.carbs}
              onChange={update('carbs')}
              error={errors.carbs}
              suffix={<span className="input-suffix">{t('common.g')}</span>}
            />

            <Field
              label={t('food.fat')}
              name="fat"
              type="number"
              inputMode="decimal"
              min={0}
              max={2000}
              step={0.1}
              value={values.fat}
              onChange={update('fat')}
              error={errors.fat}
              suffix={<span className="input-suffix">{t('common.g')}</span>}
            />
          </div>

          <p className="field__hint">{t('food.macros.hint')}</p>

          <div className="food-form__preview">
            <span className="food-form__preview-label">{t('food.preview')}</span>
            <strong className="numeric">
              {t('food.preview.value', {
                kcal: formatNumber(preview.calories, locale),
                protein: formatNumber(Number(values.protein) || 0, locale),
                carbs: formatNumber(Number(values.carbs) || 0, locale),
                fat: formatNumber(Number(values.fat) || 0, locale),
              })}
            </strong>
            {preview.fromMacros > 0 && preview.calories > 0 ? (
              <span className="food-form__preview-note numeric">
                {t('food.preview.macroKcal', {
                  value: formatNumber(preview.fromMacros, locale),
                  total: formatNumber(preview.calories, locale),
                })}
              </span>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="food-form__group">
          <legend className="food-form__legend">{t('food.section.when')}</legend>

          <div className="field">
            <span className="field__label" id="meal-type-label">
              {t('food.mealType')}
            </span>
            <div className="meal-picker" role="group" aria-labelledby="meal-type-label">
              {MEAL_TYPES.map((mealType) => {
                const Icon = MEAL_ICONS[mealType]
                const active = values.mealType === mealType
                return (
                  <button
                    key={mealType}
                    type="button"
                    className="meal-picker__option"
                    aria-pressed={active}
                    onClick={() => setValues((previous) => ({ ...previous, mealType }))}
                  >
                    <Icon size={17} />
                    {t(`meal.${mealType}`)}
                  </button>
                )
              })}
            </div>
            {errors.mealType ? <p className="field__error">{errors.mealType}</p> : null}
          </div>

          <Field
            label={t('food.date')}
            name="date"
            type="date"
            value={values.date}
            onChange={update('date')}
            error={errors.date}
            hint={t('food.date.hint')}
            max={today}
            required
          />
        </fieldset>
      </form>
    </Modal>
  )
}
