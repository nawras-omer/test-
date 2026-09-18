import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Alert } from '@/components/ui/Alert'
import { Field, PasswordField } from '@/components/ui/Field'
import { ArrowRightIcon, MailIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { fieldMessages, messageFor, errorKey } from '@/lib/errors'
import { validateLogin } from '@/lib/validation'
import { useI18n } from '@/i18n'

const DEMO = { email: 'demo@kalori.app', password: 'demo1234' }

export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const localErrors = validateLogin({ email, password })
    const translated: Record<string, string> = {}
    for (const [field, code] of Object.entries(localErrors)) translated[field] = t(errorKey(code))
    setErrors(translated)
    setFormError(null)
    if (Object.keys(translated).length > 0) return

    setSubmitting(true)
    try {
      // "Keep me signed in" decides localStorage vs sessionStorage.
      await login({ email: email.trim(), password }, remember)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrors(fieldMessages(t, error))
      setFormError(messageFor(t, error))
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo() {
    setEmail(DEMO.email)
    setPassword(DEMO.password)
    setErrors({})
    setFormError(null)
  }

  return (
    <AuthLayout>
      <h1 className="auth__title">{t('auth.signIn.title')}</h1>
      <p className="auth__subtitle">{t('auth.signIn.subtitle')}</p>

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert>{formError}</Alert>}

        <Field
          label={t('auth.email')}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t('auth.email.placeholder')}
          icon={<MailIcon size={18} />}
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <PasswordField
          label={t('auth.password')}
          name="password"
          autoComplete="current-password"
          placeholder={t('auth.password.placeholder')}
          value={password}
          error={errors.password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <div className="auth__meta">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              name="remember"
            />
            {t('auth.remember')}
          </label>
          <button type="button" className="btn btn--link" disabled title={t('common.comingSoon')}>
            {t('auth.forgot')}
          </button>
        </div>

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting && <span className="btn__spinner" />}
          {t('actions.signIn')}
          {!submitting && <ArrowRightIcon size={18} />}
        </button>
      </form>

      {/* Demo credentials keep the foundation previewable without a database. */}
      <div className="alert alert--info" style={{ marginTop: 'var(--space-5)', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>
          <strong style={{ display: 'block' }}>{t('auth.demo.title')}</strong>
          <span className="numeric">{DEMO.email}</span> · <span className="numeric">{DEMO.password}</span>
        </span>
        <button type="button" className="btn btn--secondary btn--sm" onClick={fillDemo}>
          {t('actions.useDemo')}
        </button>
      </div>

      <p className="auth__switch">
        {t('auth.noAccount')}{' '}
        <Link className="btn btn--link" to="/signup">
          {t('actions.signUp')}
        </Link>
      </p>
    </AuthLayout>
  )
}
