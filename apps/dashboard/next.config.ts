import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@flagbase/types', 'flagbase-js', '@flagbase/react'],
}

export default nextConfig
