import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@flagbase/types', 'flagbase-sdk', 'flagbase-react'],
}

export default nextConfig
