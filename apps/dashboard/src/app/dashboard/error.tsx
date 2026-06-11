'use client'

import { useEffect } from 'react'
import { WarningOctagon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-5 rounded-panel border border-line bg-surface/60 px-6 py-16 text-center shadow-edge">
      <span className="grid size-12 place-items-center rounded-panel border border-danger/40 bg-danger/10 text-danger">
        <WarningOctagon weight="duotone" className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium text-content">Something went wrong</h2>
        <p className="max-w-sm text-sm text-content-muted">
          The control plane hit an unexpected error. Try again, or reload the page.
        </p>
      </div>
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
