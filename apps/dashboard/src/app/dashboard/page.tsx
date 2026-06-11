import { Stack, Plus } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-content">Projects</h1>
        <p className="text-sm text-content-muted">
          Group your flags by application and roll them out per environment.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-panel border border-line bg-surface/60 px-6 py-16 text-center shadow-edge">
        <span className="grid size-12 place-items-center rounded-panel border border-line bg-surface-raised text-accent">
          <Stack weight="duotone" className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-medium text-content">No projects yet</h2>
          <p className="max-w-sm text-sm text-content-muted">
            Project creation and full flag management arrive in Phase 4. Auth is
            wired and ready.
          </p>
        </div>
        <Button disabled>
          <Plus weight="bold" className="size-4" aria-hidden />
          New project
        </Button>
      </div>
    </div>
  )
}
