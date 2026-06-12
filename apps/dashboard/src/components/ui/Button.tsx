import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { CircleNotch } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink font-medium hover:bg-accent-bright shadow-edge',
  secondary:
    'bg-surface-raised text-content border border-line hover:bg-surface-hover hover:border-line-strong',
  ghost: 'text-content-muted hover:text-content hover:bg-surface-raised',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-control whitespace-nowrap',
    'transition-[background-color,border-color,color,transform] duration-200',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-55',
    'cursor-pointer',
    variants[variant],
    sizes[size],
    className
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled ?? loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <CircleNotch weight="bold" className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
