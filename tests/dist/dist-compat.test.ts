import { describe, test, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '../..')
const fixturesDir = resolve(__dirname, 'fixtures')
const cjsDistPath = resolve(rootDir, 'dist/index.cjs')
const esmDistPath = resolve(rootDir, 'dist/index.mjs')

/**
 * Runs a fixture script and returns its stdout.
 * Fixtures are separate .cjs/.mjs files that test the dist builds
 * in their native module environments.
 */
function runFixture(fixtureName: string): string {
  const fixturePath = resolve(fixturesDir, fixtureName)
  return execFileSync('node', [fixturePath], {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

describe('Distribution Compatibility', () => {
  beforeAll(() => {
    // Verify build outputs exist
    if (!existsSync(cjsDistPath)) {
      throw new Error(
        'dist/index.cjs not found. Run `npm run build` first before running dist tests.'
      )
    }
    if (!existsSync(esmDistPath)) {
      throw new Error(
        'dist/index.mjs not found. Run `npm run build` first before running dist tests.'
      )
    }
  })

  describe('CJS (CommonJS)', () => {
    test('can be required and exports are accessible', () => {
      const result = runFixture('cjs-exports.cjs')
      expect(result.trim()).toBe('CJS exports: OK')
    })

    test('can instantiate AmigoClient (validates openapi-fetch interop)', () => {
      // This is the critical test - instantiating AmigoClient triggers the
      // openapi-fetch import which was causing the .default.default issue
      const result = runFixture('cjs-instantiate.cjs')
      expect(result.trim()).toBe('CJS instantiation: OK')
    })

    test('error classes can be instantiated and used', () => {
      const result = runFixture('cjs-errors.cjs')
      expect(result.trim()).toBe('CJS errors: OK')
    })
  })

  describe('ESM (ES Modules)', () => {
    test('can be imported and exports are accessible', () => {
      const result = runFixture('esm-exports.mjs')
      expect(result.trim()).toBe('ESM exports: OK')
    })

    test('can instantiate AmigoClient', () => {
      const result = runFixture('esm-instantiate.mjs')
      expect(result.trim()).toBe('ESM instantiation: OK')
    })

    test('error classes can be instantiated and used', () => {
      const result = runFixture('esm-errors.mjs')
      expect(result.trim()).toBe('ESM errors: OK')
    })
  })
})
