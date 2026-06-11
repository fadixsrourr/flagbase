import { Wordmark } from '@/components/brand/Wordmark'
import { AuthForm } from '@/features/auth/AuthForm'

export default function LoginPage() {
  const allowRegistration = process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true'

  return (
    <main className="relative z-10 grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — instrument grid shows through; amber signal wash on top. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line p-12 lg:flex xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-[34rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--accent) / 0.18), transparent 60%)',
          }}
        />

        <Wordmark className="relative" />

        <div className="relative flex flex-col gap-8">
          <h2 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-content xl:text-5xl">
            Ship behind flags.
            <br />
            Roll back in <span className="text-accent">one click</span>.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-content-muted">
            Self-hosted feature management. Your flags live in your own Firebase
            project, evaluated at the edge by the flagbase SDK.
          </p>
          <div className="flex items-center gap-2.5 pt-2">
            <span className="size-2 rounded-full bg-accent animate-signal-pulse" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-content-faint">
              Live control plane
            </span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>
          <AuthForm allowRegistration={allowRegistration} />
        </div>
      </section>
    </main>
  )
}
