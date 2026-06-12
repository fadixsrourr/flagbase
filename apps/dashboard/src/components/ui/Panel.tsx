import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-panel border border-line bg-surface/60 shadow-edge', className)}>
      {children}
    </div>
  )
}
