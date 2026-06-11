export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <div className="h-7 w-40 animate-pulse rounded-control bg-surface-raised" />
        <div className="h-4 w-72 animate-pulse rounded-control bg-surface-raised" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-panel border border-line bg-surface/60"
          />
        ))}
      </div>
    </div>
  )
}
