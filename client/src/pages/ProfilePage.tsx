import { CalendarIcon, GlobeIcon, LogOutIcon, PaletteIcon, TargetIcon, UserIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { formatDate, formatNumber } from '@/lib/format'
import { initials } from '@/lib/utils'
import { GoalsCard } from '@/components/settings/GoalsCard'
import { useI18n } from '@/i18n'

/** Read-only account overview — editing arrives with the profile module. */
export function ProfilePage() {
  const { t, locale, meta } = useI18n()
  const { user, logout } = useAuth()
  const { palette, mode, palettes } = useTheme()

  if (!user) return null

  const rows = [
    { key: 'name', icon: <UserIcon size={17} />, label: t('pages.profile.name'), value: user.name },
    { key: 'email', icon: <UserIcon size={17} />, label: t('pages.profile.email'), value: user.email },
    {
      key: 'joined',
      icon: <CalendarIcon size={17} />,
      label: t('pages.profile.joined'),
      value: formatDate(user.createdAt, locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    },
    { key: 'language', icon: <GlobeIcon size={17} />, label: t('pages.profile.language'), value: meta.native },
    {
      key: 'goal',
      icon: <TargetIcon size={17} />,
      label: t('pages.profile.goal'),
      value: `${formatNumber(user.goals?.calories ?? 0, locale)} ${t('common.kcal')}`,
    },
    {
      key: 'theme',
      icon: <PaletteIcon size={17} />,
      label: t('pages.profile.theme'),
      value: `${t(palettes.find((item) => item.id === palette)?.labelKey ?? 'theme.palette.green')} · ${t(
        mode === 'dark' ? 'theme.mode.dark' : 'theme.mode.light',
      )}`,
    },
  ]

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('nav.profile')}</p>
          <h1 className="page__title">{t('pages.profile.title')}</h1>
          <p className="page__subtitle">{t('pages.profile.subtitle')}</p>
        </div>
        <div className="page__actions">
          <button type="button" className="btn btn--danger" onClick={() => void logout()}>
            <LogOutIcon size={18} />
            {t('actions.signOut')}
          </button>
        </div>
      </header>

      <div className="grid-2">
        <section className="card card--pad">
          <div className="row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <span className="avatar avatar--lg" aria-hidden="true">
              {initials(user.name)}
            </span>
            <div>
              <h2 className="card__title">{user.name}</h2>
              <p className="card__subtitle numeric">{user.email}</p>
            </div>
          </div>

          <ul className="stack" style={{ gap: 'var(--space-3)' }}>
            {rows.map((row) => (
              <li className="row-between text-sm" key={row.key}>
                <span className="row text-muted" style={{ gap: 'var(--space-2)' }}>
                  <span className="text-soft">{row.icon}</span>
                  {row.label}
                </span>
                <span style={{ fontWeight: 600 }}>{row.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <GoalsCard />
      </div>
    </div>
  )
}
