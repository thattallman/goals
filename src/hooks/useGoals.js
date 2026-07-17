import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import repo from '../data'
import { useAuth } from '../context/AuthContext'
import { todayKey } from '../lib/format'
import { useToast } from '../context/ToastContext'

/** Every cache key in one place, so invalidation can never miss a consumer. */
export const keys = {
  goals: (userId) => ['goals', userId],
  coupleGoals: (coupleId) => ['couple-goals', coupleId],
  progress: (userId) => ['progress', userId],
  activity: (coupleId) => ['activity', coupleId],
}

/** The signed-in person's goals, optionally narrowed to one module. */
export function useGoals(module) {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: keys.goals(user?.id),
    queryFn: () => repo.listGoals(user.id),
    enabled: Boolean(user?.id),
  })

  const goals = query.data ?? []
  return {
    ...query,
    goals: module ? goals.filter((g) => g.module === module) : goals,
    active: goals.filter((g) => !g.archived && (!module || g.module === module)),
  }
}

/** Both partners' goals — used by the dashboard rings and the comparison charts. */
export function useCoupleGoals() {
  const { couple } = useAuth()
  const query = useQuery({
    queryKey: keys.coupleGoals(couple?.id),
    queryFn: () => repo.listCoupleGoals(couple.id),
    enabled: Boolean(couple?.id),
  })
  return { ...query, goals: query.data ?? [] }
}

/**
 * All goal mutations. Each one invalidates the same set of keys because a single
 * progress write can move a counter, a streak, the heatmap and the activity feed.
 */
export function useGoalMutations() {
  const queryClient = useQueryClient()
  const { user, couple } = useAuth()
  const toast = useToast()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: keys.goals(user?.id) })
    queryClient.invalidateQueries({ queryKey: keys.coupleGoals(couple?.id) })
    queryClient.invalidateQueries({ queryKey: keys.progress(user?.id) })
    queryClient.invalidateQueries({ queryKey: keys.activity(couple?.id) })
  }

  const onError = (error) => toast.error(error.message ?? 'Something went wrong')

  const createGoal = useMutation({
    mutationFn: (goal) =>
      repo.createGoal({ ...goal, user_id: user.id, couple_id: couple?.id ?? null }),
    onSuccess: (goal) => {
      invalidate()
      toast.success(`"${goal.title}" added 🎯`)
    },
    onError,
  })

  const updateGoal = useMutation({
    mutationFn: ({ id, ...patch }) => repo.updateGoal(id, patch),
    onSuccess: invalidate,
    onError,
  })

  const deleteGoal = useMutation({
    mutationFn: (id) => repo.deleteGoal(id),
    onSuccess: () => {
      invalidate()
      toast.success('Goal deleted')
    },
    onError,
  })

  const duplicateGoal = useMutation({
    // `id` is destructured away on purpose — the copy needs a fresh one.
    mutationFn: ({ id: _id, ...goal }) =>
      repo.createGoal({
        ...goal,
        title: `${goal.title} (copy)`,
        current: 0,
        status: 'pending',
        user_id: user.id,
        couple_id: couple?.id ?? null,
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Goal duplicated')
    },
    onError,
  })

  const archiveGoal = useMutation({
    mutationFn: ({ id, archived }) => repo.updateGoal(id, { archived }),
    onSuccess: (goal) => {
      invalidate()
      toast.success(goal.archived ? 'Goal archived' : 'Goal restored')
    },
    onError,
  })

  /** Optimistic: the counter must move the instant you tap, not after a round-trip. */
  const setValue = useMutation({
    mutationFn: ({ goalId, value, date = todayKey() }) => repo.setGoalValue({ goalId, date, value }),
    onMutate: async ({ goalId, value }) => {
      const key = keys.goals(user?.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old = []) =>
        old.map((g) => (g.id === goalId ? { ...g, current: Math.max(0, value) } : g)),
      )
      return { previous, key }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous)
      onError(error)
    },
    onSettled: invalidate,
  })

  return { createGoal, updateGoal, deleteGoal, duplicateGoal, archiveGoal, setValue }
}
