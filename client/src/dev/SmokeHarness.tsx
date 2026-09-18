/**
 * Mount harness used by `tests/smoke.mjs` (see npm run test:smoke).
 *
 * It is the same provider tree as `main.tsx`, but with a MemoryRouter so the
 * test can drive navigation without a browser history. Keep the two trees in
 * step: a provider added to the app but missed here will throw at runtime
 * ("useX must be used inside <XProvider>"). It is never imported by the
 * application bundle — Vite only builds it on demand for the smoke test.
 */
import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EntriesProvider } from '@/lib/entries'
import { FoodLogProvider } from '@/components/food/FoodLogProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { I18nProvider } from '@/i18n'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'

export function mount(container: HTMLElement, initialPath: string): Root {
  const root = createRoot(container)
  root.render(
    <StrictMode>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <EntriesProvider>
                <FoodLogProvider>
                  <MemoryRouter initialEntries={[initialPath]}>
                    <ErrorBoundary>
                      <App />
                    </ErrorBoundary>
                  </MemoryRouter>
                </FoodLogProvider>
              </EntriesProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </StrictMode>,
  )
  return root
}
