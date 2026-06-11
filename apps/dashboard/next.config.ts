import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: { root: path.join(__dirname, '..', '..') },
  transpilePackages: ['@flagbase/types', 'flagbase-js', '@flagbase/react'],
}

export default nextConfig
