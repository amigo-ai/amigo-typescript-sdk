import openapiTS, { astToString } from 'openapi-typescript'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const schemaUrl = 'https://api.platform.amigo.ai/v1/openapi.json'
const outTypesFile = 'src/generated/platform-api-types.ts'
const localSchemaFile = '../platform/services/platform-api/openapi.json'
const committedSchemaFile = 'specs/platform-openapi.json'

async function fileExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function loadSchema() {
  const configuredSource = process.env.PLATFORM_OPENAPI_SCHEMA
  const defaultLocalSource = resolve(localSchemaFile)
  const defaultCommittedSource = resolve(committedSchemaFile)
  const source =
    configuredSource ??
    ((await fileExists(defaultLocalSource))
      ? defaultLocalSource
      : (await fileExists(defaultCommittedSource))
        ? defaultCommittedSource
        : schemaUrl)

  if (source.startsWith('http://') || source.startsWith('https://')) {
    console.log(`📥 Fetching Platform API OpenAPI schema from ${source}...`)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(source, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Failed to fetch schema: request timed out after 30s`)
      }
      throw new Error(`Failed to fetch schema: ${err.message}`)
    } finally {
      clearTimeout(timeout)
    }
  }

  const filePath = resolve(source)
  console.log(`📄 Reading Platform API OpenAPI schema from ${filePath}...`)
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to read schema file ${filePath}: ${err.message}`)
  }
}

/* -------- Fetch and fix the schema -------- */
let schema = await loadSchema()

// Fix broken discriminator mappings by removing references to non-existent schemas.
const existingSchemas = new Set(Object.keys(schema.components?.schemas || {}))
let brokenMappingsCount = 0

function fixDiscriminatorMappings(obj) {
  if (!obj || typeof obj !== 'object') return

  if (obj.discriminator?.mapping) {
    const mapping = obj.discriminator.mapping
    for (const [key, ref] of Object.entries(mapping)) {
      const schemaName = ref.replace('#/components/schemas/', '')
      if (!existingSchemas.has(schemaName)) {
        delete mapping[key]
        brokenMappingsCount++
        console.warn(`⚠️  Removing broken discriminator mapping: ${key} -> ${ref}`)
      }
    }
  }

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

// FastAPI dependency-based path params can be omitted from OpenAPI operation
// parameter lists even when the path template contains them. Add the missing
// path parameters so generated clients can type and fill every URL segment.
let pathParamFixCount = 0
for (const [path, pathItem] of Object.entries(schema.paths || {})) {
  const paramNames = [...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1])
  if (paramNames.length === 0 || !pathItem || typeof pathItem !== 'object') continue

  for (const [method, op] of Object.entries(pathItem)) {
    if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method)) {
      continue
    }
    if (!op || typeof op !== 'object') continue

    op.parameters ??= []
    for (const name of paramNames) {
      const hasParam = op.parameters.some(
        (param) =>
          param &&
          typeof param === 'object' &&
          param.name === name &&
          param.in === 'path'
      )
      if (!hasParam) {
        op.parameters.unshift({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
        })
        pathParamFixCount++
      }
    }
  }
}

if (pathParamFixCount > 0) {
  console.warn(`⚠️  Added ${pathParamFixCount} missing path parameter definition(s)`)
}

// Fix duplicate operationIds by appending the HTTP method to make them unique.
const seenOperationIds = new Map()
let duplicateFixCount = 0

for (const [path, methods] of Object.entries(schema.paths || {})) {
  for (const [method, op] of Object.entries(methods)) {
    if (typeof op !== 'object' || !op.operationId) continue
    const key = op.operationId
    if (seenOperationIds.has(key)) {
      const newId = `${key}-${method}`
      console.warn(
        `⚠️  Fixing duplicate operationId: ${key} -> ${newId} (${method.toUpperCase()} ${path})`
      )
      op.operationId = newId
      duplicateFixCount++
    } else {
      seenOperationIds.set(key, `${method.toUpperCase()} ${path}`)
    }
  }
}

if (duplicateFixCount > 0) {
  console.warn(`⚠️  Fixed ${duplicateFixCount} duplicate operationId(s) in schema`)
}

/* -------- TypeScript types -------- */
await mkdir(dirname(outTypesFile), { recursive: true })

let ast
try {
  ast = await openapiTS(schema, { defaultNonNullable: false })
} catch (err) {
  throw new Error(`Failed to generate TypeScript types: ${err.message}`)
}

let code = astToString(ast)

await writeFile(outTypesFile, code)

console.log('✅ Platform API types generated')
