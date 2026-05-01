import fs from 'node:fs'
import path from 'node:path'
import openapiTS, { astToString } from 'openapi-typescript'

const REPO_ROOT = process.cwd()
const DEFAULT_SPEC = path.resolve(REPO_ROOT, 'specs/openapi-baseline.json')
const OUT_FILE = path.resolve(REPO_ROOT, 'src/generated/api-types.ts')
const args = process.argv.slice(2)

function getArgValue(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

function resolveSpecSource() {
  const specArg = getArgValue('--spec')
  if (specArg) {
    const resolvedPath = path.resolve(REPO_ROOT, specArg)
    console.log(`Using explicit spec: ${resolvedPath}`)
    return resolvedPath
  }

  if (fs.existsSync(DEFAULT_SPEC)) {
    console.log(`Using committed spec snapshot: ${DEFAULT_SPEC}`)
    return DEFAULT_SPEC
  }

  throw new Error(
    'No committed OpenAPI snapshot found at specs/openapi-baseline.json. Run `npm run openapi:sync` first.',
  )
}

async function loadSpec(specSource) {
  const raw = fs.readFileSync(specSource, 'utf-8')
  const document = JSON.parse(raw)

  if (!document || typeof document !== 'object' || typeof document.openapi !== 'string') {
    throw new Error(`Invalid OpenAPI document: ${specSource}`)
  }

  return document
}

function patchOpenApiDocument(schema) {
  const existingSchemas = new Set(Object.keys(schema.components?.schemas || {}))

  function fixDiscriminatorMappings(obj) {
    if (!obj || typeof obj !== 'object') return

    if (obj.discriminator?.mapping) {
      const mapping = obj.discriminator.mapping
      for (const [key, ref] of Object.entries(mapping)) {
        const schemaName = ref.replace('#/components/schemas/', '')
        if (!existingSchemas.has(schemaName)) {
          delete mapping[key]
          console.warn(`Removing broken discriminator mapping: ${key} -> ${ref}`)
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

  const seenOperationIds = new Map()
  for (const [pathKey, methods] of Object.entries(schema.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation !== 'object' || !operation.operationId) continue

      const operationId = operation.operationId
      if (seenOperationIds.has(operationId)) {
        const nextOperationId = `${operationId}-${method}`
        console.warn(
          `Fixing duplicate operationId: ${operationId} -> ${nextOperationId} (${method.toUpperCase()} ${pathKey})`,
        )
        operation.operationId = nextOperationId
      } else {
        seenOperationIds.set(operationId, true)
      }
    }
  }

  return schema
}

const specSource = resolveSpecSource()
console.log(`Generating types from: ${specSource}`)

const schema = patchOpenApiDocument(await loadSpec(specSource))
const ast = await openapiTS(schema, { defaultNonNullable: false })

let code = astToString(ast)

const interactOpPattern = /(\"interact-with-conversation\":\s*\{[\s\S]*?)(requestBody\?:\s*never;)/
code = code.replace(interactOpPattern, '$1requestBody?: any;')
code = code.replace(/src__app__endpoints__/g, '')

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, code)

const pathCount = Object.keys(schema.paths || {}).length
const schemaCount = Object.keys(schema.components?.schemas || {}).length
console.log(`Generated ${OUT_FILE}: ${pathCount} paths, ${schemaCount} schemas`)
