import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { isDemo } from '../data'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState(null)
  const [remember, setRemember] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn({ ...values, remember })
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(error.message ?? 'Could not sign you in. Please try again.')
    }
  })

  /** Demo mode: one tap into the seeded couple, no typing. */
  const fillDemo = () => {
    setValue('email', 'rachit@togethergoals.app')
    setValue('password', 'demo1234')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back 👋</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Your partner is waiting. Let's keep the streak alive.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', { required: 'Enter your password' })}
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Forgot password?
          </Link>
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full justify-center">
          Sign in
        </Button>

        {isDemo && (
          <Button type="button" variant="secondary" onClick={fillDemo} className="w-full justify-center">
            ✨ Fill demo credentials
          </Button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Create an account
        </Link>
      </p>
    </div>
  )
}
