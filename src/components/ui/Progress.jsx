import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

/** Horizontal bar. Animates from its previous width, not from zero, on updates. */
export function ProgressBar({ value = 0, className, tone = 'brand', showLabel = false, label }) {
  const tones = {
    brand: 'from-brand-600 to-blush-500',
    mint: 'from-mint-500 to-mint-300',
    blush: 'from-blush-500 to-orange-400',
    amber: 'from-amber-500 to-orange-400',
  }
  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">{label}</span>
          <span className="tabular-nums text-slate-700 dark:text-slate-200">{value}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10"
      >
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', tones[tone])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </div>
    </div>
  )
}

/**
 * The dashboard's signature element: an animated SVG ring. Draws itself by animating
 * strokeDashoffset, which is GPU-cheap and reads as the ring "filling up".
 */
export function ProgressRing({
  value = 0,
  size = 132,
  stroke = 11,
  gradient = ['#7C3AED', '#EC4899'],
  label,
  sublabel,
  delay = 0,
  id,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const gradientId = `ring-${id ?? label ?? 'g'}`.replace(/\s+/g, '-').toLowerCase()

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${clamped}%`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className="stroke-slate-200/80 dark:stroke-white/10"
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={clamped}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring', stiffness: 300, damping: 20 }}
            className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white"
          >
            {clamped}%
          </motion.span>
          {sublabel && (
            <span className="text-[11px] font-medium text-slate-400">{sublabel}</span>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  )
}

export default ProgressBar
