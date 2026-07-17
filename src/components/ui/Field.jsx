import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

const base =
  'w-full rounded-xl border bg-white px-4 text-sm text-slate-900 transition placeholder:text-slate-400 ' +
  'border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 focus:outline-none ' +
  'disabled:opacity-60 dark:bg-white/5 dark:text-white dark:border-white/10 dark:placeholder:text-slate-500'

/**
 * Label + control + error, wired together with matching ids so screen readers announce
 * the error with the field. All three form controls share it.
 */
function Wrapper({ id, label, error, hint, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
          {required && <span className="ml-0.5 text-blush-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-500">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input(
  { label, error, hint, className, required, icon: Icon, ...props },
  ref,
) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(base, 'h-11', Icon && 'pl-10', error && 'border-red-400', className)}
          {...props}
        />
      </div>
    </Wrapper>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, required, rows = 3, ...props },
  ref,
) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(base, 'resize-y py-3', error && 'border-red-400', className)}
        {...props}
      />
    </Wrapper>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, className, required, options = [], ...props },
  ref,
) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(base, 'h-11 appearance-none pr-9', error && 'border-red-400', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath d='M5.5 7.5 10 12l4.5-4.5'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.1rem',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Wrapper>
  )
})

/** Accessible switch used across Settings. */
export function Toggle({ checked, onChange, label, description, id: providedId }) {
  const autoId = useId()
  const id = providedId ?? autoId
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-slate-800 dark:text-slate-100">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}
