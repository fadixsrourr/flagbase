import { cn } from '@/lib/utils/cn'
import { BrandMark } from './BrandMark'

interface WordmarkProps {
  className?: string
  showText?: boolean
}

export function Wordmark({ className, showText = true }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-7 place-items-center rounded-[7px] bg-brand-navy text-accent shadow-edge">
        <BrandMark className="size-full" />
      </span>
      {showText && (
        <span className="font-mono text-[15px] font-semibold tracking-tight text-content">
          flag<span className="text-content-faint">base</span>
        </span>
      )}
    </span>
  )
}
