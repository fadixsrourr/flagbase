'use client'

import Link from 'next/link'
import { usePathname, useParams, useSearchParams, useRouter } from 'next/navigation'
import { Flag, ClockCounterClockwise, GearSix, ArrowLeft } from '@phosphor-icons/react'
import { cn } from '@/lib/utils/cn'
import { useProject } from '@/features/projects/hooks'

const ENVIRONMENTS = [
  { key: 'development', short: 'Dev' },
  { key: 'staging', short: 'Stg' },
  { key: 'production', short: 'Prod' },
]

export function ProjectSidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const env = searchParams.get('env') ?? 'development'
  const { data: project, isLoading } = useProject(projectId)

  const nav = [
    { href: `/dashboard/${projectId}/flags`, label: 'Flags', icon: Flag },
    { href: `/dashboard/${projectId}/audit`, label: 'Audit log', icon: ClockCounterClockwise },
    { href: `/dashboard/${projectId}/settings`, label: 'Settings', icon: GearSix },
  ]

  function setEnv(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('env', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-56">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-content-faint transition-colors hover:text-content"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All projects
      </Link>

      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-content-faint">Project</span>
        {isLoading ? (
          <span className="h-5 w-32 animate-pulse rounded bg-surface-raised" aria-hidden />
        ) : (
          <span className="truncate font-medium text-content">{project?.name ?? '—'}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-content-faint">Environment</span>
        <div className="flex gap-1 rounded-control border border-line bg-surface-raised p-1">
          {ENVIRONMENTS.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setEnv(e.key)}
              aria-pressed={env === e.key}
              className={cn(
                'flex-1 cursor-pointer rounded-[6px] px-2 py-1.5 text-xs font-medium transition-colors',
                env === e.key
                  ? 'bg-accent text-accent-ink'
                  : 'text-content-muted hover:text-content'
              )}
            >
              {e.short}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={`${item.href}?env=${env}`}
              className={cn(
                'flex items-center gap-2.5 rounded-control px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-surface-raised text-content'
                  : 'text-content-muted hover:bg-surface-raised/60 hover:text-content'
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
