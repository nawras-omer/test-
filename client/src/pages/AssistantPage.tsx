/**
 * Full-height assistant route — the same panel as the dashboard's, with room
 * for a long conversation (and no side column) on phones.
 */
import { ChatPanel } from '@/components/assistant/ChatPanel'
import { useI18n } from '@/i18n'

export function AssistantPage() {
  const { t } = useI18n()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('assistant.eyebrow')}</p>
          <h1 className="page__title">{t('assistant.title')}</h1>
          <p className="page__subtitle">{t('assistant.status.note')}</p>
        </div>
      </header>

      <ChatPanel variant="page" />
    </div>
  )
}
