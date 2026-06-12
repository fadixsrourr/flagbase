import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { CaretDown } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, ...props },
  ref
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  const field = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-11 w-full cursor-pointer appearance-none rounded-control border border-line bg-surface-raised pl-3.5 pr-10 text-content',
          'transition-colors hover:border-line-strong focus:border-accent/60',
          error && 'border-danger/70',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface text-content">
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-content-faint"
        aria-hidden
      />
    </div>
  )

  if (!label && !error) return field

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-content-muted">
          {label}
        </label>
      )}
      {field}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
})
