'use client'

import { useController, type Control, type FieldPath } from 'react-hook-form'
import type { FlagType } from '@flagbase/types'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils/cn'
import type { FlagFormValues } from './flag-form'

interface TypedValueFieldProps {
  control: Control<FlagFormValues>
  name: FieldPath<FlagFormValues>
  type: FlagType
  label?: string
  error?: string
  compact?: boolean
}

export function TypedValueField({
  control,
  name,
  type,
  label,
  error,
  compact,
}: TypedValueFieldProps) {
  const { field } = useController({ control, name })
  const value = (field.value as string) ?? ''

  const inputClasses = cn(
    'w-full rounded-control border bg-surface-raised text-content placeholder:text-content-faint',
    'transition-colors hover:border-line-strong focus:border-accent/60',
    error ? 'border-danger/70' : 'border-line',
    compact ? 'h-10 px-3 text-sm' : 'h-11 px-3.5'
  )

  let input
  if (type === 'boolean') {
    input = (
      <div className="flex h-10 items-center gap-2.5">
        <Toggle checked={value === 'true'} onChange={(v) => field.onChange(v ? 'true' : 'false')} />
        <span className="font-mono text-sm text-content-muted">{value === 'true' ? 'true' : 'false'}</span>
      </div>
    )
  } else if (type === 'number') {
    input = (
      <input
        type="number"
        value={value}
        onChange={(e) => field.onChange(e.target.value)}
        className={inputClasses}
      />
    )
  } else if (type === 'json') {
    input = (
      <textarea
        value={value}
        onChange={(e) => field.onChange(e.target.value)}
        spellCheck={false}
        className={cn(
          'min-h-[120px] w-full resize-y rounded-control border bg-surface-raised px-3.5 py-2.5 font-mono text-sm text-content',
          'transition-colors hover:border-line-strong focus:border-accent/60',
          error ? 'border-danger/70' : 'border-line'
        )}
      />
    )
  } else {
    input = (
      <input
        type="text"
        value={value}
        onChange={(e) => field.onChange(e.target.value)}
        className={inputClasses}
      />
    )
  }

  if (!label && !error) return input

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-content-muted">{label}</label>}
      {input}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
