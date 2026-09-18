import { useMemo, useState } from 'react'
import { CustomFoodModal } from '@/components/food/CustomFoodModal'
import { Alert } from '@/components/ui/Alert'
import {
  BookmarkIcon,
  CloseIcon,
  PlusIcon,
  SearchIcon,
  TargetIcon,
  TrashIcon,
} from '@/components/ui/Icons'
import { useToast } from '@/components/ui/Toast'
import { TOTAL_FOODS, CATEGORIES } from '@/data/foods'
import { useCustomFoods } from '@/lib/customFoods'
import { useFoodLog } from '@/components/food/FoodLogProvider'
import {
  ALL_FILTER,
  CUSTOM_FILTER,
  SEARCH_SUGGESTIONS,
  entryDetail,
  entryName,
  entryNutrition,
  entryPrefill,
  entryServing,
  searchLibrary,
  type LibraryEntry,
  type LibraryFilter,
} from '@/lib/foods'
import { formatNumber } from '@/lib/format'
import { useI18n, type TranslationKey } from '@/i18n'
import type { CustomFood } from '@/types'

/** How many rows are rendered at once; the rest are reachable by searching. */
const VISIBLE_LIMIT = 60

const FILTERS: LibraryFilter[] = [ALL_FILTER, CUSTOM_FILTER, ...CATEGORIES]

function filterKey(filter: LibraryFilter): TranslationKey {
  return `library.category.${filter}` as TranslationKey
}

/**
 * The food library: a bundled database of 1,000+ foods, searchable in English,
 * Arabic and Sorani Kurdish, browsable by category — and clickable straight
 * into the food-logging dialog. When a search finds nothing, the same screen
 * takes you to the custom-food form and saves the food to your own library.
 */
export function LibraryPage() {
  const { t, locale } = useI18n()
  const { push } = useToast()
  const { openFoodLog } = useFoodLog()
  const { foods: customFoods, status, removeFood } = useCustomFoods()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LibraryFilter>(ALL_FILTER)
  const [customOpen, setCustomOpen] = useState(false)
  const [customSeed, setCustomSeed] = useState('')

  const { entries, total } = useMemo(
    () => searchLibrary({ query, filter, custom: customFoods, limit: VISIBLE_LIMIT }),
    [query, filter, customFoods],
  )

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const customCount = customFoods.length
  const showCustomSection = filter === CUSTOM_FILTER || (!isSearching && customCount > 0)

  function logEntry(entry: LibraryEntry) {
    openFoodLog({ prefill: entryPrefill(entry, locale, t) })
  }

  function openCustomForm(seed = '') {
    setCustomSeed(seed)
    setCustomOpen(true)
  }

  async function handleRemove(food: CustomFood) {
    try {
      await removeFood(food.id)
      push(t('library.custom.removed', { name: food.name }), 'success')
    } catch {
      push(t('library.custom.deleteFailed'), 'danger')
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('library.eyebrow')}</p>
          <h1 className="page__title">{t('library.title')}</h1>
          <p className="page__subtitle">
            {t('library.subtitle', { count: formatNumber(TOTAL_FOODS, locale) })}
          </p>
        </div>
        <button type="button" className="btn btn--outline" onClick={() => openCustomForm(trimmedQuery)}>
          <PlusIcon size={18} />
          {t('library.addCustom')}
        </button>
      </header>

      {/* -------------------------------------------------------- search -- */}
      <section className="card card--pad library__search-card">
        <div className="library-search">
          <span className="library-search__icon" aria-hidden="true">
            <SearchIcon size={18} />
          </span>
          <input
            id="library-search"
            className="input library-search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('library.search.placeholder')}
            aria-label={t('library.search.label')}
            autoComplete="off"
            spellCheck={false}
          />
          {isSearching ? (
            <button
              type="button"
              className="library-search__clear"
              onClick={() => setQuery('')}
              aria-label={t('library.search.clear')}
            >
              <CloseIcon size={16} />
            </button>
          ) : null}
        </div>

        <div className="library__suggestions">
          <span className="text-sm text-soft">{t('library.suggestions')}</span>
          {SEARCH_SUGGESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              className="chip chip--ghost"
              onClick={() => {
                setQuery(t(key))
                setFilter(ALL_FILTER)
              }}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="category-bar" role="group" aria-label={t('library.categories')}>
          {FILTERS.map((value) => {
            const active = filter === value
            const count =
              value === CUSTOM_FILTER ? customCount : value === ALL_FILTER ? TOTAL_FOODS : undefined
            return (
              <button
                key={value}
                type="button"
                className={`category-chip${active ? ' category-chip--active' : ''}`}
                data-category={value}
                aria-pressed={active}
                onClick={() => setFilter(value)}
              >
                {value === CUSTOM_FILTER ? <BookmarkIcon size={15} /> : null}
                {t(filterKey(value))}
                {count !== undefined && count > 0 ? (
                  <span className="category-chip__count">{formatNumber(count, locale)}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </section>

      {status === 'error' ? <Alert>{t('library.status.error')}</Alert> : null}

      {/* ------------------------------------------------------- results -- */}
      <section className="card card--pad">
        <div className="row-between library__results-head">
          <div>
            <h2 className="card__title">
              {showCustomSection && !isSearching ? t('library.custom.section') : t('library.title')}
            </h2>
            <p className="card__subtitle numeric" data-testid="library-count">
              {isSearching || total <= VISIBLE_LIMIT
                ? t('library.count', { count: formatNumber(total, locale) })
                : t('library.results.showing', {
                    shown: formatNumber(entries.length, locale),
                    total: formatNumber(total, locale),
                  })}
            </p>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => openCustomForm(trimmedQuery)}>
            <PlusIcon size={16} />
            {t('library.addCustom')}
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="library__empty">
            <span className="centered-panel__icon" aria-hidden="true">
              <SearchIcon size={28} />
            </span>
            <h3 className="card__title">
              {isSearching ? t('library.results.none.title', { query: trimmedQuery }) : t('library.emptyCategory')}
            </h3>
            <p className="text-muted" style={{ maxWidth: '46ch' }}>
              {isSearching ? t('library.results.none.body') : t('library.custom.empty')}
            </p>
            <button type="button" className="btn btn--primary" onClick={() => openCustomForm(trimmedQuery)}>
              <TargetIcon size={18} />
              {isSearching
                ? t('library.results.none.custom', { query: trimmedQuery })
                : t('library.addCustom')}
            </button>
          </div>
        ) : (
          <ul className="food-list">
              {entries.map((entry) => {
                const nutrition = entryNutrition(entry)
                const detail = entryDetail(entry, locale)
                return (
                  <li
                    key={entry.kind === 'custom' ? `custom:${entry.food.id}` : entry.food.id}
                    className={`food-item${entry.kind === 'custom' ? ' food-item--custom' : ''}`}
                    data-kind={entry.kind}
                  >
                    <button
                      type="button"
                      className="food-item__main"
                      onClick={() => logEntry(entry)}
                      aria-label={t('library.logNamed', { name: entryName(entry, locale) })}
                    >
                      <span className="food-item__title">
                        <span className="food-item__name">{entryName(entry, locale)}</span>
                        {entry.kind === 'custom' ? (
                          <span className="badge badge--brand">{t('library.custom.badge')}</span>
                        ) : null}
                      </span>
                      <span className="food-item__meta text-sm text-muted">
                        {entryServing(entry, t)}
                        {detail ? ` · ${detail}` : ''}
                      </span>
                    </button>

                    <span className="food-item__nutrition numeric text-sm">
                      {t('library.kcal', { value: formatNumber(nutrition.kcal, locale) })}
                      <span className="text-soft">
                        {' · '}
                        {t('library.macros', {
                          protein: formatNumber(nutrition.protein, locale),
                          carbs: formatNumber(nutrition.carbs, locale),
                          fat: formatNumber(nutrition.fat, locale),
                        })}
                      </span>
                    </span>

                    <span className="food-item__actions">
                      {entry.kind === 'custom' ? (
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => void handleRemove(entry.food as CustomFood)}
                          aria-label={t('library.custom.remove', { name: entry.food.name })}
                        >
                          <TrashIcon size={16} />
                        </button>
                      ) : null}
                      <button type="button" className="btn btn--outline btn--sm" onClick={() => logEntry(entry)}>
                        {t('library.log')}
                      </button>
                    </span>
                  </li>
                )
              })}
          </ul>
        )}
      </section>

      <CustomFoodModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        initialName={customSeed}
        onSaved={() => setFilter(ALL_FILTER)}
      />
    </div>
  )
}
