import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Inline @flagbase/types into the bundle and the .d.ts so the published
  // package is self-contained (the types package is never published).
  dts: { resolve: ['@flagbase/types'] },
  clean: true,
  sourcemap: true,
  // firebase is a peer dependency — never bundle it.
  external: ['firebase'],
})
