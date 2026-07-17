import { useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useCoupleProgress } from './useProgress'
import { consistency, moduleScore, dayValueScore } from '../lib/scoring'
import { categoryById } from '../data/catalog'
import { weekStartKey } from '../lib/format'

const avg = (nums) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0)

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Every derived number on the Weekly Report and Insights pages, computed from the same
 * progress rows the dashboard uses. Nothing here is stored — it's all a view over the
 * raw history, so it can never go stale.
 */
export function useInsights() {
  const { partner, profile } = useAuth()
  const p = useCoupleProgress()

  return useMemo(() => {
    const thisWeekStart = weekStartKey()
    const thisWeek = p.yourDaily.filter((d) => d.date >= thisWeekStart)

    // ---- weekly report -------------------------------------------------
    const weekDays = p.yourDaily.slice(-7)
    const partnerWeek = p.partnerDaily.slice(-7)
    const previousWeek = p.yourDaily.slice(-14, -7)

    const health = moduleScore(p.yourGoals, 'health')
    const career = moduleScore(p.yourGoals, 'career')
    const daily = moduleScore(p.yourGoals, 'daily')

    const goalsCompleted = p.yourRows.filter((row) => {
      const goal = p.yourGoals.find((g) => g.id === row.goal_id)
      if (!goal || row.date < thisWeekStart) return false
      return goal.module === 'career' ? row.value > 0 : row.value >= goal.target
    }).length

    // A "missed" slot is an active goal on a day it wasn't finished — the honest denominator.
    const activeGoals = p.yourGoals.filter((g) => !g.archived)
    const slots = activeGoals.length * thisWeek.length
    const missed = Math.max(0, slots - goalsCompleted)

    // ---- per-goal consistency ------------------------------------------
    const perGoal = activeGoals.map((goal) => {
      const rows = p.yourRows.filter((r) => r.goal_id === goal.id)
      const scores = rows.map((r) => dayValueScore(goal, r.value))
      const hitDays = scores.filter((s) => s >= 100).length
      return {
        goal,
        category: categoryById(goal.category_id),
        days: rows.length,
        hitDays,
        score: avg(scores),
        consistencyPct: p.yourDaily.length
          ? Math.round((hitDays / Math.min(90, p.yourDaily.length)) * 100)
          : 0,
      }
    })

    const ranked = [...perGoal].sort((a, b) => b.hitDays - a.hitDays)

    // ---- best / worst day of the week ----------------------------------
    const byWeekday = DAY_NAMES.map((name, index) => {
      const scores = p.yourDaily
        .filter((d) => new Date(d.date).getDay() === index && d.score > 0)
        .map((d) => d.score)
      return { day: name, score: avg(scores), samples: scores.length }
    }).filter((d) => d.samples >= 2)

    const sortedDays = [...byWeekday].sort((a, b) => b.score - a.score)

    // ---- month over month ----------------------------------------------
    // Months with no history at all are dropped rather than plotted as 0% — a month you
    // weren't using the app isn't a month you scored zero.
    const monthly = []
    for (let i = 5; i >= 0; i -= 1) {
      const month = subMonths(new Date(), i)
      const prefix = format(month, 'yyyy-MM')
      const yours = p.yourDaily.filter((d) => d.date.startsWith(prefix) && d.score > 0)
      const theirs = p.partnerDaily.filter((d) => d.date.startsWith(prefix) && d.score > 0)
      if (!yours.length && !theirs.length) continue
      monthly.push({
        label: format(month, 'MMM'),
        you: avg(yours.map((d) => d.score)),
        partner: avg(theirs.map((d) => d.score)),
      })
    }

    // ---- improvement + prediction ---------------------------------------
    const recent = avg(p.yourDaily.slice(-14).map((d) => d.score))
    const older = avg(p.yourDaily.slice(-28, -14).map((d) => d.score))
    const improvement = recent - older

    // Straight-line projection from the last fortnight's trend — deliberately simple,
    // and clamped so it never promises 130%.
    const projection = Math.max(0, Math.min(100, recent + improvement))

    const modules = [
      { key: 'health', label: 'Health', you: health, partner: moduleScore(p.partnerGoals, 'health') },
      { key: 'career', label: 'Career', you: career, partner: moduleScore(p.partnerGoals, 'career') },
      { key: 'daily', label: 'Daily', you: daily, partner: moduleScore(p.partnerGoals, 'daily') },
    ]

    const weakest = [...modules].filter((m) => m.you > 0 || true).sort((a, b) => a.you - b.you)[0]

    return {
      isLoading: p.isLoading,
      hasData: p.yourGoals.length > 0,

      // weekly report
      week: {
        start: thisWeekStart,
        completion: avg(weekDays.map((d) => d.score)),
        partnerCompletion: avg(partnerWeek.map((d) => d.score)),
        combined: avg(p.combinedDaily.slice(-7).map((d) => d.score)),
        previous: avg(previousWeek.map((d) => d.score)),
        goalsCompleted,
        missed,
        consistency: consistency(weekDays),
        health,
        career,
        daily,
        longestStreak: p.yourLongest,
        currentStreak: p.yourStreak,
      },

      // insights
      mostConsistent: ranked[0] ?? null,
      needsLove: ranked.at(-1) ?? null,
      bestDay: sortedDays[0] ?? null,
      worstDay: sortedDays.at(-1) ?? null,
      byWeekday,
      improvement,
      projection,
      monthly,
      modules,
      weakest,
      perGoal,

      // couple comparison — always framed as a team, never a scoreboard
      leaderboard: [
        { name: profile?.name ?? 'You', xp: profile?.xp ?? 0, score: p.yourToday, streak: p.yourStreak, you: true },
        ...(partner
          ? [{ name: partner.name, xp: partner.xp ?? 0, score: p.partnerToday, streak: p.partnerStreak, you: false }]
          : []),
      ].sort((a, b) => b.xp - a.xp),
    }
  }, [p, partner, profile])
}
