import { pct } from './format'

/**
 * Scoring rules, kept in one place so the dashboard, weekly report and insights
 * can never disagree about what "78%" means.
 *
 * A goal's daily score is its progress toward target, capped at 100.
 * A module's score is the mean of its active goals' scores.
 */

export const goalScore = (goal, value) => pct(value ?? goal.current ?? 0, goal.target)

export const isComplete = (goal, value) => goalScore(goal, value) >= 100

const mean = (nums) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0

/** Average completion across a set of goals, using each goal's `current`. */
export const scoreGoals = (goals = []) => mean(goals.map((g) => goalScore(g)))

/** Score for a single module ('health' | 'career' | 'daily'). */
export const moduleScore = (goals = [], module) =>
  scoreGoals(goals.filter((g) => g.module === module && !g.archived))

/**
 * A person's day score: every active goal counts equally, regardless of module,
 * so a day with 3 health goals and 1 career goal isn't skewed toward health.
 */
export const dayScore = (goals = []) => scoreGoals(goals.filter((g) => !g.archived))

/** The couple's shared number — the average of both partners. */
export const combinedScore = (you = 0, partner = null) =>
  partner === null ? you : Math.round((you + partner) / 2)

/** Health / career / combined trio used by the weekly report and radar chart. */
export const scoreBreakdown = (goals = []) => {
  const health = moduleScore(goals, 'health')
  const career = moduleScore(goals, 'career')
  const daily = moduleScore(goals, 'daily')
  const active = goals.filter((g) => !g.archived)
  return {
    health,
    career,
    daily,
    combined: scoreGoals(active),
    completed: active.filter((g) => isComplete(g)).length,
    total: active.length,
  }
}

/**
 * Score a single goal for a single day.
 *
 * Recurring goals (daily habits, health) reset every night, so the day's value is
 * measured against the full target. Career goals are cumulative and long-running —
 * "did you move it forward today" is the only fair daily question, so any progress
 * counts as a full day.
 */
export const dayValueScore = (goal, valueOnDate = 0) =>
  goal.module === 'career' ? (valueOnDate > 0 ? 100 : 0) : pct(valueOnDate, goal.target)

/** Mean day-score across a set of goals, given that day's value for each. */
export const dayScoreFromValues = (goals = [], valueByGoalId = {}) =>
  mean(goals.filter((g) => !g.archived).map((g) => dayValueScore(g, valueByGoalId[g.id] ?? 0)))

/**
 * Consistency = share of days in the window where the person logged anything at all.
 * Rewards showing up, which is the behaviour we actually want to reinforce.
 */
export const consistency = (dailyScores = []) => {
  if (!dailyScores.length) return 0
  const active = dailyScores.filter((d) => d.score > 0).length
  return Math.round((active / dailyScores.length) * 100)
}
