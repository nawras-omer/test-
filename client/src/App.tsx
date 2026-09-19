import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/routes/RouteGuards'
import { AssistantPage } from '@/pages/AssistantPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DiaryPage } from '@/pages/DiaryPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { LoginPage } from '@/pages/LoginPage'
import { MealsPage } from '@/pages/MealsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ProgressPage } from '@/pages/ProgressPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignupPage } from '@/pages/SignupPage'

/**
 * Route map
 *   public   /login · /signup      (redirect away when already signed in)
 *   private  / · /library · /diary · /meals · /progress · /goals · /assistant
 *            · /settings · /profile
 *   fallback *                     (inside the app shell)
 */
export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
