import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (error) {
      setFormError(error.message ?? 'Could not send the reset link.')
    }
  })

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-mint-100 text-3xl dark:bg-mint-500/15">
          ✉️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Link sent</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          If that email has an account, a reset link is on its way. Check spam if it's hiding.
        </p>
        <Link to="/login">
          <Button variant="secondary" className="mt-6 w-full justify-center">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot password?</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Happens to everyone. We'll email you a reset link.
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

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full justify-center">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
