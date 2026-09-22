import { useMemo, useState } from 'react'
import { CustomFoodModal } from '@/components/food/CustomFoodModal'
import { Alert } from '@/components/ui/Alert'
import { BookmarkIcon, CloseIcon, PlusIcon, SearchIcon, TargetIcon, TrashIcon } from '@/components/ui/Icons'
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
import { SectionSubNav } from '@/components/layout/SectionSubNav'

const VISIBLE_LIMIT = 60
const FILTERS: LibraryFilter[] = [ALL_FILTER, CUSTOM_FILTER, ...CATEGORIES]

function filterKey(filter: LibraryFilter): TranslationKey {
  return `library.category.${filter}` as TranslationKey
}

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

      <SectionSubNav section="calories" />

      <div className="mnd-page">
        <div className="mnd-container">
          <div className="mnd-header">
            <button className="mnd-header__btn">☰</button>
            <h1>Explore Foods</h1>
            <button className="mnd-header__btn">⚙️</button>
          </div>

          <div className="mnd-search">
            <SearchIcon size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for foods..."
            />
            {isSearching && (
              <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <CloseIcon size={16} />
              </button>
            )}
            <button style={{ background: 'transparent', border: '1px solid #e5e5ea', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer' }}>⚙️</button>
          </div>

          <div className="mnd-tabs">
            <div className={`mnd-tab ${filter === ALL_FILTER ? 'mnd-tab--active' : ''}`} onClick={() => setFilter(ALL_FILTER)}>Explore</div>
            <div className={`mnd-tab ${filter === CUSTOM_FILTER ? 'mnd-tab--active' : ''}`} onClick={() => setFilter(CUSTOM_FILTER)}>Favorites</div>
            <div className="mnd-tab" onClick={() => openCustomForm()}>Custom</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 16px 16px' }}>
            {SEARCH_SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                className="chip chip--ghost"
                onClick={() => {
                  setQuery(t(key))
                  setFilter(ALL_FILTER)
                }}
                style={{ fontSize: '12px' }}
              >
                {t(key)}
              </button>
            ))}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {FILTERS.slice(0, 8).map((value) => {
                const active = filter === value
                return (
                  <button
                    key={value}
                    type="button"
                    className={`category-chip${active ? ' category-chip--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setFilter(value)}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    {value === CUSTOM_FILTER ? <BookmarkIcon size={12} /> : null}
                    {t(filterKey(value))}
                  </button>
                )
              })}
            </div>
          </div>

          {status === 'error' ? <Alert>{t('library.status.error')}</Alert> : null}

          <div className="mnd-food-list">
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>{isSearching ? t('library.results.none.title', { query: trimmedQuery }) : t('library.emptyCategory')}</h3>
                <p style={{ color: '#8e8e93', fontSize: '13px', marginBottom: '16px' }}>{isSearching ? t('library.results.none.body') : t('library.custom.empty')}</p>
                <button type="button" className="btn btn--primary" onClick={() => openCustomForm(trimmedQuery)}>
                  <TargetIcon size={18} />
                  {isSearching ? t('library.results.none.custom', { query: trimmedQuery }) : t('library.addCustom')}
                </button>
              </div>
            ) : (
              entries.map((entry) => {
                const nutrition = entryNutrition(entry)
                const detail = entryDetail(entry, locale)
                const name = entryName(entry, locale)
                return (
                  <div key={entry.kind === 'custom' ? `custom:${entry.food.id}` : entry.food.id} className="mnd-food-card">
                    <div className="mnd-food-card__main">
                      <div className="mnd-food-card__name">{name}</div>
                      <div className="mnd-food-card__cat">{detail || entryServing(entry, t)}</div>
                      <div className="mnd-food-card__macros">
                        <span className="mnd-food-card__macro mnd-food-card__macro--p"><b>P</b> {formatNumber(nutrition.protein, locale)} g</span>
                        <span className="mnd-food-card__macro mnd-food-card__macro--c"><b>C</b> {formatNumber(nutrition.carbs, locale)} g</span>
                        <span className="mnd-food-card__macro mnd-food-card__macro--f"><b>F</b> {formatNumber(nutrition.fat, locale)} g</span>
                      </div>
                    </div>
                    <div className="mnd-food-card__right">
                      <div className="mnd-food-card__kcal">{formatNumber(nutrition.kcal, locale)} <div className="mnd-food-card__kcal-unit">KCAL</div></div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        {entry.kind === 'custom' && (
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            onClick={() => void handleRemove(entry.food as CustomFood)}
                            style={{ width: '36px', height: '36px' }}
                          >
                            <TrashIcon size={16} />
                          </button>
                        )}
                        <button className="mnd-food-card__add" onClick={() => logEntry(entry)}>+</button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '12px', color: '#8e8e93', fontSize: '12px' }}>
            {total > VISIBLE_LIMIT ? `${entries.length} of ${total} foods` : `${total} foods`}
          </div>
        </div>
      </div>

      <CustomFoodModal open={customOpen} onClose={() => setCustomOpen(false)} initialName={customSeed} onSaved={() => setFilter(ALL_FILTER)} />
    </div>
  )
}
