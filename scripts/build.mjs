import { build } from 'esbuild'
import { rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })

const shared = {
  bundle: true,
  platform: 'neutral',
  target: 'es2020',
  minify: false,
  sourcemap: true,
  external: ['openapi-fetch', 'node:crypto'],
}

// Classic API — ESM + CJS
await build({
  ...shared,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  format: 'esm',
})

await build({
  ...shared,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  format: 'cjs',
})

// Platform API — ESM + CJS
await build({
  ...shared,
  entryPoints: ['src/platform/index.ts'],
  outfile: 'dist/platform.mjs',
  format: 'esm',
})

await build({
  ...shared,
  entryPoints: ['src/platform/index.ts'],
  outfile: 'dist/platform.cjs',
  format: 'cjs',
})

console.log('✨ Esbuild complete (Classic ESM+CJS, Platform ESM+CJS)')
