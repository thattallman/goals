import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Flame, Heart, Pencil, Trophy, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, cardMotion } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/Progress'
import { Avatar, AvatarPair } from '../components/ui/Avatar'
import { Badge, PageSkeleton } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { useCoupleProgress } from '../hooks/useProgress'
import { evaluateAchievements, levelProgress, coupleLevel } from '../lib/gamification'
import { achievementStats } from '../data/derive'
import { useToast } from '../context/ToastContext'
import repo from '../data'
import { cn } from '../lib/cn'
import { prettyDate } from '../lib/format'

function EditProfile({ open, onClose }) {
  const { profile, user, refreshProfile, couple, refreshCouple } = useAuth()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    values: {
      name: profile?.name ?? '',
      relationship_since: couple?.relationship_since ?? '',
    },
  })

  const onSubmit = handleSubmit(async ({ name, relationship_since }) => {
    try {
      await repo.updateProfile(user.id, { name })
      if (couple && relationship_since !== couple.relationship_since) {
        await repo.updateCouple(couple.id, { relationship_since: relationship_since || null })
        await refreshCouple()
      }
      await refreshProfile()
      toast.success('Profile updated')
      onClose()
    } catch (error) {
      toast.error(error.message)
    }
  })

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" description="Only your partner sees this.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Name"
          error={errors.name?.message}
          {...register('name', { required: 'Your name, please' })}
        />
        <Input label="Together since" type="date" {...register('relationship_since')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Profile() {
  const { profile, partner, couple, isPaired } = useAuth()
  const progress = useCoupleProgress()
  const [editing, setEditing] = useState(false)

  const achievements = useMemo(() => {
    const stats = achievementStats({
      goals: progress.yourGoals,
      rows: progress.yourRows,
      dailyScores: progress.yourDaily,
      profile,
      streak: progress.yourStreak,
      longest: progress.yourLongest,
      sharedPerfectDays: progress.sharedPerfectDays,
    })
    return evaluateAchievements(stats)
  }, [progress, profile])

  if (progress.isLoading) return <PageSkeleton />

  const level = levelProgress(profile?.xp ?? 0)
  const earned = achievements.filter((a) => a.earned)

  const stats = [
    { icon: Flame, label: 'Current streak', value: `${progress.yourStreak} days`, tone: 'blush' },
    { icon: Trophy, label: 'Longest streak', value: `${progress.yourLongest} days`, tone: 'amber' },
    { icon: Zap, label: 'Total XP', value: profile?.xp ?? 0, tone: 'brand' },
    { icon: Heart, label: 'Perfect days together', value: progress.sharedPerfectDays, tone: 'mint' },
  ]

  const toneMap = {
    brand: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    blush: 'bg-blush-100 text-blush-600 dark:bg-blush-500/15 dark:text-blush-300',
    mint: 'bg-mint-100 text-mint-600 dark:bg-mint-500/15 dark:text-mint-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  }

  return (
    <div className="space-y-6">
      <PageHeader emoji="👤" title="Profile" subtitle="Your journey so far." />

      {/* ---------------------------------------------------- hero card */}
      <Card {...cardMotion} className="overflow-hidden">
        <div className="-m-6 mb-0 h-28 bg-gradient-to-r from-brand-600 via-brand-500 to-blush-500" />
        <div className="-mt-10 flex flex-wrap items-end gap-4">
          <Avatar name={profile?.name} src={profile?.avatar_url} size="xl" ring />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between">
            <Badge tone="brand">⚡ Level {level.level}</Badge>
            <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {level.into} / {level.needed} XP
            </span>
          </div>
          <ProgressBar value={level.percent} tone="brand" />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {level.remaining} XP to level {level.level + 1}. Harder goals are worth more.
          </p>
        </div>
      </Card>

      {/* ------------------------------------------------------- couple */}
      {isPaired && (
        <Card {...cardMotion} className="flex flex-wrap items-center gap-5">
          <AvatarPair you={profile} partner={partner} size="lg" />
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white">
              {profile?.name} &amp; {partner.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {couple?.relationship_since
                ? `Together since ${prettyDate(couple.relationship_since)}`
                : 'Add your anniversary in Edit'}
            </p>
          </div>
          <Badge tone="blush">❤️ Level {coupleLevel(profile?.xp ?? 0, partner.xp ?? 0)} Couple</Badge>
        </Card>
      )}

      {/* -------------------------------------------------------- stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-4 shadow-soft"
          >
            <span className={cn('mb-3 grid size-9 place-items-center rounded-xl', toneMap[stat.tone])}>
              <stat.icon className="size-4.5" aria-hidden="true" />
            </span>
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ------------------------------------------------- achievements */}
      <Card {...cardMotion}>
        <CardHeader
          title="Achievements"
          subtitle={`${earned.length} of ${achievements.length} unlocked`}
          icon={Trophy}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {achievements.map((badge, i) => (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={{ y: -4 }}
              className={cn(
                'flex flex-col items-center rounded-2xl p-4 text-center transition',
                badge.earned
                  ? 'bg-gradient-to-br from-amber-100 to-blush-100 shadow-soft dark:from-amber-500/15 dark:to-blush-500/10'
                  : 'bg-slate-50 opacity-60 grayscale dark:bg-white/5',
              )}
            >
              <span className="text-3xl" aria-hidden="true">
                {badge.emoji}
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {badge.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {badge.description}
              </p>
              {badge.earned && (
                <span className="mt-2 text-[10px] font-bold tracking-wide text-mint-600 uppercase dark:text-mint-400">
                  Unlocked
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </Card>

      <EditProfile open={editing} onClose={() => setEditing(false)} />
    </div>
  )
}
