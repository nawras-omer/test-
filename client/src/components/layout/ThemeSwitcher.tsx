import { Dropdown } from '@/components/ui/Dropdown'
import { CheckIcon, MoonIcon, PaletteIcon, SunIcon } from '@/components/ui/Icons'
import { useTheme } from '@/lib/theme'
import { useI18n } from '@/i18n'

/**
 * Palette + light/dark switcher. Both write CSS variables on <html>, so the
 * entire UI (including RTL layouts) restyles without a reload.
 */
export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { palette, mode, palettes, setPalette, setMode } = useTheme()
  const { t } = useI18n()

  return (
    <Dropdown
      wide
      menuLabel={t('theme.open')}
      trigger={({ open, toggle }) => (
        <button type="button" className="icon-btn icon-btn--bordered" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
          <PaletteIcon size={19} />
          {!compact && <span className="icon-btn__label">{t('theme.title')}</span>}
        </button>
      )}
    >
      {() => (
        <>
          <p className="dropdown__label">{t('theme.mode')}</p>
          <div className="segmented" role="group" aria-label={t('theme.mode')}>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={mode === 'light'}
              onClick={() => setMode('light')}
            >
              <SunIcon size={16} />
              {t('theme.mode.light')}
            </button>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={mode === 'dark'}
              onClick={() => setMode('dark')}
            >
              <MoonIcon size={16} />
              {t('theme.mode.dark')}
            </button>
          </div>

          <p className="dropdown__label" style={{ marginTop: 'var(--space-3)' }}>
            {t('theme.palette')}
          </p>
          <div className="palette-grid">
            {palettes.map((item) => {
              const active = item.id === palette
              return (
                <button
                  key={item.id}
                  type="button"
                  className="palette-option"
                  aria-pressed={active}
                  onClick={() => setPalette(item.id)}
                >
                  <span className="palette-option__swatch" style={{ '--swatch-gradient': item.swatch } as React.CSSProperties}>
                    {active && (
                      <span className="palette-option__check">
                        <CheckIcon size={10} />
                      </span>
                    )}
                  </span>
                  <span className="palette-option__label">
                    {t(item.labelKey)}
                    <span className="palette-option__sub">{t(item.descriptionKey)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </Dropdown>
  )
}
