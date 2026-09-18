import { useEffect, useState, type ComponentType } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { UserMenu } from './UserMenu'
import { Logo } from '@/components/ui/Logo'
import { BookmarkIcon, CloseIcon, DiaryIcon, HomeIcon, MealIcon, MenuIcon, TrendIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { cx } from '@/lib/utils'
import { useI18n, type TranslationKey } from '@/i18n'

interface NavItem {
  to: string
  key: TranslationKey
  icon: ComponentType<{ size?: number }>
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', key: 'nav.dashboard', icon: HomeIcon, end: true },
  { to: '/library', key: 'nav.library', icon: BookmarkIcon },
  { to: '/diary', key: 'nav.diary', icon: DiaryIcon },
  { to: '/meals', key: 'nav.meals', icon: MealIcon },
  { to: '/progress', key: 'nav.progress', icon: TrendIcon },
]

export function Navbar() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close the mobile panel whenever we navigate.
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx('nav-link', isActive ? 'nav-link--active' : undefined)

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar__inner">
          <Link to="/" aria-label="Kalori — home" style={{ display: 'inline-flex' }}>
            <Logo />
          </Link>

          {user && (
            <nav className="navbar__nav" aria-label={t('nav.openMenu')}>
              {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={linkClass}>
                  <Icon size={17} />
                  {t(key)}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="navbar__actions">
            <LanguageSwitcher />
            <ThemeSwitcher />
            {user ? (
              <UserMenu />
            ) : null}

            {user && (
              <button
                type="button"
                className="icon-btn navbar__burger"
                onClick={() => setMobileOpen((value) => !value)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              >
                {mobileOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
              </button>
            )}
          </div>
        </div>

        {user && mobileOpen && (
          <div className="navbar__mobile" id="mobile-navigation">
            <nav className="navbar__mobile-nav" aria-label={t('nav.openMenu')}>
              {NAV_ITEMS.map(({ to, key, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={linkClass}>
                  <Icon size={18} />
                  {t(key)}
                </NavLink>
              ))}
              <NavLink to="/settings" className={linkClass}>
                {t('nav.settings')}
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                {t('nav.profile')}
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
