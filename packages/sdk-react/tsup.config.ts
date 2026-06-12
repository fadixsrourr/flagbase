import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Inline @flagbase/types so the published package is self-contained.
  // flagbase-sdk stays external — it ships as a real npm dependency.
  dts: { resolve: ['@flagbase/types'] },
  clean: true,
  sourcemap: true,
  external: ['react', 'flagbase-sdk'],
})
