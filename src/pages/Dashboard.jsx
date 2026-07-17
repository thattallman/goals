import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Quote, TrendingUp, Trophy, UserPlus, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCoupleProgress, useActivity } from '../hooks/useProgress'
import { Card, CardHeader, cardMotion } from '../components/ui/Card'
import { ProgressRing, ProgressBar } from '../components/ui/Progress'
import { PageSkeleton, EmptyState, Badge } from '../components/ui/Feedback'
import { Avatar, AvatarPair } from '../components/ui/Avatar'
import { WeeklyLineChart } from '../components/charts/WeeklyLineChart'
import { YearHeatmap } from '../components/charts/YearHeatmap'
import { SERIES_LIGHT } from '../components/charts/theme'
import { coupleLevel, levelProgress } from '../lib/gamification'
import { streakLabel } from '../lib/streaks'
import { greeting, relativeTime } from '../lib/format'
import { quoteOfTheDay } from '../lib/quotes'

/** Shown until the second person walks through the door. */
function WaitingForPartner({ code }) {
  return (
    <Card {...cardMotion} className="border-dashed bg-gradient-to-br from-brand-50 to-blush-50 text-center dark:from-brand-500/10 dark:to-blush-500/10">
      <motion.p
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="text-4xl"
      >
        ❤️
      </motion.p>
      <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
        Waiting for your partner to join
      </h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Share your code <strong className="font-mono tracking-widest text-brand-600 dark:text-brand-400">{code}</strong> — the
        dashboard comes alive the second they're in.
      </p>
      <Link to="/connect" className="mt-5 inline-flex">
        <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-blush-500 px-5 text-sm font-semibold text-white shadow-glow">
          <UserPlus className="size-4" aria-hidden="true" />
          Invite your partner
        </span>
      </Link>
    </Card>
  )
}

export default function Dashboard() {
  const { profile, partner, couple, isPaired } = useAuth()
  const progress = useCoupleProgress()
  const { activity } = useActivity(6)
  const quote = quoteOfTheDay()

  if (progress.isLoading) return <PageSkeleton />

  const level = levelProgress(profile?.xp ?? 0)
  const together = coupleLevel(profile?.xp ?? 0, partner?.xp ?? 0)

  const weekAvg = (series) => {
    const last7 = series.slice(-7)
    return last7.length ? Math.round(last7.reduce((a, d) => a + d.score, 0) / last7.length) : 0
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------- welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            {greeting()} {profile?.name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {progress.yourToday >= 100
              ? "You've finished everything today. Incredible."
              : `You're ${progress.yourToday}% through today — keep going.`}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-white shadow-soft">
          <motion.span
            animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Flame className="size-5 fill-current" aria-hidden="true" />
          </motion.span>
          <div className="leading-tight">
            <p className="text-lg font-bold tabular-nums">{progress.yourStreak}</p>
            <p className="text-[10px] font-medium opacity-90">day streak</p>
          </div>
        </div>
      </motion.div>

      {/* --------------------------------------------------------- quote */}
      <Card {...cardMotion} className="flex items-start gap-4 bg-gradient-to-r from-brand-600 to-blush-500 text-white">
        <Quote className="size-6 shrink-0 opacity-70" aria-hidden="true" />
        <div>
          <p className="font-medium">{quote.text}</p>
          <p className="mt-1 text-sm text-white/70">— {quote.author}</p>
        </div>
      </Card>

      {!isPaired && <WaitingForPartner code={couple?.invite_code} />}

      {/* ------------------------------------------------ couple summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card {...cardMotion} className="lg:col-span-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AvatarPair you={profile} partner={partner} size="lg" />
            <Badge tone="blush" className="whitespace-nowrap">
              ❤️ Level {together} Couple
            </Badge>
          </div>

          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {profile?.name}
            {partner && <span className="text-slate-400"> &amp; </span>}
            {partner?.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {couple?.relationship_since
              ? `Together since ${new Date(couple.relationship_since).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
              : 'Your journey starts today'}
          </p>

          <div className="mt-5 space-y-3">
            <ProgressBar
              label="You"
              value={weekAvg(progress.yourDaily)}
              tone="brand"
              showLabel
            />
            {isPaired && (
              <>
                <ProgressBar
                  label={partner.name}
                  value={weekAvg(progress.partnerDaily)}
                  tone="blush"
                  showLabel
                />
                <ProgressBar
                  label="Combined"
                  value={weekAvg(progress.combinedDaily)}
                  tone="mint"
                  showLabel
                />
              </>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-3 dark:bg-white/5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Level {level.level}
              </span>
              <span className="tabular-nums text-slate-400">
                {level.remaining} XP to level {level.level + 1}
              </span>
            </div>
            <ProgressBar value={level.percent} tone="amber" />
          </div>
        </Card>

        {/* -------------------------------------------------- daily rings */}
        <Card {...cardMotion} className="lg:col-span-2">
          <CardHeader
            title="Today's progress"
            subtitle={
              isPaired ? 'You, your partner, and the two of you together' : 'Your rings for today'
            }
            icon={TrendingUp}
          />
          <div className="flex flex-wrap items-center justify-around gap-6 py-2">
            <ProgressRing
              id="you"
              value={progress.yourToday}
              label="You"
              sublabel={profile?.name}
              gradient={['#7C3AED', '#A78BFA']}
            />
            {isPaired && (
              <>
                <ProgressRing
                  id="partner"
                  value={progress.partnerToday}
                  label="Partner"
                  sublabel={partner.name}
                  gradient={['#EC4899', '#F9A8D4']}
                  delay={0.15}
                />
                <ProgressRing
                  id="combined"
                  value={progress.combinedToday}
                  label="Combined"
                  sublabel="Together"
                  gradient={['#10B981', '#6EE7B7']}
                  delay={0.3}
                />
              </>
            )}
          </div>

          {isPaired && (
            <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-center text-sm font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
              {progress.yourToday >= progress.partnerToday
                ? `You're leading today — cheer ${partner.name} on! 💜`
                : `${partner.name} is ahead today. Let's catch up together ❤️`}
            </p>
          )}
        </Card>
      </div>

      {/* -------------------------------------------------- weekly graph */}
      <Card {...cardMotion}>
        <CardHeader
          title="The last 7 days"
          subtitle="Daily completion for both of you"
          icon={TrendingUp}
        />
        <WeeklyLineChart
          yourDaily={progress.yourDaily}
          partnerDaily={progress.partnerDaily}
          combinedDaily={progress.combinedDaily}
          hasPartner={isPaired}
        />
      </Card>

      {/* ------------------------------------------------------- heatmap */}
      <Card {...cardMotion}>
        <CardHeader
          title="Your year"
          subtitle="Every day you showed up"
          icon={Flame}
          action={
            <span className="hidden text-xs font-medium text-slate-400 sm:block">
              {streakLabel(progress.yourStreak)}
            </span>
          }
        />
        <YearHeatmap daily={progress.yourDaily} />
      </Card>

      {/* ------------------------------------------------------ activity */}
      <Card {...cardMotion}>
        <CardHeader
          title="Recent activity"
          subtitle="What the two of you have been up to"
          icon={Trophy}
          action={
            <Link
              to="/insights"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Insights
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />

        {activity.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="No activity yet"
            description="Complete your first goal and it'll show up here — and on your partner's screen."
          />
        ) : (
          <ul className="space-y-1">
            {activity.map((item, i) => {
              const isYou = item.user_id === profile?.id
              const who = isYou ? profile : partner
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-500/5"
                >
                  <Avatar name={who?.name ?? 'Partner'} src={who?.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                      {item.message}
                    </p>
                    <p className="text-xs text-slate-400">{relativeTime(item.created_at)}</p>
                  </div>
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: isYou ? SERIES_LIGHT.you : SERIES_LIGHT.partner }}
                    aria-hidden="true"
                  />
                </motion.li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
