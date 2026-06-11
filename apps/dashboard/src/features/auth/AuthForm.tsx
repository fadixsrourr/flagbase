'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Envelope, LockKey, Warning } from '@phosphor-icons/react'
import { authSchema, type AuthValues } from './auth-schema'
import { signInWithEmail, registerWithEmail, authErrorMessage } from '@/lib/client/auth-service'
import { createSession } from '@/lib/client/session'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'

const copy = {
  signin: {
    heading: 'Sign in',
    subtext: 'Access your feature flag control plane.',
    submit: 'Sign in',
    togglePrompt: 'Need an account?',
    toggleAction: 'Create one',
  },
  register: {
    heading: 'Create account',
    subtext: 'Set up your self-hosted control plane.',
    submit: 'Create account',
    togglePrompt: 'Already have an account?',
    toggleAction: 'Sign in',
  },
} as const

export function AuthForm({ allowRegistration }: { allowRegistration: boolean }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { mode: 'signin', email: '', password: '' },
  })

  const mode = watch('mode')
  const text = copy[mode]

  function toggleMode() {
    setValue('mode', mode === 'signin' ? 'register' : 'signin')
    clearErrors()
  }

  async function onSubmit(values: AuthValues) {
    try {
      const user =
        values.mode === 'register'
          ? await registerWithEmail(values.email, values.password)
          : await signInWithEmail(values.email, values.password)

      await createSession(await user.getIdToken())
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setError('root', { message: authErrorMessage(error) })
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{text.heading}</h1>
        <p className="text-sm text-content-muted">{text.subtext}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <input type="hidden" {...register('mode')} />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={<Envelope className="size-[18px]" aria-hidden />}
          error={errors.email?.message}
          {...register('email')}
        />

        <TextField
          label="Password"
          type="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          icon={<LockKey className="size-[18px]" aria-hidden />}
          error={errors.password?.message}
          {...register('password')}
        />

        {errors.root && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-control border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            <Warning weight="fill" className="size-4 shrink-0" aria-hidden />
            <span>{errors.root.message}</span>
          </div>
        )}

        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          {text.submit}
        </Button>
      </form>

      {allowRegistration && (
        <p className="text-sm text-content-faint">
          {text.togglePrompt}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className="cursor-pointer font-medium text-accent underline-offset-4 transition-colors hover:text-accent-bright hover:underline"
          >
            {text.toggleAction}
          </button>
        </p>
      )}
    </div>
  )
}
