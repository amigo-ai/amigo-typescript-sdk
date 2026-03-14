/**
 * Snapshot tests for generated types.
 * Detects unexpected changes to the generated type definitions.
 *
 * Run: npx vitest run tests/type-snapshots.test.ts
 * Update snapshots: npx vitest run tests/type-snapshots.test.ts --update
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const GENERATED_TYPES_PATH = join(__dirname, '..', 'src', 'generated', 'api-types.ts')

function extractTypeNames(content: string): string[] {
  const typeRegex = /export\s+(?:type|interface)\s+(\w+)/g
  const names: string[] = []
  let match: RegExpExecArray | null
  while ((match = typeRegex.exec(content)) !== null) {
    names.push(match[1]!)
  }
  return names.sort()
}

function extractOperationIds(content: string): string[] {
  const opRegex = /"([a-z][\w-]+)":\s*\{/g
  const ops: string[] = []
  let match: RegExpExecArray | null

  // Look in the operations section
  const opsSection = content.match(/export\s+interface\s+operations\s*\{([\s\S]*?)^\}/m)
  if (opsSection) {
    while ((match = opRegex.exec(opsSection[1]!)) !== null) {
      ops.push(match[1]!)
    }
  }
  return ops.sort()
}

describe('Generated Type Snapshots', () => {
  const content = readFileSync(GENERATED_TYPES_PATH, 'utf8')

  it('should have stable exported type names', () => {
    const typeNames = extractTypeNames(content)
    expect(typeNames).toMatchSnapshot()
  })

  it('should have stable operation IDs', () => {
    const operationIds = extractOperationIds(content)
    expect(operationIds).toMatchSnapshot()
  })

  it('should export components, operations, and paths interfaces', () => {
    expect(content).toContain('export interface components')
    expect(content).toContain('export interface operations')
    expect(content).toContain('export interface paths')
  })
})
