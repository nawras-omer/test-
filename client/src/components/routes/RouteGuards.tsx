import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'

function BootScreen() {
  const { t } = useI18n()
  return (
    <div className="app-boot">
      <span className="btn__spinner" style={{ width: 26, height: 26 }} />
      <p>{t('common.loading')}</p>
    </div>
  )
}

/** Anything below here requires a session; otherwise bounce to /login. */
export function ProtectedRoute() {
  const { status, isAuthenticated } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <BootScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Login/signup are hidden from already-authenticated visitors. */
export function PublicOnlyRoute() {
  const { status, isAuthenticated } = useAuth()

  if (status === 'loading') return <BootScreen />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
