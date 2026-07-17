import { motion } from 'framer-motion'
import {
  Activity,
  Award,
  CalendarRange,
  CheckCircle2,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, cardMotion } from '../components/ui/Card'
import { ProgressRing, ProgressBar } from '../components/ui/Progress'
import { PageSkeleton, EmptyState } from '../components/ui/Feedback'
import { WeeklyLineChart } from '../components/charts/WeeklyLineChart'
import { RadarCompare } from '../components/charts/CompareCharts'
import { useInsights } from '../hooks/useInsights'
import { useCoupleProgress } from '../hooks/useProgress'
import { useAuth } from '../context/AuthContext'
import { prettyDate } from '../lib/format'
import { cn } from '../lib/cn'

function Stat({ icon: Icon, label, value, hint, tone = 'brand', index = 0 }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    blush: 'bg-blush-100 text-blush-600 dark:bg-blush-500/15 dark:text-blush-300',
    mint: 'bg-mint-100 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-4 shadow-soft"
    >
      <span className={cn('mb-3 grid size-9 place-items-center rounded-xl', tones[tone])}>
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </motion.div>
  )
}

export default function WeeklyReport() {
  const { partner, isPaired } = useAuth()
  const insights = useInsights()
  const progress = useCoupleProgress()

  if (insights.isLoading) return <PageSkeleton />

  if (!insights.hasData) {
    return (
      <div>
        <PageHeader emoji="📈" title="Weekly Report" subtitle="Your week, summarised." />
        <Card {...cardMotion}>
          <EmptyState
            emoji="📊"
            title="Nothing to report yet"
            description="Add a few goals and log a couple of days — your first report writes itself."
          />
        </Card>
      </div>
    )
  }

  const { week } = insights
  const delta = week.completion - week.previous
  const trendUp = delta >= 0

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="📈"
        title="Weekly Report"
        subtitle={`Week of ${prettyDate(week.start)} — generated automatically`}
        stat={{ label: 'This week', value: `${week.completion}%` }}
        partnerStat={isPaired ? { label: partner.name, value: `${week.partnerCompletion}%` } : null}
      />

      {/* ------------------------------------------------- headline card */}
      <Card {...cardMotion} className="bg-gradient-to-br from-brand-600 to-blush-500 text-white">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white/70">Combined score</p>
            <p className="text-5xl font-bold tabular-nums">{week.combined}%</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
              {trendUp ? (
                <TrendingUp className="size-4" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-4" aria-hidden="true" />
              )}
              {trendUp
                ? `Up ${Math.abs(delta)} points on last week — beautiful work.`
                : `Down ${Math.abs(delta)} points. New week, fresh start ❤️`}
            </p>
          </div>

          <div className="flex gap-4">
            <ProgressRing
              id="wr-health"
              value={week.health}
              size={104}
              stroke={9}
              label=""
              sublabel="Health"
              gradient={['#ffffff', '#d1fae5']}
            />
            <ProgressRing
              id="wr-career"
              value={week.career}
              size={104}
              stroke={9}
              label=""
              sublabel="Career"
              gradient={['#ffffff', '#fbcfe8']}
              delay={0.15}
            />
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------- stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={CheckCircle2}
          label="Goals completed"
          value={week.goalsCompleted}
          hint="this week"
          tone="mint"
          index={0}
        />
        <Stat
          icon={Target}
          label="Missed slots"
          value={week.missed}
          hint="chances still open"
          tone="amber"
          index={1}
        />
        <Stat
          icon={Activity}
          label="Consistency"
          value={`${week.consistency}%`}
          hint="days you showed up"
          tone="brand"
          index={2}
        />
        <Stat
          icon={Flame}
          label="Longest streak"
          value={week.longestStreak}
          hint={`current: ${week.currentStreak} days`}
          tone="blush"
          index={3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------ score split */}
        <Card {...cardMotion}>
          <CardHeader title="Score breakdown" subtitle="Where the week actually went" icon={Award} />
          <div className="space-y-4">
            <ProgressBar label="Health" value={week.health} tone="mint" showLabel />
            <ProgressBar label="Career" value={week.career} tone="brand" showLabel />
            <ProgressBar label="Daily habits" value={week.daily} tone="blush" showLabel />
            <div className="border-t border-slate-200/70 pt-4 dark:border-white/10">
              <ProgressBar label="Combined" value={week.combined} tone="amber" showLabel />
            </div>
          </div>

          <p className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {week.consistency >= 70
              ? '🌟 You showed up on most days this week. That consistency is the whole game.'
              : "💜 A few quiet days this week — that's allowed. One goal today puts you back on track."}
          </p>
        </Card>

        {/* ------------------------------------------------------ radar */}
        <Card {...cardMotion}>
          <CardHeader
            title="You two, side by side"
            subtitle="Where you complement each other"
            icon={CalendarRange}
          />
          <RadarCompare data={insights.modules} hasPartner={isPaired} />
          {isPaired && (
            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {week.completion >= week.partnerCompletion
                ? `You're carrying the week — bring ${partner.name} along 💜`
                : `${partner.name} is flying this week. Let's catch up together ❤️`}
            </p>
          )}
        </Card>
      </div>

      {/* -------------------------------------------------- week chart */}
      <Card {...cardMotion}>
        <CardHeader title="Day by day" subtitle="The last seven days in full" icon={Activity} />
        <WeeklyLineChart
          yourDaily={progress.yourDaily}
          partnerDaily={progress.partnerDaily}
          combinedDaily={progress.combinedDaily}
          hasPartner={isPaired}
        />
      </Card>
    </div>
  )
}
