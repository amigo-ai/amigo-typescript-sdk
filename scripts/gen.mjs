import openapiTS, { astToString } from 'openapi-typescript'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const schemaUrl = 'https://api.amigo.ai/v1/openapi.json'
const outTypesFile = 'src/generated/api-types.ts'

/* -------- Fetch and fix the schema -------- */
console.log('📥 Fetching OpenAPI schema...')

let schema
try {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  const response = await fetch(schemaUrl, { signal: controller.signal })
  clearTimeout(timeout)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  schema = await response.json()
} catch (err) {
  if (err.name === 'AbortError') {
    throw new Error(`Failed to fetch schema: request timed out after 30s`)
  }
  throw new Error(`Failed to fetch schema: ${err.message}`)
}

// Fix broken discriminator mappings by removing references to non-existent schemas.
// The API sometimes has discriminator mappings that point to schemas that don't exist,
// which causes openapi-typescript to fail during validation.
const existingSchemas = new Set(Object.keys(schema.components?.schemas || {}))
let brokenMappingsCount = 0

function fixDiscriminatorMappings(obj) {
  if (!obj || typeof obj !== 'object') return

  if (obj.discriminator?.mapping) {
    const mapping = obj.discriminator.mapping
    for (const [key, ref] of Object.entries(mapping)) {
      // Extract schema name from $ref like "#/components/schemas/SchemaName"
      const schemaName = ref.replace('#/components/schemas/', '')
      if (!existingSchemas.has(schemaName)) {
        delete mapping[key]
        brokenMappingsCount++
        console.warn(`⚠️  Removing broken discriminator mapping: ${key} -> ${ref}`)
      }
    }
  }

  // Recursively process nested objects and arrays
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        fixDiscriminatorMappings(item)
      }
    } else if (typeof value === 'object' && value !== null) {
      fixDiscriminatorMappings(value)
    }
  }
}

fixDiscriminatorMappings(schema)

if (brokenMappingsCount > 0) {
  console.warn(`⚠️  Removed ${brokenMappingsCount} broken discriminator mapping(s) from schema`)
}

/* -------- TypeScript types -------- */
await mkdir(dirname(outTypesFile), { recursive: true })

let ast
try {
  ast = await openapiTS(schema, { defaultNonNullable: false })
} catch (err) {
  throw new Error(`Failed to generate TypeScript types: ${err.message}`)
}

// Convert AST to string and apply targeted overrides
let code = astToString(ast)

// Override ONLY the `interact-with-conversation` operation's requestBody to `any`
const interactOpPattern = /(\"interact-with-conversation\":\s*\{[\s\S]*?)(requestBody\?:\s*never;)/
code = code.replace(interactOpPattern, '$1requestBody?: any;')

// Strip noisy schema name prefix for cleaner consumer types
// e.g., components["schemas"]["src__app__endpoints__conversation__create_conversation__Request"]
//   => components["schemas"]["conversation__create_conversation__Request"]
code = code.replace(/src__app__endpoints__/g, '')

await writeFile(outTypesFile, code)

console.log('✅ OpenAPI types generated')
