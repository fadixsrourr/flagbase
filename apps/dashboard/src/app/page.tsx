import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">🚩 FlagBase</h1>
        <p className="mt-2 text-gray-500">Self-hosted feature flags, powered by Firebase</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <a
          href="https://github.com/your-username/flagbase"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          GitHub
        </a>
      </div>
    </main>
  )
}
