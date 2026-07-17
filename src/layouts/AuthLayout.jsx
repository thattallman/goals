import { Outlet, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isDemo } from '../data'

const HIGHLIGHTS = [
  { emoji: '🔥', title: 'Streaks that stick', copy: 'Show up together and watch the flame grow.' },
  { emoji: '📊', title: 'Progress you can see', copy: 'Rings, heatmaps and weekly reports for both of you.' },
  { emoji: '❤️', title: 'Never a competition', copy: "When one of you dips, the other says: let's catch up together." },
]

/** Split screen: warm marketing panel on the left, the form on the right. */
export function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* --------------------------------------------------------- pitch */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-blush-600 p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(40rem 30rem at 20% 20%, rgba(255,255,255,.25), transparent 60%), radial-gradient(30rem 30rem at 80% 80%, rgba(16,185,129,.35), transparent 60%)',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-2.5 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">TogetherGoals</span>
        </div>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-4xl leading-tight font-bold text-white"
          >
            Two people. One set of goals. Every single day.
          </motion.h1>
          <p className="mt-4 max-w-sm text-white/70">
            Track habits, health and careers side by side — and celebrate the wins together.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/70">{item.copy}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          {isDemo ? 'Running in demo mode — no account needed.' : 'Secured by Firebase.'}
        </p>
      </div>

      {/* ---------------------------------------------------------- form */}
      <div className="aurora flex items-center justify-center px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-blush-500 text-white shadow-glow">
              <Heart className="size-5 fill-current" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">TogetherGoals</span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}

export default AuthLayout
