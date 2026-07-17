import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { shortDay, prettyDate } from '../../lib/format'
import { useChartTheme } from './theme'
import { ChartLegend, ChartTooltip } from './ChartTooltip'

/**
 * The couple's last seven days: your line, your partner's, and the average that belongs
 * to both of you. One y-axis (percent) — the three series are the same measure, which is
 * exactly why they can share a scale.
 */
export function WeeklyLineChart({ yourDaily = [], partnerDaily = [], combinedDaily = [], hasPartner }) {
  const theme = useChartTheme()

  const data = useMemo(() => {
    const last = (arr) => arr.slice(-7)
    const you = last(yourDaily)
    const partner = last(partnerDaily)
    const combined = last(combinedDaily)

    return you.map((day, i) => ({
      date: day.date,
      day: shortDay(day.date),
      you: day.score,
      partner: partner[i]?.score ?? 0,
      combined: combined[i]?.score ?? day.score,
    }))
  }, [yourDaily, partnerDaily, combinedDaily])

  const legend = [
    { label: 'You', color: theme.series.you },
    ...(hasPartner
      ? [
          { label: 'Partner', color: theme.series.partner },
          { label: 'Combined', color: theme.series.combined },
        ]
      : []),
  ]

  return (
    <div>
      <ChartLegend items={legend} className="mb-4" />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              {Object.entries(theme.series).map(([key, color]) => (
                <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.axis, fontSize: 12 }}
            />
            <Tooltip
              content={<ChartTooltip labelFormatter={(day) => day} />}
              cursor={{ stroke: theme.axis, strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="you"
              name="You"
              stroke={theme.series.you}
              strokeWidth={2}
              fill="url(#fill-you)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            />
            {hasPartner && (
              <>
                <Area
                  type="monotone"
                  dataKey="partner"
                  name="Partner"
                  stroke={theme.series.partner}
                  strokeWidth={2}
                  fill="url(#fill-partner)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
                />
                <Area
                  type="monotone"
                  dataKey="combined"
                  name="Combined"
                  stroke={theme.series.combined}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="none"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Text alternative — the numbers are available without reading the colours. */}
      <details className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer font-medium hover:text-slate-700 dark:hover:text-slate-200">
          View as table
        </summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-slate-400">
            <tr>
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 font-medium">You</th>
              {hasPartner && <th className="py-1 font-medium">Partner</th>}
              {hasPartner && <th className="py-1 font-medium">Combined</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((row) => (
              <tr key={row.date} className="border-t border-slate-200/60 dark:border-white/5">
                <td className="py-1">{prettyDate(row.date)}</td>
                <td className="py-1">{row.you}%</td>
                {hasPartner && <td className="py-1">{row.partner}%</td>}
                {hasPartner && <td className="py-1">{row.combined}%</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

export default WeeklyLineChart
