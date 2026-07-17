import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import { ErrorBoundary } from './ErrorBoundary'
import { AppShell } from '../layouts/AppShell'
import { AuthLayout } from '../layouts/AuthLayout'
import { PageSkeleton } from '../components/ui/Feedback'

// Every page is code-split: the dashboard shouldn't have to ship Recharts to the
// login screen.
const Dashboard = lazy(() => import('../pages/Dashboard'))
const DailyGoals = lazy(() => import('../pages/DailyGoals'))
const Health = lazy(() => import('../pages/Health'))
const Career = lazy(() => import('../pages/Career'))
const WeeklyReport = lazy(() => import('../pages/WeeklyReport'))
const Insights = lazy(() => import('../pages/Insights'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const Connect = lazy(() => import('../pages/Connect'))
const Login = lazy(() => import('../pages/Login'))
const Signup = lazy(() => import('../pages/Signup'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/ResetPassword'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Realtime pushes changes to us, so aggressive refetching is wasted work.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/** A full-screen wait while we work out who you are — before any route decides anything. */
function Booting() {
  return (
    <div className="aurora grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-14 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-blush-500 text-2xl text-white shadow-glow">
          ❤️
        </span>
        <p className="text-sm font-medium text-slate-400">Getting things ready…</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Booting />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/** You can't use the app without a couple — pairing is the first thing that happens. */
function RequireCouple({ children }) {
  const { couple, loading } = useAuth()
  if (loading) return <Booting />
  if (!couple) return <Navigate to="/connect" replace />
  return children
}

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* ------------------------------------------------------- public */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ------------------------------------------------------ pairing */}
        <Route
          path="/connect"
          element={
            <RequireAuth>
              <Connect />
            </RequireAuth>
          }
        />

        {/* ---------------------------------------------------- protected */}
        <Route
          element={
            <RequireAuth>
              <RequireCouple>
                <AppShell />
              </RequireCouple>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/daily" element={<DailyGoals />} />
          <Route path="/health" element={<Health />} />
          <Route path="/career" element={<Career />} />
          <Route path="/reports" element={<WeeklyReport />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
