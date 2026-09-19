/**
 * The assistant's chat surface.
 *
 * The same component is used twice: as the panel beside the dashboard (history
 * always visible, as asked for) and, taller, on its own `/assistant` route so
 * phones get a full-screen conversation.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageBubble } from './MessageBubble'
import { CloseIcon, SparkleIcon, TrashIcon } from '@/components/ui/Icons'
import { useAssistant } from '@/lib/assistant/AssistantProvider'
import { useI18n, type TranslationKey } from '@/i18n'

const TIP_KEYS: TranslationKey[] = ['assistant.tip.log', 'assistant.tip.estimate', 'assistant.tip.suggest', 'assistant.tip.summary']

interface ChatPanelProps {
  variant?: 'panel' | 'page'
  /** Rendered as a drawer instead of a card (mobile entry point). */
  onClose?: () => void
}

export function ChatPanel({ variant = 'panel', onClose }: ChatPanelProps) {
  const { t, locale } = useI18n()
  const { messages, sending, send, clear, llmEnabled } = useAssistant()
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  // Keep the newest message in view.
  useEffect(() => {
    const node = logRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length, sending])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setDraft('')
    void send(text)
  }

  function sendTip(key: TranslationKey) {
    if (sending) return
    setDraft('')
    void send(t(key))
  }

  return (
    <section className={`chat chat--${variant}`} aria-label={t('assistant.title')}>
      <header className="chat__head">
        <span className="chat__avatar" aria-hidden="true">
          <SparkleIcon size={18} />
        </span>
        <div className="chat__heading">
          <h2 className="chat__title">{t('assistant.title')}</h2>
          <p className="chat__subtitle">{t('assistant.subtitle')}</p>
        </div>
        <div className="chat__actions">
          <span className={`chip chip--tiny chip--${llmEnabled ? 'ai' : 'local'}`} title={t('assistant.status.note')}>
            {t(llmEnabled ? 'assistant.status.ai' : 'assistant.status.onDevice')}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => void clear()}
            disabled={messages.length === 0 || sending}
            aria-label={t('assistant.clear')}
            title={t('assistant.clear')}
          >
            <TrashIcon size={16} />
          </button>
          {onClose ? (
            <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
              <CloseIcon size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <div className="chat__log" ref={logRef} data-testid="chat-log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat__intro">
            <p className="chat__intro-title">{t('assistant.empty.title')}</p>
            <p className="chat__intro-body">{t('assistant.empty.body')}</p>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {sending ? (
          <div className="chat__msg chat__msg--bot">
            <div className="chat__bubble chat__typing" role="status">
              <span />
              <span />
              <span />
              <span className="visually-hidden">{t('assistant.thinking')}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="chat__tips">
        {TIP_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="chip chip--tiny chat__tip"
            onClick={() => sendTip(key)}
            disabled={sending}
          >
            {t(key)}
          </button>
        ))}
      </div>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor={`chat-input-${variant}`}>
          {t('assistant.placeholder')}
        </label>
        <input
          id={`chat-input-${variant}`}
          className="input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('assistant.placeholder')}
          autoComplete="off"
          lang={locale}
          disabled={sending}
        />
        <button type="submit" className="btn btn--primary" disabled={sending || draft.trim().length === 0}>
          {t('assistant.send')}
        </button>
      </form>
    </section>
  )
}
