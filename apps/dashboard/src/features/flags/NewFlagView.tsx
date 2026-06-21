'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react'
import { useToast } from '@/components/ui/Toast'
import { FlagForm } from './FlagForm'

export function NewFlagView({ projectId, env }: { projectId: string; env: string }) {
  const router = useRouter()
  const toast = useToast()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${projectId}/flags?env=${env}`}
          className="inline-flex items-center gap-1.5 text-sm text-content-faint transition-colors hover:text-content"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to flags
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-content">New flag</h1>
      </div>

      <FlagForm
        projectId={projectId}
        env={env}
        onSaved={(flag) => {
          toast.success('Flag created.')
          router.push(`/dashboard/${projectId}/flags/${flag.id}?env=${env}`)
        }}
      />
    </div>
  )
}
