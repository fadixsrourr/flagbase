import { Suspense } from 'react'
import { ProjectSidebar } from '@/components/shell/ProjectSidebar'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <Suspense fallback={<div className="h-64 w-full lg:w-56" />}>
        <ProjectSidebar />
      </Suspense>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
