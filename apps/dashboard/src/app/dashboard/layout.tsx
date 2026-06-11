import { TopBar } from '@/components/shell/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">{children}</main>
    </div>
  )
}
