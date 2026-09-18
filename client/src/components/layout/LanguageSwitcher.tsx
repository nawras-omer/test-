import { Dropdown } from '@/components/ui/Dropdown'
import { CheckIcon, GlobeIcon } from '@/components/ui/Icons'
import { useI18n } from '@/i18n'

/**
 * Language switcher — shows each language in its own script (endonyms) and
 * flips the document direction the moment you pick one.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, locales, setLocale, t } = useI18n()

  return (
    <Dropdown
      menuLabel={t('language.label')}
      trigger={({ open, toggle }) => (
        <button type="button" className="lang-trigger" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
          <GlobeIcon size={18} />
          {!compact && <span className="lang-trigger__code">{locale.toUpperCase()}</span>}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <p className="dropdown__label">{t('language.switch')}</p>
          {locales.map((item) => {
            const active = item.code === locale
            return (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={active ? 'dropdown__item dropdown__item--active' : 'dropdown__item'}
                lang={item.code}
                onClick={() => {
                  setLocale(item.code)
                  close()
                }}
              >
                <span className="dropdown__item-text">
                  <span className="lang-item__native">{item.native}</span>
                  <span className="lang-item__name">
                    {item.english} · {item.dir.toUpperCase()}
                  </span>
                </span>
                {active && <CheckIcon size={16} style={{ marginInlineStart: 'auto' }} />}
              </button>
            )
          })}
        </>
      )}
    </Dropdown>
  )
}
