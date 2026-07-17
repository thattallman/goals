import { GoalBoard } from '../components/goals/GoalBoard'
import { PageHeader } from '../components/ui/PageHeader'
import { useCoupleProgress } from '../hooks/useProgress'
import { useAuth } from '../context/AuthContext'

/** Completed goals drop to the bottom — what's left to do stays in front of you. */
const groupByDone = (goals) => {
  const todo = goals.filter((g) => g.current < g.target)
  const done = goals.filter((g) => g.current >= g.target)
  return [
    { key: 'todo', label: todo.length ? 'To do today' : null, goals: todo },
    ...(done.length ? [{ key: 'done', label: 'Completed', goals: done }] : []),
  ]
}

export default function DailyGoals() {
  const { partner } = useAuth()
  const { yourToday, partnerToday } = useCoupleProgress()

  return (
    <div>
      <PageHeader
        emoji="🎯"
        title="Daily Goals"
        subtitle="The small things, done every day. That's the whole trick."
        stat={{ label: 'Today', value: `${yourToday}%` }}
        partnerStat={partner ? { label: partner.name, value: `${partnerToday}%` } : null}
      />

      <GoalBoard
        module="daily"
        groupBy={groupByDone}
        emptyCopy={{
          emoji: '🌱',
          title: 'No daily goals yet',
          description:
            'Start with one habit you can keep for a week. Momentum beats ambition every time.',
        }}
      />
    </div>
  )
}
