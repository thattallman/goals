import { eachDayOfInterval, subDays } from 'date-fns'
import { dateKey } from '../lib/format'
import { dayScoreFromValues } from '../lib/scoring'

/**
 * Turn raw goal_progress rows into the per-day score series that the streak chip,
 * 7-day chart, heatmap and insights all consume. Shared by both repositories so the
 * demo and the real backend can never drift apart.
 *
 * @param {Array} goals    the person's goals (needs id, target, module, archived)
 * @param {Array} rows     goal_progress rows: { goal_id, date, value }
 * @param {number} days    how far back to build the series
 * @returns {Array<{date: string, score: number}>} oldest → newest, gaps filled with 0
 */
export function buildDailyScores(goals = [], rows = [], days = 365) {
  const byDate = new Map()
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, {})
    byDate.get(row.date)[row.goal_id] = row.value
  }

  const end = new Date()
  const start = subDays(end, days - 1)

  return eachDayOfInterval({ start, end }).map((day) => {
    const key = dateKey(day)
    return { date: key, score: dayScoreFromValues(goals, byDate.get(key) ?? {}) }
  })
}

/** Today's value for each goal, keyed by goal id — what the counters display. */
export function valuesForDate(rows = [], date) {
  const values = {}
  for (const row of rows) if (row.date === date) values[row.goal_id] = row.value
  return values
}

/** Roll-up stats the achievement engine needs. */
export function achievementStats({ goals = [], rows = [], dailyScores = [], profile = {}, streak = 0, longest = 0, sharedPerfectDays = 0 }) {
  const goalById = new Map(goals.map((g) => [g.id, g]))
  let total = 0
  let health = 0
  let career = 0
  let workout = 0

  for (const row of rows) {
    const goal = goalById.get(row.goal_id)
    if (!goal) continue
    // A "completion" is a day where this goal hit its target.
    if (goal.module === 'career' ? row.value > 0 : row.value >= goal.target) {
      total += 1
      if (goal.module === 'health') health += 1
      if (goal.module === 'career') career += 1
      if (['running', 'cycling', 'gym', 'yoga', 'stretching'].includes(goal.category_id)) workout += 1
    }
  }

  return {
    xp: profile.xp ?? 0,
    streak,
    longest,
    totalCompletions: total,
    healthCompletions: health,
    careerCompletions: career,
    workoutCompletions: workout,
    perfectDays: dailyScores.filter((d) => d.score >= 100).length,
    sharedPerfectDays,
  }
}
