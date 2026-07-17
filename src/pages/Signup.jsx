import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)
  const [confirmEmail, setConfirmEmail] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', password: '', confirm: '' } })

  const password = watch('password')

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      const session = await signUp(values)
      // With email confirmation on, Supabase returns no session — say so instead of
      // dumping the user back on a login screen with no explanation.
      if (!session && isSupabaseConfigured) setConfirmEmail(true)
      else navigate('/connect', { replace: true })
    } catch (error) {
      setFormError(error.message ?? 'Could not create your account.')
    }
  })

  if (confirmEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-brand-100 text-3xl dark:bg-brand-500/15">
          📬
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          We've sent you a confirmation link. Click it, then come back and sign in — your couple
          code will be waiting.
        </p>
        <Button className="mt-6 w-full justify-center" onClick={() => navigate('/login')}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Start together ❤️</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Create your account, then invite your partner with a code.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label="Name"
          icon={User}
          autoComplete="name"
          placeholder="Rachit"
          error={errors.name?.message}
          {...register('name', {
            required: 'What should we call you?',
            minLength: { value: 2, message: 'A little longer, please' },
          })}
        />

        <Input
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Enter your email',
            pattern: { value: /^\S+@\S+\.\S+$/, message: "That doesn't look like an email" },
          })}
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Choose a password',
            minLength: { value: 8, message: 'Use at least 8 characters' },
          })}
        />

        <Input
          label="Confirm password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Confirm your password',
            validate: (value) => value === password || "Those passwords don't match",
          })}
        />

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full justify-center">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </div>
  )
}
