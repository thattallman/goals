import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Check, Copy, Heart, Share2 } from 'lucide-react'
import repo from '../data'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Card } from '../components/ui/Card'
import { useToast } from '../context/ToastContext'

/**
 * Pairing. Two doors — share your code, or enter theirs — and the couple is capped at
 * two people, enforced in the database, not just here.
 */
export default function Connect() {
  const { user, couple, partner, refreshCouple } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const [joinError, setJoinError] = useState(null)
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { code: '' } })

  // Someone who lands here without a couple yet gets one created for them, so there's
  // always a code to share.
  useEffect(() => {
    if (couple || creating || !user) return
    setCreating(true)
    repo
      .createCouple(user.id)
      .then(refreshCouple)
      .catch((error) => toast.error(error.message))
  }, [couple, creating, user, refreshCouple, toast])

  useEffect(() => {
    if (partner) navigate('/', { replace: true })
  }, [partner, navigate])

  const copy = async () => {
    await navigator.clipboard.writeText(couple.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    const text = `Join me on TogetherGoals! My couple code is ${couple.invite_code} ❤️`
    if (navigator.share) await navigator.share({ title: 'TogetherGoals', text })
    else {
      await navigator.clipboard.writeText(text)
      toast.success('Invite copied — go send it 💜')
    }
  }

  const onJoin = handleSubmit(async ({ code }) => {
    setJoinError(null)
    try {
      await repo.joinCouple(user.id, code)
      await refreshCouple()
      toast.success("You're connected! Let's go 🎉")
      navigate('/', { replace: true })
    } catch (error) {
      setJoinError(error.message)
    }
  })

  return (
    <div className="aurora flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-brand-600 to-blush-500 text-white shadow-glow"
          >
            <Heart className="size-8 fill-current" aria-hidden="true" />
          </motion.span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Waiting for your partner to join ❤️
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            TogetherGoals only works with two. Send them your code, or enter theirs.
          </p>
        </motion.div>

        <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Your couple code
          </p>
          <p className="my-4 font-mono text-4xl font-bold tracking-[0.3em] text-brand-600 dark:text-brand-400">
            {couple?.invite_code ?? '······'}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={copy} disabled={!couple}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy code'}
            </Button>
            <Button onClick={share} disabled={!couple}>
              <Share2 className="size-4" aria-hidden="true" />
              Invite partner
            </Button>
          </div>
        </Card>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <span className="text-xs font-semibold text-slate-400 uppercase">or</span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <Card initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={onJoin} className="space-y-4" noValidate>
            <Input
              label="Have their code?"
              placeholder="LOVE24"
              autoCapitalize="characters"
              className="text-center font-mono text-lg tracking-[0.25em] uppercase"
              error={errors.code?.message ?? joinError}
              {...register('code', {
                required: 'Enter the code your partner shared',
                minLength: { value: 4, message: 'Codes are at least 4 characters' },
              })}
            />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center">
              Join their couple
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-400">
          You can keep adding goals while you wait — everything syncs the moment they join.
        </p>
      </div>
    </div>
  )
}
