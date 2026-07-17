import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format, getDay, startOfWeek, subDays } from 'date-fns'
import { dateKey, prettyDate } from '../../lib/format'
import { useChartTheme } from './theme'

const WEEKS = 53
const CELL = 12
const GAP = 3

/** Magnitude → one hue, light to dark. Five steps plus an explicit "nothing logged". */
const level = (score) => {
  if (score <= 0) return -1
  if (score < 25) return 0
  if (score < 50) return 1
  if (score < 75) return 2
  if (score < 100) return 3
  return 4
}

/**
 * GitHub-style year heatmap. Built as SVG rather than a chart library because the shape
 * is a fixed grid — 53 weeks × 7 days — and a library would only get in the way.
 */
export function YearHeatmap({ daily = [], title = 'Your year' }) {
  const theme = useChartTheme()
  const [hovered, setHovered] = useState(null)

  const { cells, months } = useMemo(() => {
    const scores = new Map(daily.map((d) => [d.date, d.score]))
    const today = new Date()
    // Align the grid to week columns so rows are always Mon–Sun.
    const start = startOfWeek(subDays(today, WEEKS * 7 - 1), { weekStartsOn: 1 })

    const out = []
    const monthMarks = []
    let lastMonth = null

    for (let week = 0; week < WEEKS; week += 1) {
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(start)
        date.setDate(start.getDate() + week * 7 + day)
        if (date > today) continue

        const key = dateKey(date)
        const score = scores.get(key) ?? 0
        out.push({ key, week, day: (getDay(date) + 6) % 7, score, date })

        const month = format(date, 'MMM')
        if (day === 0 && month !== lastMonth) {
          monthMarks.push({ month, week })
          lastMonth = month
        }
      }
    }
    return { cells: out, months: monthMarks }
  }, [daily])

  const width = WEEKS * (CELL + GAP)
  const height = 7 * (CELL + GAP) + 18

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${title}: daily completion for the last year`}
          className="min-w-full"
        >
          {months.map(({ month, week }) => (
            <text
              key={`${month}-${week}`}
              x={week * (CELL + GAP)}
              y={10}
              fontSize={10}
              fill={theme.axis}
            >
              {month}
            </text>
          ))}

          {cells.map((cell, i) => {
            const lvl = level(cell.score)
            return (
              <motion.rect
                key={cell.key}
                x={cell.week * (CELL + GAP)}
                y={cell.day * (CELL + GAP) + 18}
                width={CELL}
                height={CELL}
                rx={3}
                fill={lvl === -1 ? theme.empty : theme.heat[lvl]}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(0.4, i * 0.0006), duration: 0.25 }}
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
                tabIndex={-1}
              >
                <title>{`${prettyDate(cell.date)} — ${cell.score}%`}</title>
              </motion.rect>
            )
          })}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="min-h-5 text-xs font-medium text-slate-600 dark:text-slate-300">
          {hovered
            ? `${prettyDate(hovered.date)} — ${hovered.score}% complete`
            : `${daily.filter((d) => d.score > 0).length} active days this year`}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Less</span>
          <span
            className="size-3 rounded-[3px]"
            style={{ background: theme.empty }}
            aria-hidden="true"
          />
          {theme.heat.map((color) => (
            <span
              key={color}
              className="size-3 rounded-[3px]"
              style={{ background: color }}
              aria-hidden="true"
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

export default YearHeatmap
