/**
 * One row of the conversation.
 *
 * Assistant messages store structure, not prose, so each `kind` renders from
 * the active dictionary — switching language re-renders the whole transcript.
 */
import { MACRO_COLORS } from '@/components/dashboard/macroColors'
import { CheckIcon, PlusIcon, SparkleIcon } from '@/components/ui/Icons'
import { findEntryById } from '@/lib/foods'
import { formatNumber } from '@/lib/format'
import { useAssistant } from '@/lib/assistant/AssistantProvider'
import { asData, type CompareData, type FallbackData, type FoodInfoData, type LogData, type StoredItem, type SuggestData, type SummaryData, type TopicData } from '@/lib/assistant/payloads'
import { useI18n, type TranslationKey } from '@/i18n'
import type { AssistantMessage, Locale, MealType } from '@/types'

/** Localised name for a stored item — bundled foods keep their id, so they translate. */
export function storedItemName(item: StoredItem, locale: Locale): string {
  if (!item.foodId) return item.name
  const entry = findEntryById(item.foodId)
  if (!entry) return item.name
  if (entry.kind === 'custom') return entry.food.name
  return entry.food.names[locale] ?? entry.food.names.en
}

function ItemTable({ items, locale }: { items: StoredItem[]; locale: Locale }) {
  const { t } = useI18n()
  const totals = items.reduce(
    (accumulator, item) => ({
      kcal: accumulator.kcal + item.kcal,
      protein: Math.round((accumulator.protein + item.protein) * 10) / 10,
      carbs: Math.round((accumulator.carbs + item.carbs) * 10) / 10,
      fat: Math.round((accumulator.fat + item.fat) * 10) / 10,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return (
    <table className="chat-table">
      <thead>
        <tr>
          <th scope="col">{t('assistant.table.food')}</th>
          <th scope="col">{t('common.kcal')}</th>
          <th scope="col">{t('dashboard.macros.protein')}</th>
          <th scope="col">{t('dashboard.macros.carbs')}</th>
          <th scope="col">{t('dashboard.macros.fat')}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.foodId ?? item.name}-${index}`}>
            <td>{storedItemName(item, locale)}</td>
            <td className="numeric">{formatNumber(item.kcal, locale)}</td>
            <td className="numeric">{formatNumber(item.protein, locale)}</td>
            <td className="numeric">{formatNumber(item.carbs, locale)}</td>
            <td className="numeric">{formatNumber(item.fat, locale)}</td>
          </tr>
        ))}
        {items.length > 1 ? (
          <tr className="chat-table__total">
            <td>{t('assistant.table.totals')}</td>
            <td className="numeric">{formatNumber(totals.kcal, locale)}</td>
            <td className="numeric">{formatNumber(totals.protein, locale)}</td>
            <td className="numeric">{formatNumber(totals.carbs, locale)}</td>
            <td className="numeric">{formatNumber(totals.fat, locale)}</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}

function MacroLine({ item, locale }: { item: StoredItem; locale: Locale }) {
  const { t } = useI18n()
  return (
    <p className="chat__macros">
      <span style={{ color: MACRO_COLORS.protein }}>
        {t('dashboard.macros.protein')} {formatNumber(item.protein, locale)} {t('common.g')}
      </span>
      <span style={{ color: MACRO_COLORS.carbs }}>
        {t('dashboard.macros.carbs')} {formatNumber(item.carbs, locale)} {t('common.g')}
      </span>
      <span style={{ color: MACRO_COLORS.fat }}>
        {t('dashboard.macros.fat')} {formatNumber(item.fat, locale)} {t('common.g')}
      </span>
    </p>
  )
}

/** Shared shell for the data-driven answer cards. */
function Card({ title, children, tone }: { title?: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className={`chat-card${tone ? ` chat-card--${tone}` : ''}`}>
      {title ? <p className="chat-card__title">{title}</p> : null}
      {children}
    </div>
  )
}

export function MessageBubble({ message }: { message: AssistantMessage }) {
  const { t, locale } = useI18n()
  const { logItems } = useAssistant()
  const data = message.data

  if (message.role === 'user') {
    return (
      <div className="chat__msg chat__msg--user">
        <span className="chat__who">{t('assistant.message.you')}</span>
        <p className="chat__bubble">{message.text}</p>
      </div>
    )
  }

  let body: React.ReactNode = message.text

  switch (message.kind) {
    case 'reply.greeting':
      body = <p className="chat__text">{t('assistant.greeting')}</p>
      break
    case 'reply.thanks':
      body = <p className="chat__text">{t('assistant.thanks')}</p>
      break
    case 'reply.help':
      body = (
        <Card title={t('assistant.help.title')}>
          <ul className="chat-card__list">
            {(['log', 'estimate', 'suggest', 'summary', 'topic'] as const).map((key) => (
              <li key={key}>{t(`assistant.help.${key}` as TranslationKey)}</li>
            ))}
          </ul>
        </Card>
      )
      break
    case 'reply.summary': {
      const summary = asData<SummaryData>(data)
      if (!summary) break
      body = (
        <Card title={t('assistant.summary.title')}>
          <p className="chat-card__big numeric">
            {t('assistant.summary.consumed', {
              kcal: formatNumber(summary.totals.calories, locale),
              goal: formatNumber(summary.goals.calories, locale),
              percent: formatNumber(Math.max(summary.percent, 0), locale),
            })}
          </p>
          <p className="chat-card__note">
            {summary.remaining >= 0
              ? t('assistant.summary.remaining', { kcal: formatNumber(summary.remaining, locale) })
              : t('assistant.summary.over', { kcal: formatNumber(Math.abs(summary.remaining), locale) })}
          </p>
          <p className="chat__macros">
            {t('assistant.summary.macros', {
              protein: formatNumber(summary.totals.protein, locale),
              carbs: formatNumber(summary.totals.carbs, locale),
              fat: formatNumber(summary.totals.fat, locale),
            })}
          </p>
        </Card>
      )
      break
    }
    case 'reply.topic': {
      const topic = asData<TopicData>(data)
      if (!topic) break
      const key = `assistant.topic.${topic.topic}` as TranslationKey
      const vars: Record<string, string> = {}
      for (const [name, value] of Object.entries(topic.values)) vars[name] = formatNumber(value, locale)
      body = <Card title={t('assistant.title')}>{<p className="chat__text">{t(key, vars)}</p>}</Card>
      break
    }
    case 'reply.suggest': {
      const suggestion = asData<SuggestData>(data)
      if (!suggestion) break
      const mealName = t(`meal.${suggestion.mealType}` as TranslationKey)
      body = (
        <Card title={t('assistant.suggest.title', { meal: mealName })}>
          <p className="chat-card__note">
            {t('assistant.suggest.remaining', { kcal: formatNumber(suggestion.remaining, locale) })}
          </p>
          {suggestion.note !== 'ok' ? (
            <p className="chat-card__note chat-card__note--warn">
              {t(suggestion.note === 'over' ? 'assistant.suggest.over' : 'assistant.suggest.tight')}
            </p>
          ) : null}
          <ul className="chat-suggest">
            {suggestion.suggestions.map((item) => (
              <li className="chat-suggest__row" key={`${item.foodId}-${item.name}`}>
                <div className="chat-suggest__main">
                  <span className="chat-suggest__name">{storedItemName(item, locale)}</span>
                  <span className="chat-suggest__meta">
                    {formatNumber(item.kcal, locale)} {t('common.kcal')} · {formatNumber(item.protein, locale)}{' '}
                    {t('common.g')} {t('dashboard.macros.protein')}
                  </span>
                </div>
                <span className={`chip chip--tiny chip--${item.reason}`}>
                  {t(`assistant.suggest.reason.${item.reason}` as TranslationKey)}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => void logItems([item], suggestion.mealType)}
                >
                  <PlusIcon size={14} />
                  {t('assistant.suggest.add')}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )
      break
    }
    case 'reply.log':
    case 'reply.estimate': {
      const log = asData<LogData>(data)
      if (!log) break
      const names = log.items.map((item) => storedItemName(item, locale)).join(', ')
      const mealName = t(`meal.${log.mealType}` as TranslationKey)
      body = (
        <Card
          title={
            log.saved
              ? t('assistant.log.title', { meal: mealName })
              : t('assistant.estimate.title', { items: names })
          }
        >
          <ItemTable items={log.items} locale={locale} />
          <p className="chat-card__note">{t('assistant.estimate.note')}</p>
          {log.unmatched.length > 0 ? (
            <p className="chat-card__note chat-card__note--warn">
              {t('assistant.unmatched', { items: log.unmatched.join(', ') })}
            </p>
          ) : null}
          {!log.saved && log.items.length > 0 ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => void logItems(log.items, log.mealType)}
            >
              <CheckIcon size={15} />
              {t('assistant.log.save')}
            </button>
          ) : null}
        </Card>
      )
      break
    }
    case 'reply.foodInfo': {
      const info = asData<FoodInfoData>(data)
      if (!info) break
      const entry = info.item.foodId ? findEntryById(info.item.foodId) : null
      const serving = entry?.kind === 'bundled' ? `${entry.food.serving.qty} ${t(`unit.${entry.food.serving.unit}` as TranslationKey)}` : null
      body = (
        <Card title={storedItemName(info.item, locale)}>
          <p className="chat-card__big numeric">
            {formatNumber(info.item.kcal, locale)} {t('common.kcal')}
          </p>
          <MacroLine item={info.item} locale={locale} />
          {serving ? (
            <p className="chat-card__note">{t('assistant.food.serving', { serving })}</p>
          ) : null}
          <p className="chat-card__note">
            {t('assistant.food.percent', { percent: formatNumber(info.percentOfDay, locale) })}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => void logItems([info.item], info.mealType as MealType)}
          >
            <CheckIcon size={15} />
            {t('assistant.log.save')}
          </button>
        </Card>
      )
      break
    }
    case 'reply.compare': {
      const compare = asData<CompareData>(data)
      if (!compare) break
      body = (
        <Card title={t('assistant.compare.title')}>
          <ItemTable items={compare.items} locale={locale} />
        </Card>
      )
      break
    }
    case 'reply.fallback': {
      const fallback = asData<FallbackData>(data)
      const degraded = Boolean(asData<{ degraded?: boolean }>(data)?.degraded)
      body = (
        <Card title={t('assistant.fallback.title')}>
          <p className="chat-card__note">{t('assistant.fallback.body')}</p>
          {degraded ? (
            <p className="chat-card__note chat-card__note--warn">{t('assistant.llm.unavailable')}</p>
          ) : null}
          {fallback && fallback.didYouMean.length > 0 ? (
            <div className="chat-card__chips">
              {fallback.didYouMean.map((food) => (
                <span className="chip chip--tiny" key={food.foodId ?? food.name}>
                  {food.foodId ? storedItemName({ ...EMPTY_ITEM, foodId: food.foodId }, locale) : food.name}
                </span>
              ))}
            </div>
          ) : null}
        </Card>
      )
      break
    }
    default:
      // `reply.llm` (and anything unknown) is plain prose stored on the message.
      body = <p className="chat__text">{message.text}</p>
      break
  }

  return (
    <div className="chat__msg chat__msg--bot">
      <span className="chat__who">
        <SparkleIcon size={13} />
        {t('assistant.message.bot')}
      </span>
      <div className="chat__bubble chat__bubble--card">{body}</div>
    </div>
  )
}

/** Placeholder used to reuse `storedItemName` for a "did you mean" chip. */
const EMPTY_ITEM: StoredItem = {
  foodId: null,
  name: '',
  qty: 1,
  unit: null,
  servings: 1,
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}
