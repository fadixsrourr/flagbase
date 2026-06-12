import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'accent' | 'danger' | 'muted'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-raised text-content border-line',
  accent: 'bg-accent/12 text-accent border-accent/25',
  danger: 'bg-danger/12 text-danger border-danger/30',
  muted: 'bg-surface-raised text-content-faint border-line',
}

interface BadgeProps {
  tone?: Tone
  className?: string
  mono?: boolean
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, mono, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        mono && 'font-mono',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
