'use client'

import { useRouter } from 'next/navigation'
import { SignOut } from '@phosphor-icons/react'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/client/auth-context'

export function TopBar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace('/login')
    router.refresh()
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-carbon/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Wordmark />

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="grid size-8 place-items-center rounded-full border border-line bg-surface-raised text-xs font-medium text-content">
              {initial}
            </span>
            <span className="font-mono text-xs text-content-muted">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <SignOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
