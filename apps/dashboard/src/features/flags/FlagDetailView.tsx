'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { FlagForm } from './FlagForm'
import { FlagTypeBadge } from './FlagsView'
import { AuditList } from './AuditList'
import { useFlag, useDeleteFlag, useFlagAudit } from './hooks'

export function FlagDetailView({
  projectId,
  env,
  flagId,
}: {
  projectId: string
  env: string
  flagId: string
}) {
  const router = useRouter()
  const { data: flag, isLoading, isError } = useFlag(projectId, env, flagId)
  const del = useDeleteFlag(projectId, env)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  if (isLoading) {
    return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-panel border border-line bg-surface/60" />
  }
  if (isError || !flag) {
    return <p className="text-sm text-danger">Flag not found.</p>
  }

  async function handleDelete() {
    await del.mutateAsync(flagId)
    router.push(`/dashboard/${projectId}/flags?env=${env}`)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${projectId}/flags?env=${env}`}
          className="inline-flex items-center gap-1.5 text-sm text-content-faint transition-colors hover:text-content"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to flags
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-content">{flag.key}</h1>
          <FlagTypeBadge type={flag.type} />
          <Badge tone={flag.enabled ? 'accent' : 'muted'}>
            {flag.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <p className="text-sm text-content-muted">
          {flag.name}
          {flag.description ? ` · ${flag.description}` : ''}
        </p>
      </div>

      <FlagForm
        key={flag.id}
        projectId={projectId}
        env={env}
        flag={flag}
        onSaved={() => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        }}
      />
      {saved && (
        <p className="text-right text-sm text-accent" role="status">
          Changes saved.
        </p>
      )}

      <Panel>
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-medium text-content">Audit log</h2>
        </div>
        <FlagAuditPanel projectId={projectId} env={env} flagId={flagId} />
      </Panel>

      <Panel className="flex flex-wrap items-center justify-between gap-4 border-danger/30 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium text-content">Delete flag</h3>
          <p className="text-sm text-content-faint">
            Removes this flag and its audit history. This cannot be undone.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setConfirmOpen(true)}
          className="border-danger/40 text-danger hover:border-danger hover:bg-danger/10"
        >
          Delete flag
        </Button>
      </Panel>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={del.isPending}
        destructive
        title="Delete flag"
        description={`Delete "${flag.key}"? This removes the flag and its audit history.`}
        confirmLabel="Delete flag"
      />
    </div>
  )
}

function FlagAuditPanel({
  projectId,
  env,
  flagId,
}: {
  projectId: string
  env: string
  flagId: string
}) {
  const { data: entries, isLoading } = useFlagAudit(projectId, env, flagId)

  if (isLoading) {
    return <p className="px-5 py-8 text-center text-sm text-content-faint">Loading activity…</p>
  }
  return <AuditList entries={(entries ?? []).slice(0, 50)} />
}
