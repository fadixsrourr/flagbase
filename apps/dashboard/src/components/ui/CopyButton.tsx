'use client'

import { useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils/cn'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copy', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-control border border-line bg-surface-raised px-2.5 py-1.5 text-xs text-content-muted',
        'transition-colors hover:border-line-strong hover:text-content',
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? 'Copied' : label}
    </button>
  )
}
