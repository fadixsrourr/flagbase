import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlagBase — Feature Flag Dashboard',
  description: 'Self-hosted feature flag management powered by Firebase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
