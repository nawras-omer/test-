import { useEffect, useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PlusIcon } from '@/components/ui/Icons'
import { useCustomFoods } from '@/lib/customFoods'
import { errorKey, fieldMessages, messageFor } from '@/lib/errors'
import { validateCustomFood, type CustomFoodFormValues } from '@/lib/validation'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/ui/Toast'
import type { CustomFood } from '@/types'

interface CustomFoodModalProps {
  open: boolean
  onClose: () => void
  /** Seeds the name field, e.g. with the query that found no match. */
  initialName?: string
  /** Called with the saved food so the caller can highlight or log it. */
  onSaved?: (food: CustomFood) => void
}

function emptyForm(name = ''): CustomFoodFormValues {
  return { name, servingSize: '', calories: '', protein: '', carbs: '', fat: '' }
}

/**
 * "We do not have this food" — the personal-library form. Saves to the user's
 * own library (server-side, per account) so it can be logged again later.
 */
export function CustomFoodModal({ open, onClose, initialName, onSaved }: CustomFoodModalProps) {
  const { t } = useI18n()
  const { push } = useToast()
  const { addFood } = useCustomFoods()

  const [values, setValues] = useState<CustomFoodFormValues>(() => emptyForm(initialName))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset (with the caller's seed name) every time the dialog opens.
  useEffect(() => {
    if (!open) return
    setValues(emptyForm(initialName ?? ''))
    setErrors({})
    setFormError(null)
    setSubmitting(false)
  }, [open, initialName])

  const update =
    (field: keyof CustomFoodFormValues) => (event: { target: { value: string } }) =>
      setValues((previous) => ({ ...previous, [field]: event.target.value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const localErrors = validateCustomFood(values)
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(localErrors)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSubmitting(true)
    try {
      const food = await addFood({
        name: values.name.trim(),
        servingSize: values.servingSize.trim(),
        calories: Number(values.calories),
        protein: values.protein.trim() === '' ? 0 : Number(values.protein),
        carbs: values.carbs.trim() === '' ? 0 : Number(values.carbs),
        fat: values.fat.trim() === '' ? 0 : Number(values.fat),
      })
      push(t('library.custom.saved', { name: food.name }), 'success')
      onSaved?.(food)
      onClose()
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('library.custom.title')}
      subtitle={t('library.custom.subtitle')}
      eyebrow={t('nav.library')}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
            {t('actions.cancel')}
          </button>
          <button type="submit" form="custom-food-form" className="btn btn--primary" disabled={submitting}>
            {submitting ? <span className="btn__spinner" /> : <PlusIcon size={18} />}
            {t('library.custom.submit')}
          </button>
        </>
      }
    >
      <form className="food-form" id="custom-food-form" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert>{formError}</Alert> : null}

        <fieldset className="food-form__group">
          <legend className="food-form__legend">{t('food.section.food')}</legend>

          <Field
            label={t('food.name')}
            name="custom-name"
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
            name="custom-servingSize"
            value={values.servingSize}
            onChange={update('servingSize')}
            placeholder={t('food.serving.placeholder')}
            error={errors.servingSize}
            maxLength={40}
            autoComplete="off"
            optionalLabel={t('common.optional')}
          />
        </fieldset>

        <fieldset className="food-form__group">
          <legend className="food-form__legend">{t('food.section.nutrition')}</legend>

          <div className="food-form__grid">
            <Field
              label={t('food.calories')}
              name="custom-calories"
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
              name="custom-protein"
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
              name="custom-carbs"
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
              name="custom-fat"
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
        </fieldset>
      </form>
    </Modal>
  )
}
