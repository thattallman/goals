import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from './theme'
import { ChartLegend, ChartTooltip } from './ChartTooltip'

/** Shape of both partners across every module — where you complement each other. */
export function RadarCompare({ data = [], hasPartner }) {
  const theme = useChartTheme()

  return (
    <div>
      <ChartLegend
        className="mb-2"
        items={[
          { label: 'You', color: theme.series.you },
          ...(hasPartner ? [{ label: 'Partner', color: theme.series.partner }] : []),
        ]}
      />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={theme.grid} />
            <PolarAngleAxis dataKey="label" tick={{ fill: theme.axis, fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Radar
              name="You"
              dataKey="you"
              stroke={theme.series.you}
              strokeWidth={2}
              fill={theme.series.you}
              fillOpacity={0.18}
            />
            {hasPartner && (
              <Radar
                name="Partner"
                dataKey="partner"
                stroke={theme.series.partner}
                strokeWidth={2}
                fill={theme.series.partner}
                fillOpacity={0.14}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Side-by-side bars per category. Rounded data-ends, 2px gap between the pair. */
export function BarCompare({ data = [], hasPartner }) {
  const theme = useChartTheme()

  return (
    <div>
      <ChartLegend
        className="mb-4"
        items={[
          { label: 'You', color: theme.series.you },
          ...(hasPartner ? [{ label: 'Partner', color: theme.series.partner }] : []),
        ]}
      />
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="label"
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
            <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.grid }} />
            <Bar dataKey="you" name="You" fill={theme.series.you} radius={[4, 4, 0, 0]} maxBarSize={26} />
            {hasPartner && (
              <Bar
                dataKey="partner"
                name="Partner"
                fill={theme.series.partner}
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Where your effort actually goes. A donut, because the parts sum to a whole. */
export function CategoryDonut({ data = [] }) {
  const theme = useChartTheme()
  // One hue, stepped — this is a magnitude split, not five independent identities.
  const palette = theme.heat.slice().reverse()
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke={theme.surface}
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip suffix="" />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2">
        {data.map((entry, i) => (
          <li key={entry.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: palette[i % palette.length] }}
              aria-hidden="true"
            />
            <span className="text-slate-600 dark:text-slate-300">{entry.label}</span>
            <span className="ml-auto tabular-nums font-semibold text-slate-900 dark:text-white">
              {total ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Month-over-month trend — is the couple trending up? */
export function MonthlyTrend({ data = [], hasPartner }) {
  const theme = useChartTheme()

  return (
    <div>
      <ChartLegend
        className="mb-4"
        items={[
          { label: 'You', color: theme.series.you },
          ...(hasPartner ? [{ label: 'Partner', color: theme.series.partner }] : []),
        ]}
      />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="label"
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
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: theme.axis, strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="you"
              name="You"
              stroke={theme.series.you}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            />
            {hasPartner && (
              <Line
                type="monotone"
                dataKey="partner"
                name="Partner"
                stroke={theme.series.partner}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
