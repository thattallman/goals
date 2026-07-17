import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, Trophy, X, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/cn'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  achievement: Trophy,
}

const TONE = {
  success: 'text-mint-600 bg-mint-100 dark:bg-mint-500/15 dark:text-mint-300',
  error: 'text-red-600 bg-red-100 dark:bg-red-500/15 dark:text-red-300',
  info: 'text-brand-600 bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300',
  achievement: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300',
}

/**
 * In-app notifications. Also the delivery surface for streak, milestone and
 * partner-completed alerts — see NotificationCenter.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type, message, options = {}) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev.slice(-3), { id, type, message, ...options }])
      timers.current.set(id, setTimeout(() => dismiss(id), options.duration ?? 4000))
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
      achievement: (message, options) => push('achievement', message, { duration: 6000, ...options }),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Bottom-centre on mobile (above the nav bar), top-right on desktop. */}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:top-4 sm:right-4 sm:left-auto sm:items-end sm:px-0"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] ?? Info
            return (
              <motion.div
                key={toast.id}
                layout
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3 shadow-lift"
              >
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE[toast.type])}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  {toast.title && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
