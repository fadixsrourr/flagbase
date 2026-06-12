'use client'

import { cn } from '@/lib/utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, disabled, label, size = 'md' }: ToggleProps) {
  const dims =
    size === 'sm'
      ? { track: 'h-5 w-9', knob: 'size-4', on: 'translate-x-4' }
      : { track: 'h-6 w-11', knob: 'size-5', on: 'translate-x-5' }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        dims.track,
        checked ? 'border-accent bg-accent/90' : 'border-line bg-surface-raised'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 rounded-full bg-content shadow-sm transition-transform duration-200',
          dims.knob,
          checked && dims.on
        )}
      />
    </button>
  )
}
