import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-panel border border-line bg-surface/60 px-6 py-16 text-center shadow-edge">
      <span className="grid size-12 place-items-center rounded-panel border border-line bg-surface-raised text-accent">
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-medium text-content">{title}</h3>
        {description && <p className="max-w-sm text-sm text-content-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
