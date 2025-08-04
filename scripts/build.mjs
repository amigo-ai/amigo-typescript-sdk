import { build } from 'esbuild'
import { rm } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })

await build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  minify: false,
  sourcemap: true,
  external: ['openapi-fetch'], // keep small, let consumer install once
})

console.log('✨ Esbuild complete')
