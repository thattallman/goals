import { GoalBoard } from '../components/goals/GoalBoard'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { moduleScore } from '../lib/scoring'
import { useCoupleProgress } from '../hooks/useProgress'
import { categoryById } from '../data/catalog'

/** Health splits the way people actually think about it: what you eat, and how you move. */
const groupByArea = (goals) => {
  const isWorkout = (goal) =>
    categoryById(goal.category_id).group === 'Workout'

  const food = goals.filter((g) => !isWorkout(g))
  const workout = goals.filter(isWorkout)

  return [
    ...(food.length ? [{ key: 'food', label: '🥗 Food', goals: food }] : []),
    ...(workout.length ? [{ key: 'workout', label: '🏋️ Workout', goals: workout }] : []),
  ]
}

export default function Health() {
  const { partner } = useAuth()
  const { active } = useGoals('health')
  const { partnerGoals } = useCoupleProgress()

  const yours = moduleScore(active, 'health')
  const theirs = moduleScore(partnerGoals, 'health')

  return (
    <div>
      <PageHeader
        emoji="🥗"
        title="Health"
        subtitle="Food and movement — the two levers that change everything else."
        stat={{ label: 'Health score', value: `${yours}%` }}
        partnerStat={partner ? { label: partner.name, value: `${theirs}%` } : null}
      />

      <GoalBoard
        module="health"
        groupBy={groupByArea}
        emptyCopy={{
          emoji: '💧',
          title: 'Nothing tracked yet',
          description:
            'Water is the easiest place to start. Add a target and watch the ring fill up.',
        }}
      />
    </div>
  )
}
