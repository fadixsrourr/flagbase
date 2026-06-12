'use client'

import { useState } from 'react'
import { CaretRight } from '@phosphor-icons/react'
import type { AuditAction, AuditLogEntry } from '@flagbase/types'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const ACTION_LABELS: Record<AuditAction, string> = {
  'flag.created': 'Created',
  'flag.updated': 'Updated',
  'flag.deleted': 'Deleted',
  'flag.enabled': 'Enabled',
  'flag.disabled': 'Disabled',
}

export function AuditList({
  entries,
  showFlagKey = false,
}: {
  entries: AuditLogEntry[]
  showFlagKey?: boolean
}) {
  if (entries.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-content-faint">No activity yet.</p>
  }
  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <AuditRow key={entry.id} entry={entry} showFlagKey={showFlagKey} />
      ))}
    </ul>
  )
}

function AuditRow({ entry, showFlagKey }: { entry: AuditLogEntry; showFlagKey: boolean }) {
  const [open, setOpen] = useState(false)
  const hasDiff = Boolean(entry.before || entry.after)

  return (
    <li>
      <button
        type="button"
        onClick={() => hasDiff && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 px-5 py-3.5 text-left',
          hasDiff && 'cursor-pointer hover:bg-surface-raised/40'
        )}
      >
        <CaretRight
          className={cn(
            'size-3.5 shrink-0 text-content-faint transition-transform',
            open && 'rotate-90',
            !hasDiff && 'opacity-0'
          )}
          aria-hidden
        />
        <Badge tone="muted">{ACTION_LABELS[entry.action] ?? entry.action}</Badge>
        {showFlagKey && <span className="font-mono text-sm text-content">{entry.flagKey}</span>}
        <span className="ml-auto flex items-center gap-4 text-xs text-content-faint">
          <span className="font-mono" title={entry.performedBy}>
            {entry.performedBy.slice(0, 8)}
          </span>
          <span>{formatDateTime(entry.performedAt)}</span>
        </span>
      </button>

      {open && hasDiff && (
        <div className="grid gap-3 border-t border-line bg-carbon/40 px-5 py-4 sm:grid-cols-2">
          <DiffBlock label="Before" data={entry.before} />
          <DiffBlock label="After" data={entry.after} />
        </div>
      )}
    </li>
  )
}

function DiffBlock({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-[0.12em] text-content-faint">{label}</span>
      <pre className="overflow-x-auto rounded-control border border-line bg-surface-raised p-3 font-mono text-xs text-content-muted">
        {data ? JSON.stringify(data, null, 2) : '—'}
      </pre>
    </div>
  )
}
