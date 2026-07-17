import { motion } from 'framer-motion'
import {
  Crown,
  Heart,
  Lightbulb,
  Sparkles,
  Sunrise,
  TrendingUp,
  Wand2,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, cardMotion } from '../components/ui/Card'
import { PageSkeleton, EmptyState, Badge } from '../components/ui/Feedback'
import { Avatar } from '../components/ui/Avatar'
import { ProgressBar } from '../components/ui/Progress'
import { BarCompare, CategoryDonut, MonthlyTrend } from '../components/charts/CompareCharts'
import { useInsights } from '../hooks/useInsights'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/cn'

/** A single "we noticed something" tile. */
function InsightTile({ icon: Icon, label, headline, detail, tone = 'brand', index = 0 }) {
  const tones = {
    brand: 'from-brand-500/10 to-brand-500/0 text-brand-600 dark:text-brand-300',
    blush: 'from-blush-500/10 to-blush-500/0 text-blush-600 dark:text-blush-300',
    mint: 'from-mint-500/10 to-mint-500/0 text-mint-600 dark:text-mint-300',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-600 dark:text-amber-300',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('glass rounded-2xl bg-gradient-to-br p-5 shadow-soft', tones[tone])}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4" aria-hidden="true" />
        <p className="text-xs font-semibold tracking-wide uppercase">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{headline}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </motion.div>
  )
}

export default function Insights() {
  const { profile, partner, isPaired } = useAuth()
  const insights = useInsights()

  if (insights.isLoading) return <PageSkeleton />

  if (!insights.hasData) {
    return (
      <div>
        <PageHeader emoji="✨" title="Insights" subtitle="Patterns we spot in your progress." />
        <Card {...cardMotion}>
          <EmptyState
            emoji="🔮"
            title="Not enough history yet"
            description="Track your goals for a week and we'll start finding patterns — your best day, your strongest habit, where you're trending."
          />
        </Card>
      </div>
    )
  }

  const {
    mostConsistent,
    needsLove,
    bestDay,
    worstDay,
    improvement,
    projection,
    monthly,
    modules,
    weakest,
    perGoal,
    leaderboard,
  } = insights

  const donut = perGoal
    .filter((g) => g.hitDays > 0)
    .sort((a, b) => b.hitDays - a.hitDays)
    .slice(0, 5)
    .map((g) => ({ label: g.goal.title, value: g.hitDays }))

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="✨"
        title="Insights"
        subtitle="What your history is quietly telling you."
      />

      {/* ---------------------------------------------------- highlights */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightTile
          index={0}
          icon={Sparkles}
          tone="mint"
          label="Most consistent"
          headline={mostConsistent ? mostConsistent.goal.title : '—'}
          detail={
            mostConsistent
              ? `Hit ${mostConsistent.hitDays} times. This is your anchor habit.`
              : 'Log a few days to find out.'
          }
        />
        <InsightTile
          index={1}
          icon={Heart}
          tone="blush"
          label="Needs some love"
          headline={needsLove ? needsLove.goal.title : '—'}
          detail={
            needsLove
              ? `Only ${needsLove.hitDays} hits so far. Try halving the target for a week.`
              : 'Nothing falling behind — nice.'
          }
        />
        <InsightTile
          index={2}
          icon={Sunrise}
          tone="amber"
          label="Best day"
          headline={bestDay ? bestDay.day : '—'}
          detail={
            bestDay && worstDay
              ? `You average ${bestDay.score}% on ${bestDay.day}s, ${worstDay.score}% on ${worstDay.day}s.`
              : 'Still learning your rhythm.'
          }
        />
        <InsightTile
          index={3}
          icon={TrendingUp}
          tone="brand"
          label="Trend"
          headline={`${improvement >= 0 ? '+' : ''}${improvement}%`}
          detail={
            improvement >= 0
              ? 'Better than the fortnight before. Keep the pace.'
              : "A dip from last fortnight — nothing a good week can't fix."
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------------------------------------- couple comparison */}
        <Card {...cardMotion}>
          <CardHeader
            title="The two of you"
            subtitle="Not a competition — a team sheet"
            icon={Crown}
          />
          <BarCompare data={modules} hasPartner={isPaired} />

          <p className="mt-4 rounded-2xl bg-gradient-to-r from-brand-50 to-blush-50 p-3 text-center text-sm font-medium text-slate-700 dark:from-brand-500/10 dark:to-blush-500/10 dark:text-slate-200">
            {isPaired
              ? `Between you, ${weakest.label.toLowerCase()} is the quietest area. Pick one small ${weakest.label.toLowerCase()} goal each this week and lift it together ❤️`
              : 'Invite your partner and this becomes a shared picture.'}
          </p>
        </Card>

        {/* ------------------------------------------------ leaderboard */}
        <Card {...cardMotion}>
          <CardHeader title="Leaderboard" subtitle="Friendly, always" icon={Crown} />
          <ul className="space-y-3">
            {leaderboard.map((person, i) => (
              <motion.li
                key={person.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3',
                  i === 0
                    ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-500/15 dark:to-transparent'
                    : 'bg-slate-50 dark:bg-white/5',
                )}
              >
                <span className="w-5 text-center text-sm font-bold text-slate-400">
                  {i === 0 ? '👑' : i + 1}
                </span>
                <Avatar
                  name={person.name}
                  src={person.you ? profile?.avatar_url : partner?.avatar_url}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {person.name}
                    {person.you && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {person.xp} XP · {person.streak} day streak
                  </p>
                </div>
                <Badge tone={i === 0 ? 'amber' : 'slate'}>{person.score}%</Badge>
              </motion.li>
            ))}
          </ul>

          {isPaired && (
            <p className="mt-4 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
              {leaderboard[0].you
                ? `You're ahead on XP — but ${partner.name} is right behind you. Keep each other honest 💜`
                : `${partner.name} is ahead on XP. Let's catch up together ❤️`}
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------ monthly trend */}
        <Card {...cardMotion}>
          <CardHeader
            title="Six month trend"
            subtitle="The shape of your year so far"
            icon={TrendingUp}
          />
          <MonthlyTrend data={monthly} hasPartner={isPaired} />
        </Card>

        {/* ----------------------------------------------------- effort */}
        <Card {...cardMotion}>
          <CardHeader title="Where your effort goes" subtitle="Your five biggest wins" icon={Wand2} />
          {donut.length ? (
            <CategoryDonut data={donut} />
          ) : (
            <EmptyState emoji="🥧" title="No completions yet" description="Finish a goal and this fills in." />
          )}
        </Card>
      </div>

      {/* ------------------------------------------------------ forecast */}
      <Card {...cardMotion} className="bg-gradient-to-br from-brand-600 to-blush-500 text-white">
        <div className="flex flex-wrap items-center gap-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Lightbulb className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-64 flex-1">
            <p className="text-sm font-medium text-white/70">If you keep this up</p>
            <p className="text-2xl font-bold">
              You're on track for <span className="tabular-nums">{projection}%</span> next week
            </p>
            <p className="mt-1 text-sm text-white/80">
              {projection >= 80
                ? 'That would be one of your best weeks yet. Protect the streak.'
                : 'Two more logged days a week would push this over 80%.'}
            </p>
            <div className="mt-3">
              <ProgressBar value={projection} tone="mint" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
