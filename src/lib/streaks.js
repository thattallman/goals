import { differenceInCalendarDays, subDays } from 'date-fns'
import { dateKey } from './format'

/** A day counts toward a streak once the person clears this share of their goals. */
export const STREAK_THRESHOLD = 60

/**
 * Current streak: consecutive qualifying days ending today (or yesterday — we don't
 * break someone's streak just because they haven't checked in yet this morning).
 *
 * @param {Array<{date: string, score: number}>} days
 */
export const currentStreak = (days = []) => {
  const byDate = new Map(days.map((d) => [d.date, d.score]))
  const today = new Date()
  const qualifies = (d) => (byDate.get(dateKey(d)) ?? 0) >= STREAK_THRESHOLD

  // Grace period: start counting from yesterday if today isn't done yet.
  let cursor = qualifies(today) ? today : subDays(today, 1)
  if (!qualifies(cursor)) return 0

  let streak = 0
  while (qualifies(cursor)) {
    streak += 1
    cursor = subDays(cursor, 1)
  }
  return streak
}

/** Longest run of qualifying days anywhere in the history. */
export const longestStreak = (days = []) => {
  const qualifying = days
    .filter((d) => d.score >= STREAK_THRESHOLD)
    .map((d) => d.date)
    .sort()

  let best = 0
  let run = 0
  let prev = null

  for (const date of qualifying) {
    const gap = prev ? differenceInCalendarDays(new Date(date), new Date(prev)) : null
    run = gap === 1 ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return best
}

/** Copy for the streak chip — celebratory, never scolding. */
export const streakLabel = (streak) => {
  if (streak === 0) return 'Start a streak today'
  if (streak === 1) return 'Day one. Keep it going!'
  if (streak < 7) return `${streak} day streak`
  if (streak < 30) return `${streak} days strong 🔥`
  return `${streak} days — unstoppable 🔥`
}
