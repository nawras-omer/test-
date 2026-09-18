import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useI18n } from '@/i18n'

/** Shell for every signed-in screen: navbar + main + slim footer. */
export function AppLayout() {
  const { t } = useI18n()

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t('nav.openMenu')}
      </a>
      <Navbar />
      <main className="app-main" id="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="app-footer">
        <div className="container row-between">
          <span>{t('footer.note')}</span>
          <span className="numeric">EN · AR · CKB</span>
        </div>
      </footer>
    </div>
  )
}
