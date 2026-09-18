import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertIcon } from '@/components/ui/Icons'
import { useI18n } from '@/i18n'

function BoundaryFallback({ onReset }: { onReset: () => void }) {
  const { t } = useI18n()

  return (
    <div className="centered-panel">
      <span className="centered-panel__icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        <AlertIcon size={30} />
      </span>
      <h1 className="page__title">{t('error.boundary.title')}</h1>
      <p className="text-muted">{t('error.boundary.body')}</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          onReset()
          window.location.reload()
        }}
      >
        {t('error.boundary.cta')}
      </button>
    </div>
  )
}

interface State {
  hasError: boolean
}

/** Catches render-time crashes so the app shows a localised panel instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[kalori] render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <BoundaryFallback onReset={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
