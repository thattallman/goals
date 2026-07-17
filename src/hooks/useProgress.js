import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import repo from '../data'
import { useAuth } from '../context/AuthContext'
import { keys, useCoupleGoals, useGoals } from './useGoals'
import { buildDailyScores } from '../data/derive'
import { currentStreak, longestStreak } from '../lib/streaks'
import { dayScore } from '../lib/scoring'

const progressQuery = (userId) => ({
  queryKey: keys.progress(userId),
  queryFn: () => repo.listProgress(userId, 365),
  enabled: Boolean(userId),
})

/**
 * The couple's shared progress picture: a year of daily scores for both people, their
 * streaks, and today's numbers. Every chart on the dashboard reads from this one hook so
 * the rings, the line chart and the heatmap can never tell different stories.
 */
export function useCoupleProgress() {
  const { user, partner } = useAuth()
  const { goals: coupleGoals, isLoading: goalsLoading } = useCoupleGoals()
  const { goals: myGoals } = useGoals()

  const mine = useQuery(progressQuery(user?.id))
  const theirs = useQuery({ ...progressQuery(partner?.id), enabled: Boolean(partner?.id) })

  const partnerGoals = useMemo(
    () => coupleGoals.filter((g) => g.user_id === partner?.id),
    [coupleGoals, partner?.id],
  )

  return useMemo(() => {
    const yourDaily = buildDailyScores(myGoals, mine.data ?? [], 365)
    const partnerDaily = partner ? buildDailyScores(partnerGoals, theirs.data ?? [], 365) : []

    // The combined series is the couple's shared line — the average of both.
    const combinedDaily = yourDaily.map((day, i) => ({
      date: day.date,
      score: partner ? Math.round((day.score + (partnerDaily[i]?.score ?? 0)) / 2) : day.score,
    }))

    const yourToday = dayScore(myGoals)
    const partnerToday = partner ? dayScore(partnerGoals) : null

    return {
      isLoading: goalsLoading || mine.isLoading || (Boolean(partner) && theirs.isLoading),
      yourGoals: myGoals,
      partnerGoals,
      yourRows: mine.data ?? [],
      partnerRows: theirs.data ?? [],
      yourDaily,
      partnerDaily,
      combinedDaily,
      yourToday,
      partnerToday,
      combinedToday:
        partnerToday === null ? yourToday : Math.round((yourToday + partnerToday) / 2),
      yourStreak: currentStreak(yourDaily),
      partnerStreak: partner ? currentStreak(partnerDaily) : 0,
      yourLongest: longestStreak(yourDaily),
      partnerLongest: partner ? longestStreak(partnerDaily) : 0,
      /** Days where both of them hit 100% — the couple's rarest, best badge. */
      sharedPerfectDays: partner
        ? yourDaily.filter((d, i) => d.score >= 100 && (partnerDaily[i]?.score ?? 0) >= 100).length
        : 0,
    }
  }, [myGoals, partnerGoals, mine.data, theirs.data, partner, goalsLoading, mine.isLoading, theirs.isLoading])
}

/** The shared activity feed — "Riya completed Workout". */
export function useActivity(limit = 12) {
  const { couple } = useAuth()
  const query = useQuery({
    queryKey: [...keys.activity(couple?.id), limit],
    queryFn: () => repo.listActivity(couple.id, limit),
    enabled: Boolean(couple?.id),
  })
  return { ...query, activity: query.data ?? [] }
}
