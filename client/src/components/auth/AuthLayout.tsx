import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import { CheckIcon, TargetIcon } from '@/components/ui/Icons'
import { useI18n } from '@/i18n'

/**
 * Split-screen shell for /login and /signup.
 * The gradient panel is hidden on narrow screens (the whole marketing column
 * collapses into a compact brand header) and mirrors automatically in RTL.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n()

  const bullets = [t('auth.aside.bullet1'), t('auth.aside.bullet2'), t('auth.aside.bullet3')]

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Link to="/" aria-label="Kalori" className="auth__aside-brand" style={{ display: 'inline-flex' }}>
          <Logo />
        </Link>

        <div>
          <h1 className="auth__headline">{t('auth.aside.headline')}</h1>
          <p className="auth__lede">{t('auth.aside.lede')}</p>

          <ul className="auth__bullets">
            {bullets.map((bullet) => (
              <li className="auth__bullet" key={bullet}>
                <span className="auth__bullet-icon" aria-hidden="true">
                  <CheckIcon size={14} />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth__preview">
          <span className="auth__bullet-icon" aria-hidden="true" style={{ width: 40, height: 40 }}>
            <TargetIcon size={20} />
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', opacity: 0.85 }}>
              {t('auth.aside.previewLabel')}
            </span>
            <strong style={{ display: 'block', fontSize: 'var(--text-md)' }} className="numeric">
              {t('auth.aside.previewValue')}
            </strong>
            <span style={{ fontSize: 'var(--text-xs)', opacity: 0.85 }}>{t('auth.aside.previewCaption')}</span>
          </span>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__topbar">
          <LanguageSwitcher />
          <ThemeSwitcher compact />
        </div>

        <div className="auth__mobile-brand">
          <Link to="/" aria-label="Kalori">
            <Logo />
          </Link>
        </div>

        <div className="auth__form-wrap">{children}</div>
      </main>
    </div>
  )
}
