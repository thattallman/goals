import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

/** Standard entrance for every card on a page — staggered by the parent list. */
export const cardMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 26 },
}

export function Card({ className, children, hover = false, as: Tag = motion.section, ...props }) {
  return (
    <Tag
      className={cn(
        'glass rounded-card p-6 shadow-soft transition-shadow',
        hover && 'hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, icon: Icon, action, className }) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

/** Wrap a grid of cards to get a gentle cascade instead of everything popping at once. */
export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export default Card
