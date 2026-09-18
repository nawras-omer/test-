import { Link } from 'react-router-dom'
import { ArrowRightIcon, AlertIcon } from '@/components/ui/Icons'
import { useI18n } from '@/i18n'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <div className="centered-panel">
      <span className="centered-panel__icon" aria-hidden="true">
        <AlertIcon size={30} />
      </span>
      <h1 className="page__title">{t('notFound.title')}</h1>
      <p className="text-muted" style={{ maxWidth: '40ch' }}>
        {t('notFound.body')}
      </p>
      <Link className="btn btn--primary" to="/">
        {t('notFound.cta')}
        <ArrowRightIcon size={18} />
      </Link>
    </div>
  )
}
