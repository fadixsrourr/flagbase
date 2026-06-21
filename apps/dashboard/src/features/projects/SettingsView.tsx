'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Project } from '@flagbase/types'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CopyButton } from '@/components/ui/CopyButton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { useProject, useUpdateProject, useDeleteProject, useRegenerateApiKey } from './hooks'

export function SettingsView({ projectId }: { projectId: string }) {
  const { data: project, isLoading } = useProject(projectId)

  if (isLoading || !project) {
    return <div className="h-96 max-w-2xl animate-pulse rounded-panel border border-line bg-surface/60" />
  }

  return (
    <div className="flex max-w-2xl flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-content">Settings</h1>
        <p className="text-sm text-content-muted">Manage this project and its environment keys.</p>
      </div>

      <ProjectNameSection projectId={projectId} project={project} />
      <ApiKeysSection projectId={projectId} project={project} />
      <DangerSection projectId={projectId} />
    </div>
  )
}

const nameSchema = z.object({ name: z.string().min(1, 'Name is required') })
type NameForm = z.infer<typeof nameSchema>

function ProjectNameSection({ projectId, project }: { projectId: string; project: Project }) {
  const update = useUpdateProject(projectId)
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NameForm>({ resolver: zodResolver(nameSchema), defaultValues: { name: project.name } })

  async function onSubmit(values: NameForm) {
    await update.mutateAsync({ name: values.name })
    toast.success('Project name saved.')
  }

  return (
    <Panel className="flex flex-col gap-4 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-content-faint">Project</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3">
        <div className="flex-1">
          <TextField label="Name" error={errors.name?.message} {...register('name')} />
        </div>
        <div className="pt-[1.85rem]">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save
          </Button>
        </div>
      </form>
      <p className="font-mono text-xs text-content-faint">slug: {project.slug}</p>
    </Panel>
  )
}

function ApiKeysSection({ projectId, project }: { projectId: string; project: Project }) {
  const regenerate = useRegenerateApiKey(projectId)
  const [regenEnv, setRegenEnv] = useState<string | null>(null)

  return (
    <Panel className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-content-faint">
          Environment API keys
        </h2>
        <p className="text-sm text-content-faint">
          Use these in the flagbase SDK config. Treat them like secrets.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {project.environments.map((env) => (
          <div
            key={env.key}
            className="flex flex-col gap-2.5 rounded-control border border-line bg-surface-raised/50 p-3.5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-content">{env.name}</span>
              <div className="flex items-center gap-2">
                <CopyButton value={env.apiKey} />
                <Button size="sm" variant="ghost" onClick={() => setRegenEnv(env.key)}>
                  Regenerate
                </Button>
              </div>
            </div>
            <code className="overflow-x-auto rounded bg-carbon/60 px-3 py-2 font-mono text-xs text-content-muted">
              {env.apiKey}
            </code>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={regenEnv !== null}
        onClose={() => setRegenEnv(null)}
        onConfirm={async () => {
          if (regenEnv) await regenerate.mutateAsync(regenEnv)
          setRegenEnv(null)
        }}
        loading={regenerate.isPending}
        destructive
        title="Regenerate API key"
        description="The current key stops working immediately. Update your SDK config with the new key."
        confirmLabel="Regenerate"
      />
    </Panel>
  )
}

function DangerSection({ projectId }: { projectId: string }) {
  const router = useRouter()
  const del = useDeleteProject()
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    await del.mutateAsync(projectId)
    router.push('/dashboard')
  }

  return (
    <Panel className="flex flex-wrap items-center justify-between gap-4 border-danger/30 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-content">Delete project</h2>
        <p className="text-sm text-content-faint">
          Deletes the project, all environments, flags and audit history.
        </p>
      </div>
      <Button
        variant="secondary"
        className="border-danger/40 text-danger hover:border-danger hover:bg-danger/10"
        onClick={() => setOpen(true)}
      >
        Delete project
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={del.isPending}
        destructive
        title="Delete project"
        description="This permanently deletes the project and everything in it. This cannot be undone."
        confirmLabel="Delete project"
      />
    </Panel>
  )
}
