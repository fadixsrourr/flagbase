'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MagnifyingGlass, Plus, PencilSimple, Flag as FlagIcon } from '@phosphor-icons/react'
import type { Flag, FlagType } from '@flagbase/types'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { Panel } from '@/components/ui/Panel'
import { formatDate } from '@/lib/utils/format'
import { useFlags, useToggleFlag } from './hooks'

type StatusFilter = 'all' | 'enabled' | 'disabled'
type TypeFilter = 'all' | FlagType

const ENV_LABELS: Record<string, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
}

export function FlagsView({ projectId, environmentKey }: { projectId: string; environmentKey: string }) {
  const { data: flags, isLoading, isError } = useFlags(projectId, environmentKey)
  const toggle = useToggleFlag(projectId, environmentKey)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [type, setType] = useState<TypeFilter>('all')

  const filtered = useMemo(() => {
    if (!flags) return []
    const term = search.trim().toLowerCase()
    return flags.filter((flag) => {
      const matchesSearch =
        !term || flag.key.toLowerCase().includes(term) || flag.name.toLowerCase().includes(term)
      const matchesStatus =
        status === 'all' || (status === 'enabled' ? flag.enabled : !flag.enabled)
      const matchesType = type === 'all' || flag.type === type
      return matchesSearch && matchesStatus && matchesType
    })
  }, [flags, search, status, type])

  const newFlagHref = `/dashboard/${projectId}/flags/new?env=${environmentKey}`

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-content">Flags</h1>
            <Badge tone="accent" mono>
              {ENV_LABELS[environmentKey] ?? environmentKey}
            </Badge>
          </div>
          <p className="text-sm text-content-muted">
            Toggle, target and roll out flags for this environment.
          </p>
        </div>
        <ButtonLink href={newFlagHref}>
          <Plus weight="bold" className="size-4" aria-hidden />
          New flag
        </ButtonLink>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-content-faint"
            aria-hidden
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key or name"
            aria-label="Search flags"
            className="h-10 w-full rounded-control border border-line bg-surface-raised pl-10 pr-3.5 text-sm text-content placeholder:text-content-faint transition-colors hover:border-line-strong focus:border-accent/60"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-10 w-auto min-w-[140px]"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'enabled', label: 'Enabled' },
            { value: 'disabled', label: 'Disabled' },
          ]}
        />
        <Select
          aria-label="Filter by type"
          value={type}
          onChange={(e) => setType(e.target.value as TypeFilter)}
          className="h-10 w-auto min-w-[130px]"
          options={[
            { value: 'all', label: 'All types' },
            { value: 'boolean', label: 'Boolean' },
            { value: 'string', label: 'String' },
            { value: 'number', label: 'Number' },
            { value: 'json', label: 'JSON' },
          ]}
        />
      </div>

      {isLoading && <TableSkeleton />}
      {isError && <p className="text-sm text-danger">Could not load flags.</p>}

      {flags && flags.length === 0 && (
        <EmptyState
          icon={<FlagIcon weight="duotone" className="size-6" />}
          title="No flags yet"
          description="Create your first flag to control a feature in this environment."
          action={
            <ButtonLink href={newFlagHref}>
              <Plus weight="bold" className="size-4" aria-hidden />
              New flag
            </ButtonLink>
          }
        />
      )}

      {flags && flags.length > 0 && filtered.length === 0 && (
        <p className="rounded-panel border border-line bg-surface/60 px-5 py-8 text-center text-sm text-content-muted">
          No flags match your filters.
        </p>
      )}

      {filtered.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-content-faint">
                  <th className="px-5 py-3 font-medium">Key</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Rollout</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((flag) => (
                  <FlagRow
                    key={flag.id}
                    flag={flag}
                    projectId={projectId}
                    env={environmentKey}
                    onToggle={(enabled) => toggle.mutate({ flagId: flag.id, enabled })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  )
}

function FlagRow({
  flag,
  projectId,
  env,
  onToggle,
}: {
  flag: Flag
  projectId: string
  env: string
  onToggle: (enabled: boolean) => void
}) {
  const detailHref = `/dashboard/${projectId}/flags/${flag.id}?env=${env}`
  return (
    <tr className="group transition-colors hover:bg-surface-raised/40">
      <td className="px-5 py-3.5">
        <Link
          href={detailHref}
          className="font-mono text-content transition-colors group-hover:text-accent"
        >
          {flag.key}
        </Link>
      </td>
      <td className="px-5 py-3.5 text-content-muted">{flag.name}</td>
      <td className="px-5 py-3.5">
        <FlagTypeBadge type={flag.type} />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Toggle size="sm" checked={flag.enabled} onChange={onToggle} label={`Toggle ${flag.key}`} />
          <span className="text-xs text-content-faint">{flag.enabled ? 'On' : 'Off'}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 font-mono text-content-muted">{flag.rolloutPercentage}%</td>
      <td className="px-5 py-3.5 text-content-faint">{formatDate(flag.updatedAt)}</td>
      <td className="px-5 py-3.5 text-right">
        <Link
          href={detailHref}
          aria-label={`Edit ${flag.key}`}
          className="inline-flex rounded-control p-1.5 text-content-faint transition-colors hover:bg-surface-raised hover:text-content"
        >
          <PencilSimple className="size-4" aria-hidden />
        </Link>
      </td>
    </tr>
  )
}

export function FlagTypeBadge({ type }: { type: FlagType }) {
  return (
    <Badge tone="muted" mono>
      {type}
    </Badge>
  )
}

function TableSkeleton() {
  return (
    <Panel className="divide-y divide-line">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-raised" />
          <div className="h-4 flex-1 animate-pulse rounded bg-surface-raised" />
          <div className="h-5 w-9 animate-pulse rounded-full bg-surface-raised" />
        </div>
      ))}
    </Panel>
  )
}
