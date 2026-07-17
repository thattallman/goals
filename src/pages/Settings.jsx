import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Heart,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Trash2,
  Unlink,
  Palette,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader, cardMotion } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Toggle, Input } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Feedback'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { useNotificationPrefs } from '../hooks/useNotificationPrefs'
import { useToast } from '../context/ToastContext'
import repo from '../data'
import { cn } from '../lib/cn'

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { profile, partner, couple, user, signOut, deleteAccount, refreshCouple } = useAuth()
  const { prefs, setPref, requestBrowserPermission } = useNotificationPrefs()
  const toast = useToast()
  const navigate = useNavigate()

  const [unlinking, setUnlinking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const unlink = async () => {
    try {
      await repo.leaveCouple(user.id)
      await refreshCouple()
      setUnlinking(false)
      toast.info('You are no longer connected. Your goals are safe.')
      navigate('/connect')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const destroy = async () => {
    try {
      await deleteAccount()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleNotification = async (key, value) => {
    // Browser notifications need explicit consent — ask at the moment they're enabled.
    if (value && key === 'dailyReminder') {
      const granted = await requestBrowserPermission()
      if (!granted) {
        toast.info('Reminders need notification permission — enable it in your browser settings.')
        return
      }
    }
    setPref(key, value)
  }

  return (
    <div className="space-y-6">
      <PageHeader emoji="⚙️" title="Settings" subtitle="Make it yours." />

      {/* ----------------------------------------------------- appearance */}
      <Card {...cardMotion}>
        <CardHeader title="Appearance" subtitle="Light, dark, or follow your system" icon={Palette} />
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={theme === option.value}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition',
                theme === option.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
              )}
            >
              <option.icon className="size-5" aria-hidden="true" />
              <span className="text-sm font-semibold">{option.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* -------------------------------------------------- notifications */}
      <Card {...cardMotion}>
        <CardHeader
          title="Notifications"
          subtitle="We'll only nudge you about things that matter"
          icon={Bell}
        />
        <div className="divide-y divide-slate-200/70 dark:divide-white/5">
          <Toggle
            label="Daily check-in reminder"
            description="A gentle nudge if you haven't logged anything by evening."
            checked={prefs.dailyReminder}
            onChange={(v) => toggleNotification('dailyReminder', v)}
          />
          <Toggle
            label="Weekly summary"
            description="Your report, every Monday morning."
            checked={prefs.weeklySummary}
            onChange={(v) => setPref('weeklySummary', v)}
          />
          <Toggle
            label="Partner completed a goal"
            description={`Know the moment ${partner?.name ?? 'your partner'} finishes something.`}
            checked={prefs.partnerActivity}
            onChange={(v) => setPref('partnerActivity', v)}
          />
          <Toggle
            label="Streaks and milestones"
            description="Celebrate the 7, 30 and 100 day marks."
            checked={prefs.milestones}
            onChange={(v) => setPref('milestones', v)}
          />
        </div>
      </Card>

      {/* ---------------------------------------------------------- couple */}
      <Card {...cardMotion}>
        <CardHeader title="Partner" subtitle="Manage your connection" icon={Heart} />
        {partner ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Connected to {partner.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Code <span className="font-mono tracking-widest">{couple?.invite_code}</span>
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setUnlinking(true)}>
              <Unlink className="size-4" aria-hidden="true" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">No partner yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Share your code <span className="font-mono tracking-widest">{couple?.invite_code}</span>
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/connect')}>
              Invite partner
            </Button>
          </div>
        )}
      </Card>

      {/* --------------------------------------------------------- privacy */}
      <Card {...cardMotion}>
        <CardHeader title="Privacy" subtitle="What your partner can see" icon={Shield} />
        <div className="divide-y divide-slate-200/70 dark:divide-white/5">
          <Toggle
            label="Share my progress"
            description="Your scores and streaks appear on their dashboard. Off means they only see that you're active."
            checked={prefs.shareProgress}
            onChange={(v) => setPref('shareProgress', v)}
          />
          <Toggle
            label="Share goal details"
            description="Show them the titles and notes of your goals, not just the numbers."
            checked={prefs.shareDetails}
            onChange={(v) => setPref('shareDetails', v)}
          />
        </div>
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
          Row Level Security in the database means nobody outside your couple can read your data —
          not even by guessing a URL.
        </p>
      </Card>

      {/* --------------------------------------------------------- account */}
      <Card {...cardMotion}>
        <CardHeader title="Account" subtitle={profile?.email} icon={Shield} />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => signOut()}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
          <Button variant="danger" onClick={() => setDeleting(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Delete account
          </Button>
        </div>
      </Card>

      {/* ---------------------------------------------------------- modals */}
      <Modal
        open={unlinking}
        onClose={() => setUnlinking(false)}
        size="sm"
        title={`Disconnect from ${partner?.name}?`}
        description="You'll both keep your own goals and history. You can reconnect any time with a new code."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setUnlinking(false)}>
            Stay connected
          </Button>
          <Button variant="danger" onClick={unlink}>
            Disconnect
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleting}
        onClose={() => {
          setDeleting(false)
          setConfirmText('')
        }}
        size="sm"
        title="Delete your account?"
        description="Every goal, every streak, every day of history. This cannot be undone."
      >
        <div className="space-y-4">
          <Badge tone="red">This is permanent</Badge>
          <Input
            label='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(false)
                setConfirmText('')
              }}
            >
              Keep my account
            </Button>
            <Button variant="danger" disabled={confirmText !== 'DELETE'} onClick={destroy}>
              Delete forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
