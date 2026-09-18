import { GoalsCard } from '@/components/settings/GoalsCard'
import { MoonIcon, PaletteIcon, SunIcon, GlobeIcon, CheckIcon, InfoIcon } from '@/components/ui/Icons'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/i18n'

/**
 * Settings — the theme and language sections are fully functional in this
 * foundation build; the profile/goal sections are placeholders.
 */
export function SettingsPage() {
  const { t, locales, locale, setLocale, meta } = useI18n()
  const { palette, mode, palettes, setPalette, setMode } = useTheme()
  const { user } = useAuth()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">{t('nav.settings')}</p>
          <h1 className="page__title">{t('pages.settings.title')}</h1>
          <p className="page__subtitle">{t('pages.settings.subtitle')}</p>
        </div>
      </header>

      <div className="grid-2">
        {/* ------------------------------------------------ appearance -- */}
        <section className="card card--pad">
          <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span className="stat__icon" aria-hidden="true">
              <PaletteIcon size={19} />
            </span>
            <div>
              <h2 className="card__title">{t('settings.appearance.title')}</h2>
              <p className="card__subtitle">{t('settings.appearance.body')}</p>
            </div>
          </div>

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

          <p className="dropdown__label" style={{ paddingInline: 0, marginTop: 'var(--space-4)' }}>
            {t('theme.palette')}
          </p>

          <div className="palette-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {palettes.map((item) => {
              const active = item.id === palette
              return (
                <button
                  type="button"
                  key={item.id}
                  className="palette-option"
                  aria-pressed={active}
                  onClick={() => setPalette(item.id)}
                >
                  <span
                    className="palette-option__swatch"
                    style={{ ['--swatch-gradient' as string]: item.swatch }}
                    aria-hidden="true"
                  >
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
        </section>

        {/* -------------------------------------------------- language -- */}
        <section className="card card--pad">
          <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span className="stat__icon stat__icon--accent" aria-hidden="true">
              <GlobeIcon size={19} />
            </span>
            <div>
              <h2 className="card__title">{t('settings.language.title')}</h2>
              <p className="card__subtitle">{t('settings.language.body')}</p>
            </div>
          </div>

          <div className="dropdown__label" style={{ paddingInline: 0 }}>
            {t('language.label')}
          </div>
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            {locales.map((item) => {
              const active = item.code === locale
              return (
                <button
                  type="button"
                  key={item.code}
                  className="palette-option"
                  aria-pressed={active}
                  lang={item.code}
                  onClick={() => setLocale(item.code)}
                >
                  <span className="palette-option__label">
                    <span className="lang-item__native">{item.native}</span>
                    <span className="palette-option__sub">
                      {item.english} · {item.dir.toUpperCase()}
                    </span>
                  </span>
                  {active && <CheckIcon size={16} style={{ marginInlineStart: 'auto' }} />}
                </button>
              )
            })}
          </div>

          <p className="field__hint" style={{ marginTop: 'var(--space-4)' }}>
            {t('settings.language.current', {
              dir: t(meta.dir === 'rtl' ? 'settings.dir.RTL' : 'settings.dir.LTR'),
              name: meta.native,
            })}
          </p>
        </section>

        {/* ------------------------------------------------------ goals -- */}
        <GoalsCard />

        {/* ----------------------------------------------------- about -- */}
        <section className="card card--pad">
          <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span className="stat__icon" aria-hidden="true">
              <InfoIcon size={19} />
            </span>
            <div>
              <h2 className="card__title">{t('settings.about.title')}</h2>
              <p className="card__subtitle">{t('settings.about.body')}</p>
            </div>
          </div>

          <ul className="stack" style={{ gap: 'var(--space-2)' }}>
            <li className="row-between text-sm">
              <span className="text-muted">{t('pages.profile.name')}</span>
              <span>{user?.name}</span>
            </li>
            <li className="row-between text-sm">
              <span className="text-muted">{t('pages.profile.email')}</span>
              <span className="numeric">{user?.email}</span>
            </li>
            <li className="row-between text-sm">
              <span className="text-muted">{t('pages.profile.language')}</span>
              <span lang={locale}>{meta.native}</span>
            </li>
            <li className="row-between text-sm">
              <span className="text-muted">{t('pages.profile.theme')}</span>
              <span>{`${t(palettes.find((p) => p.id === palette)?.labelKey ?? 'theme.palette.green')} · ${t(mode === 'dark' ? 'theme.mode.dark' : 'theme.mode.light')}`}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
