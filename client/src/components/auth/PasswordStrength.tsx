import type { TranslationKey } from '@/i18n'
import { useI18n } from '@/i18n'

/** 0-4 score from length + character variety. */
function scorePassword(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  return Math.min(score, 4)
}

const LABELS: TranslationKey[] = [
  'auth.strength.weak',
  'auth.strength.weak',
  'auth.strength.fair',
  'auth.strength.good',
  'auth.strength.strong',
]

const COLORS = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--info)', 'var(--success)']

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useI18n()
  const score = scorePassword(password)
  if (!password) return null

  return (
    <div className="stack" style={{ gap: 'var(--space-2)' }}>
      <div className="bar" aria-hidden="true">
        <div
          className="bar__fill"
          style={{ width: `${(score / 4) * 100}%`, ['--fill' as string]: COLORS[score] }}
        />
      </div>
      <p className="field__hint" aria-live="polite">
        {t('auth.strength.label')}: <strong>{t(LABELS[score])}</strong>
      </p>
    </div>
  )
}
