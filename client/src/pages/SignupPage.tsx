import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Alert } from '@/components/ui/Alert'
import { Field, PasswordField } from '@/components/ui/Field'
import { ArrowRightIcon, LockIcon, MailIcon, UserIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { errorKey, fieldMessages, messageFor } from '@/lib/errors'
import { validateSignup } from '@/lib/validation'
import { useI18n } from '@/i18n'

export function SignupPage() {
  const { t } = useI18n()
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const localErrors = validateSignup(values)
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(localErrors)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSubmitting(true)
    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="auth__title">{t('auth.signUp.title')}</h1>
      <p className="auth__subtitle">{t('auth.signUp.subtitle')}</p>

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field
          label={t('auth.name')}
          name="name"
          autoComplete="name"
          placeholder={t('auth.name.placeholder')}
          icon={<UserIcon size={18} />}
          value={values.name}
          error={errors.name}
          onChange={update('name')}
          required
        />

        <Field
          label={t('auth.email')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t('auth.email.placeholder')}
          icon={<MailIcon size={18} />}
          value={values.email}
          error={errors.email}
          onChange={update('email')}
          required
        />

        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          <PasswordField
            label={t('auth.password')}
            name="password"
            autoComplete="new-password"
            placeholder={t('auth.password.placeholder')}
            hint={t('auth.passwordHint')}
            value={values.password}
            error={errors.password}
            onChange={update('password')}
            required
          />
          <PasswordStrength password={values.password} />
        </div>

        <PasswordField
          label={t('auth.confirmPassword')}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder={t('auth.confirmPassword.placeholder')}
          value={values.confirmPassword}
          error={errors.confirmPassword}
          onChange={update('confirmPassword')}
          required
        />

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? <span className="btn__spinner" /> : <LockIcon size={18} />}
          {t('actions.signUp')}
          {!submitting && <ArrowRightIcon size={18} />}
        </button>

        <p className="auth__legal">{t('auth.terms')}</p>
      </form>

      <p className="auth__switch">
        {t('auth.hasAccount')}{' '}
        <Link className="btn btn--link" to="/login">
          {t('actions.signIn')}
        </Link>
      </p>
    </AuthLayout>
  )
}
