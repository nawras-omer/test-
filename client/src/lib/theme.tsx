/* eslint-disable react-refresh/only-export-components */
/**
 * Customisable theme system.
 *
 * The provider writes two attributes onto <html>:
 *   data-palette="green|blue|purple|warm"   data-mode="light|dark"
 * Every colour in the UI is a CSS variable derived from those two attributes
 * (see styles/tokens.css), so switching is instant, needs no re-render of the
 * tree, and works identically in LTR and RTL.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ColorMode, Palette, UserPreferences } from '@/types'
import type { TranslationKey } from '@/i18n'

export interface PaletteMeta {
  id: Palette
  labelKey: TranslationKey
  descriptionKey: TranslationKey
  /** Literal colours (not vars) so a swatch previews its palette even while another is active. */
  swatch: string
}

export const PALETTES: PaletteMeta[] = [
  {
    id: 'green',
    labelKey: 'theme.palette.green',
    descriptionKey: 'theme.palette.green.desc',
    swatch: 'linear-gradient(135deg, hsl(160 64% 40%), hsl(174 62% 34%))',
  },
  {
    id: 'blue',
    labelKey: 'theme.palette.blue',
    descriptionKey: 'theme.palette.blue.desc',
    swatch: 'linear-gradient(135deg, hsl(214 78% 46%), hsl(190 82% 42%))',
  },
  {
    id: 'purple',
    labelKey: 'theme.palette.purple',
    descriptionKey: 'theme.palette.purple.desc',
    swatch: 'linear-gradient(135deg, hsl(268 62% 52%), hsl(316 66% 52%))',
  },
  {
    id: 'warm',
    labelKey: 'theme.palette.warm',
    descriptionKey: 'theme.palette.warm.desc',
    swatch: 'linear-gradient(135deg, hsl(20 68% 47%), hsl(38 80% 48%))',
  },
]

export const DEFAULT_PALETTE: Palette = 'green'
export const DEFAULT_MODE: ColorMode = 'light'
const STORAGE_KEY = 'kalori.theme'

interface ThemeState {
  palette: Palette
  mode: ColorMode
}

function isPalette(value: unknown): value is Palette {
  return value === 'green' || value === 'blue' || value === 'purple' || value === 'warm'
}

function readStoredTheme(): Partial<ThemeState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<ThemeState>
    return {
      palette: isPalette(parsed.palette) ? parsed.palette : undefined,
      mode: parsed.mode === 'dark' || parsed.mode === 'light' ? parsed.mode : undefined,
    }
  } catch {
    return {}
  }
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

interface ThemeContextValue extends ThemeState {
  palettes: PaletteMeta[]
  setPalette: (palette: Palette) => void
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
  /** Applies language-agnostic user preferences coming from the API. */
  applyPreferences: (preferences: Partial<UserPreferences>) => void
  reset: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  initialPalette,
  initialMode,
}: {
  children: ReactNode
  initialPalette?: Palette
  initialMode?: ColorMode
}) {
  const [state, setState] = useState<ThemeState>(() => {
    const stored = readStoredTheme()
    return {
      palette: initialPalette ?? stored.palette ?? DEFAULT_PALETTE,
      // With nothing stored, respect the OS setting once, then remember the choice.
      mode: initialMode ?? stored.mode ?? (prefersDark() ? 'dark' : DEFAULT_MODE),
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.palette = state.palette
    root.dataset.mode = state.mode

    // Keep the mobile browser chrome in step with the active palette.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute(
        'content',
        state.mode === 'dark' ? '#12161a' : '#ffffff',
      )
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const setPalette = useCallback((palette: Palette) => {
    setState((prev) => (prev.palette === palette ? prev : { ...prev, palette }))
  }, [])

  const setMode = useCallback((mode: ColorMode) => {
    setState((prev) => (prev.mode === mode ? prev : { ...prev, mode }))
  }, [])

  const toggleMode = useCallback(() => {
    setState((prev) => ({ ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' }))
  }, [])

  const applyPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    setState((prev) => ({
      palette: isPalette(preferences.palette) ? preferences.palette : prev.palette,
      mode:
        preferences.colorMode === 'dark' || preferences.colorMode === 'light'
          ? preferences.colorMode
          : prev.mode,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({ palette: DEFAULT_PALETTE, mode: DEFAULT_MODE })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      palettes: PALETTES,
      setPalette,
      setMode,
      toggleMode,
      applyPreferences,
      reset,
    }),
    [state, setPalette, setMode, toggleMode, applyPreferences, reset],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
