import { GoalBoard } from '../components/goals/GoalBoard'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { moduleScore } from '../lib/scoring'
import { useCoupleProgress } from '../hooks/useProgress'
import { STATUS_LABEL, STATUSES } from '../data/catalog'

/** Career goals are long-running, so they're grouped as a board: pending → doing → done. */
const groupByStatus = (goals) =>
  STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABEL[status],
    goals: goals.filter((g) => (g.current >= g.target ? 'completed' : g.status) === status),
  })).filter((group) => group.goals.length > 0)

export default function Career() {
  const { partner } = useAuth()
  const { active } = useGoals('career')
  const { partnerGoals } = useCoupleProgress()

  const yours = moduleScore(active, 'career')
  const theirs = moduleScore(partnerGoals, 'career')

  return (
    <div>
      <PageHeader
        emoji="💻"
        title="Career"
        subtitle="Courses, projects, applications — the long game, tracked daily."
        stat={{ label: 'Career score', value: `${yours}%` }}
        partnerStat={partner ? { label: partner.name, value: `${theirs}%` } : null}
      />

      <GoalBoard
        module="career"
        groupBy={groupByStatus}
        emptyCopy={{
          emoji: '🚀',
          title: 'No career goals yet',
          description:
            'A course to finish, a project to ship, a hundred Leetcode problems. Pick one and start.',
        }}
      />
    </div>
  )
}
