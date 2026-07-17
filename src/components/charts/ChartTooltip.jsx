import { cn } from '../../lib/cn'

/**
 * Shared tooltip for every Recharts surface.
 *
 * The value text always wears an ink token, never the series colour — the swatch beside
 * it carries identity. That keeps small text readable at any contrast.
 */
export function ChartTooltip({ active, payload, label, suffix = '%', labelFormatter }) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass rounded-xl px-3 py-2 shadow-lift">
      <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: entry.color ?? entry.fill }}
              aria-hidden="true"
            />
            <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-900 dark:text-white">
              {Math.round(entry.value)}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Legend rendered as plain text + swatches, so identity is never colour-alone. */
export function ChartLegend({ items, className }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs font-medium">
          <span
            className="size-2.5 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
          {item.value !== undefined && (
            <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
              {item.value}%
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
