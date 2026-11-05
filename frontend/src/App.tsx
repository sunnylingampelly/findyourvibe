import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ToastProvider } from './components/ui/Toast'
import { useAuthStore } from './stores/authStore'
import ErrorBoundary from './components/ui/ErrorBoundary'
import api from './api/client'

// Auth pages
import WelcomePage from './pages/auth/WelcomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage'

// User app
import DiscoverPage from './pages/discover/DiscoverPage'
import SwipePage from './pages/discover/SwipePage'
import ProfileDetailPage from './pages/discover/ProfileDetailPage'
import SavedProfilesPage from './pages/discover/SavedProfilesPage'
import ConnectionsPage from './pages/connections/ConnectionsPage'
import MessagesPage from './pages/messages/MessagesPage'
import ChatPage from './pages/messages/ChatPage'
import ProfilePage from './pages/profile/ProfilePage'
import EditProfilePage from './pages/profile/EditProfilePage'
import CompanionApplyPage from './pages/companion/CompanionApplyPage'

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import CompanionsPage from './pages/admin/CompanionsPage'
import ReportsPage from './pages/admin/ReportsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import ServicesPage from './pages/admin/ServicesPage'
import SettingsPage from './pages/admin/SettingsPage'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />
  if (!isAdmin()) return <Navigate to="/discover" replace />
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuthStore()
  const needsCheck = !!(user && !user.onboarding_completed_at)

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me'),
    enabled: needsCheck,
    staleTime: 0,
    retry: false,
  })

  useEffect(() => {
    if (data?.data?.data) setUser(data.data.data)
  }, [data, setUser])

  if (needsCheck && isLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-dvh bg-[#FAF9F6]">
        <div className="text-[#236B63] text-sm font-medium animate-pulse">Loading…</div>
      </div>
    )
  }

  const done = user?.onboarding_completed_at || data?.data?.data?.onboarding_completed_at
  if (user && !done) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

            {/* Protected user app */}
            <Route path="/discover" element={<RequireAuth><RequireOnboarding><DiscoverPage /></RequireOnboarding></RequireAuth>} />
            <Route path="/swipe" element={<RequireAuth><RequireOnboarding><SwipePage /></RequireOnboarding></RequireAuth>} />
            <Route path="/profiles/:id" element={<RequireAuth><ProfileDetailPage /></RequireAuth>} />
            <Route path="/saved" element={<RequireAuth><SavedProfilesPage /></RequireAuth>} />
            <Route path="/connections" element={<RequireAuth><RequireOnboarding><ConnectionsPage /></RequireOnboarding></RequireAuth>} />
            <Route path="/messages" element={<RequireAuth><RequireOnboarding><MessagesPage /></RequireOnboarding></RequireAuth>} />
            <Route path="/messages/:id" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><RequireOnboarding><ProfilePage /></RequireOnboarding></RequireAuth>} />
            <Route path="/profile/edit" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
            <Route path="/companion/apply" element={<RequireAuth><CompanionApplyPage /></RequireAuth>} />
            <Route path="/companion/status" element={<RequireAuth><CompanionApplyPage /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
            <Route path="/admin/companions" element={<RequireAdmin><CompanionsPage /></RequireAdmin>} />
            <Route path="/admin/services" element={<RequireAdmin><ServicesPage /></RequireAdmin>} />
            <Route path="/admin/reports" element={<RequireAdmin><ReportsPage /></RequireAdmin>} />
            <Route path="/admin/audit-logs" element={<RequireAdmin><AuditLogsPage /></RequireAdmin>} />
            <Route path="/admin/settings" element={<RequireAdmin><SettingsPage /></RequireAdmin>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
