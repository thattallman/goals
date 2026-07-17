import { motion } from 'framer-motion'

/** Consistent page title block: emoji, title, subtitle, and a stat or two on the right. */
export function PageHeader({ emoji, title, subtitle, stat, partnerStat, action }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        {emoji && (
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-blush-100 text-2xl dark:from-brand-500/15 dark:to-blush-500/15"
            aria-hidden="true"
          >
            {emoji}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {[stat, partnerStat].filter(Boolean).map((item, i) => (
          <div
            key={item.label}
            className="glass min-w-24 rounded-2xl px-4 py-2.5 text-center shadow-soft"
          >
            <p className="text-xs font-medium text-slate-400">{item.label}</p>
            <p
              className={
                i === 0
                  ? 'text-xl font-bold tabular-nums text-brand-600 dark:text-brand-400'
                  : 'text-xl font-bold tabular-nums text-blush-600 dark:text-blush-400'
              }
            >
              {item.value}
            </p>
          </div>
        ))}
        {action}
      </div>
    </motion.header>
  )
}

export default PageHeader
