import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { Button } from './Button'

/** Shimmering placeholder — always prefer this to a spinner for content that has shape. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-white/5',
        'after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r',
        'after:from-transparent after:via-white/60 after:to-transparent dark:after:via-white/10',
        className,
      )}
      aria-hidden="true"
    />
  )
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn('glass space-y-4 rounded-card p-6', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton className="h-72" />
    </div>
  )
}

/**
 * Empty states are a feature, not an error. Every one of them names the next action,
 * because an empty screen with no way forward is the fastest way to lose someone.
 */
export function EmptyState({ emoji = '✨', title, description, action, onAction, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-100 to-blush-100 text-4xl dark:from-brand-500/15 dark:to-blush-500/15"
      >
        <span aria-hidden="true">{emoji}</span>
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && (
        <Button onClick={onAction} className="mt-6">
          {action}
        </Button>
      )}
    </motion.div>
  )
}

/** Small coloured pill: priority, difficulty, status, module. */
export function Badge({ children, tone = 'slate', className }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    blush: 'bg-blush-100 text-blush-700 dark:bg-blush-500/15 dark:text-blush-300',
    mint: 'bg-mint-100 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
