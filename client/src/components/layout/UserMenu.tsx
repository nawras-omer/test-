import { Link } from 'react-router-dom'
import { Dropdown } from '@/components/ui/Dropdown'
import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon } from '@/components/ui/Icons'
import { useAuth } from '@/lib/auth'
import { initials } from '@/lib/utils'
import { useI18n } from '@/i18n'

/** Avatar + account dropdown in the navbar. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const { t } = useI18n()

  if (!user) return null

  return (
    <Dropdown
      menuLabel={t('user.menu')}
      trigger={({ open, toggle }) => (
        <button type="button" className="user-trigger" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
          <span className="avatar avatar--sm" aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="user-trigger__name">{user.name}</span>
          <ChevronDownIcon size={16} className="text-soft" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="user-menu__head">
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="user-menu__name">{user.name}</span>
              <span className="user-menu__email">{user.email}</span>
            </span>
          </div>

          <div className="dropdown__separator" />

          <Link to="/profile" className="dropdown__item" onClick={close}>
            <UserIcon size={17} />
            {t('user.profile')}
          </Link>
          <Link to="/settings" className="dropdown__item" onClick={close}>
            <SettingsIcon size={17} />
            {t('user.settings')}
          </Link>

          <div className="dropdown__separator" />

          <button
            type="button"
            className="dropdown__item dropdown__item--danger"
            onClick={() => {
              close()
              void logout()
            }}
          >
            <LogOutIcon size={17} />
            {t('actions.signOut')}
          </button>
        </>
      )}
    </Dropdown>
  )
}
