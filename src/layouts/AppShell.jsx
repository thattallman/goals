import { Suspense, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Briefcase,
  CalendarCheck,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  Moon,
  Settings,
  Sun,
  User,
  Heart,
  Sparkles,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useRealtimeSync } from '../hooks/useRealtimeSync'
import { useActivity, useCoupleProgress } from '../hooks/useProgress'
import { Avatar } from '../components/ui/Avatar'
import { PageSkeleton } from '../components/ui/Feedback'
import { levelFromXp } from '../lib/gamification'
import { relativeTime, greeting } from '../lib/format'
import { isDemo } from '../data'
import { DemoBadge } from '../components/DemoBadge'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/daily', label: 'Daily Goals', icon: CalendarCheck },
  { to: '/health', label: 'Health', icon: HeartPulse },
  { to: '/career', label: 'Career', icon: Briefcase },
  { to: '/reports', label: 'Weekly Report', icon: LineChart },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Mobile gets the five things you actually tap every day. */
const MOBILE_NAV = NAV.filter((item) =>
  ['/', '/daily', '/health', '/career', '/insights'].includes(item.to),
)

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'text-brand-700 dark:text-white'
            : 'text-slate-500 hover:bg-slate-500/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Shared layout id: the pill slides between items instead of blinking. */}
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="absolute inset-0 rounded-xl bg-brand-100 dark:bg-brand-500/15"
            />
          )}
          <item.icon className="relative size-[18px]" aria-hidden="true" />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { activity } = useActivity(8)
  const { yourStreak } = useCoupleProgress()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-500/10 dark:text-slate-400 dark:hover:bg-white/10"
      >
        <Bell className="size-5" />
        {activity.length > 0 && (
          <span className="absolute top-2 right-2 size-2 rounded-full bg-blush-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              className="glass absolute right-0 z-40 mt-2 w-80 rounded-2xl p-2 shadow-lift"
            >
              <p className="px-3 py-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Notifications
              </p>

              {yourStreak >= 3 && (
                <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                  <span className="text-lg">🔥</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You're on a <strong>{yourStreak} day streak</strong>. Don't break it today!
                  </p>
                </div>
              )}

              {activity.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Nothing yet — complete a goal to get things moving.
                </p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5">
                    <span className="mt-0.5 text-lg">🎉</span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{item.message}</p>
                      <p className="text-xs text-slate-400">{relativeTime(item.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ThemeToggle() {
  const { resolved, setTheme } = useTheme()
  const dark = resolved === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-500/10 dark:text-slate-400 dark:hover:bg-white/10"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {dark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

/**
 * The frame every signed-in page renders inside: sidebar on desktop, bottom nav on
 * mobile, and the realtime subscription that keeps both partners in sync.
 */
export function AppShell() {
  const { profile, partner } = useAuth()
  const location = useLocation()
  useRealtimeSync()

  const level = levelFromXp(profile?.xp ?? 0)

  return (
    <div className="aurora min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* ---------------------------------------------------------- sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/70 bg-white/60 px-4 py-6 backdrop-blur-xl lg:flex dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-blush-500 text-white shadow-glow">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            TogetherGoals
          </span>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        {isDemo && <DemoBadge />}

        <div className="glass mt-4 flex items-center gap-3 rounded-2xl p-3">
          <Avatar name={profile?.name} src={profile?.avatar_url} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {profile?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Level {level}</p>
          </div>
        </div>
      </aside>

      {/* ----------------------------------------------------------- topbar */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-xl sm:px-8 dark:border-white/5 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-blush-500 text-white">
              <Heart className="size-4 fill-current" aria-hidden="true" />
            </span>
            <span className="font-bold text-slate-900 dark:text-white">TogetherGoals</span>
          </div>

          <p className="ml-auto hidden text-sm text-slate-500 sm:block dark:text-slate-400">
            {greeting()}, <span className="font-semibold text-slate-800 dark:text-slate-100">{profile?.name}</span>
          </p>

          <div className="ml-auto flex items-center gap-1 sm:ml-2">
            <ThemeToggle />
            <NotificationBell />
            <NavLink to="/profile" aria-label="Your profile" className="ml-1">
              <Avatar name={profile?.name} src={profile?.avatar_url} size="sm" ring />
            </NavLink>
            {partner && (
              <NavLink to="/insights" aria-label={`${partner.name}'s progress`} className="-ml-2">
                <Avatar name={partner.name} src={partner.avatar_url} size="sm" ring />
              </NavLink>
            )}
          </div>
        </header>

        {/* ------------------------------------------------------------ page */}
        <main id="main" className="mx-auto max-w-7xl px-4 pt-8 pb-28 sm:px-8 lg:pb-12">
          <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* ------------------------------------------------------- bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden dark:border-white/5 dark:bg-slate-900/85"
      >
        <ul className="flex items-stretch justify-around">
          {MOBILE_NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                    isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-slate-400 dark:text-slate-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.span
                      animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <item.icon className="size-5" aria-hidden="true" />
                    </motion.span>
                    {item.label.split(' ')[0]}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default AppShell
