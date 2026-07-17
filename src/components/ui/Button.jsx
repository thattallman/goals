import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-brand-600 to-blush-500 text-white shadow-glow hover:brightness-110',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:text-slate-100 dark:border-white/10 dark:hover:bg-white/10',
  ghost:
    'text-slate-600 hover:bg-slate-500/10 dark:text-slate-300 dark:hover:bg-white/10',
  accent: 'bg-mint-500 text-white shadow-soft hover:bg-mint-600',
  danger: 'bg-red-500 text-white shadow-soft hover:bg-red-600',
  outline:
    'border border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
  icon: 'size-10 justify-center',
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className, loading, disabled, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? undefined : { scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center rounded-xl font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  )
})

export default Button
