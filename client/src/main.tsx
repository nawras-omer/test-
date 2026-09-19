import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './lib/auth'
import { EntriesProvider } from './lib/entries'
import { CustomFoodsProvider } from './lib/customFoods'
import { FoodLogProvider } from './components/food/FoodLogProvider'
import { AssistantProvider } from './lib/assistant/AssistantProvider'
import { ThemeProvider } from './lib/theme'
import { I18nProvider } from './i18n'

// Order matters: tokens define the variables every later sheet consumes.
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root is missing from index.html')

createRoot(container).render(
  <StrictMode>
    {/* Theme + language are device-level concerns; auth sits inside them so a
        restored session can apply the user's saved preferences. */}
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            {/* Diary state + the single food-logging dialog sit just below auth so
                every screen shares the same live data. */}
            <EntriesProvider>
              <CustomFoodsProvider>
                {/* The assistant reads the diary + custom foods, so it sits
                    inside both; the chat transcript outlives navigation. */}
                <AssistantProvider>
                  <FoodLogProvider>
                  <BrowserRouter>
                    <ErrorBoundary>
                      <App />
                    </ErrorBoundary>
                  </BrowserRouter>
                </FoodLogProvider>
                </AssistantProvider>
              </CustomFoodsProvider>
            </EntriesProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
