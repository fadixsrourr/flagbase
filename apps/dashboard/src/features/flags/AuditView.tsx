'use client'

import { ClockCounterClockwise } from '@phosphor-icons/react'
import { Panel } from '@/components/ui/Panel'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuditList } from './AuditList'
import { useProjectAudit } from './hooks'

export function AuditView({ projectId, env }: { projectId: string; env: string }) {
  const { data: entries, isLoading, isError } = useProjectAudit(projectId, env)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-content">Audit log</h1>
        <p className="text-sm text-content-muted">
          Every change made to flags in this environment. Open a row to see the diff.
        </p>
      </div>

      {isLoading && (
        <div className="h-64 animate-pulse rounded-panel border border-line bg-surface/60" />
      )}
      {isError && <p className="text-sm text-danger">Could not load audit log.</p>}

      {entries && entries.length === 0 && (
        <EmptyState
          icon={<ClockCounterClockwise weight="duotone" className="size-6" />}
          title="No activity yet"
          description="Flag changes in this environment will show up here."
        />
      )}

      {entries && entries.length > 0 && (
        <Panel>
          <AuditList entries={entries} showFlagKey />
        </Panel>
      )}
    </div>
  )
}
