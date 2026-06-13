import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { NextConfig } from 'next'

// __dirname is undefined in ESM. Walk up from cwd to find the workspace root
// (the directory that contains pnpm-workspace.yaml) instead.
function findWorkspaceRoot(dir: string): string {
  if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir
  const parent = resolve(dir, '..')
  return parent === dir ? dir : findWorkspaceRoot(parent)
}

const nextConfig: NextConfig = {
  turbopack: { root: findWorkspaceRoot(process.cwd()) },
  transpilePackages: ['@flagbase/types', 'flagbase-sdk', 'flagbase-react'],
}

export default nextConfig
