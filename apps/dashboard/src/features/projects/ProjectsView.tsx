'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Stack, FolderOpen } from '@phosphor-icons/react'
import type { Project } from '@flagbase/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils/format'
import { useProjects } from './hooks'
import { NewProjectModal } from './NewProjectModal'

export function ProjectsView() {
  const { data: projects, isLoading, isError } = useProjects()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-content">Projects</h1>
          <p className="text-sm text-content-muted">
            Group your flags by application and roll them out per environment.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus weight="bold" className="size-4" aria-hidden />
          New project
        </Button>
      </div>

      {isLoading && <ProjectGridSkeleton />}

      {isError && (
        <p className="text-sm text-danger">Could not load projects. Check your connection.</p>
      )}

      {projects && projects.length === 0 && (
        <EmptyState
          icon={<Stack weight="duotone" className="size-6" />}
          title="No projects yet"
          description="Create your first project to start managing feature flags."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus weight="bold" className="size-4" aria-hidden />
              New project
            </Button>
          }
        />
      )}

      {projects && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/dashboard/${project.id}/flags`}
      className="group flex flex-col gap-4 rounded-panel border border-line bg-surface/60 p-5 shadow-edge transition-colors hover:border-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-[9px] border border-line bg-surface-raised text-accent">
          <FolderOpen weight="duotone" className="size-5" aria-hidden />
        </span>
        <span className="font-mono text-xs text-content-faint">
          {project.environments.length} envs
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium text-content transition-colors group-hover:text-accent">
          {project.name}
        </h3>
        <span className="font-mono text-xs text-content-muted">{project.slug}</span>
      </div>
      <span className="text-xs text-content-faint">Created {formatDate(project.createdAt)}</span>
    </Link>
  )
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-panel border border-line bg-surface/60"
        />
      ))}
    </div>
  )
}
