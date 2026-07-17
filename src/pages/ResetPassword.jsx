import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { useToast } from '../context/ToastContext'
import { isDemo } from '../data'

/**
 * Where the emailed reset link lands. Firebase never puts a session in place here — the
 * link only carries an oobCode, which has to be redeemed explicitly via
 * confirmPasswordReset(). There's nothing to sign the user back into afterward, so a
 * successful reset sends them to /login rather than into the app.
 */
export default function ResetPassword() {
  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const oobCode = searchParams.get('oobCode')
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirm: '' } })

  const password = watch('password')

  const onSubmit = handleSubmit(async ({ password: next }) => {
    setFormError(null)
    try {
      await confirmPasswordReset(oobCode, next)
      toast.success('Password updated. Sign in with your new password.')
      navigate('/login', { replace: true })
    } catch (error) {
      setFormError(error.message ?? 'Could not update your password.')
    }
  })

  if (!oobCode && !isDemo) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-red-100 text-3xl dark:bg-red-500/15">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          This link is invalid or expired
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Reset links only work once. Request a new one and try again.
        </p>
        <Link to="/forgot-password">
          <Button className="mt-6 w-full justify-center">Request a new link</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
        Make it a good one — then get straight back to your streak.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Input
          label="New password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
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
          Update password
        </Button>
      </form>
    </div>
  )
}
