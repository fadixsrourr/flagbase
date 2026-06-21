'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle, Warning, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils/cn'

type ToastTone = 'success' | 'error'

interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, tone }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}

const TONES: Record<ToastTone, { color: string; ariaLive: 'polite' | 'assertive' }> = {
  success: { color: 'text-accent', ariaLive: 'polite' },
  error: { color: 'text-danger', ariaLive: 'assertive' },
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { color, ariaLive } = TONES[toast.tone]
  const Icon = toast.tone === 'success' ? CheckCircle : Warning
  return (
    <div
      role="status"
      aria-live={ariaLive}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-control border border-line bg-surface-raised px-4 py-3 shadow-panel animate-fade-up"
    >
      <Icon weight="fill" className={cn('mt-0.5 size-5 shrink-0', color)} aria-hidden />
      <p className="flex-1 text-sm text-content">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="cursor-pointer rounded-control p-0.5 text-content-faint transition-colors hover:bg-surface-hover hover:text-content"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
