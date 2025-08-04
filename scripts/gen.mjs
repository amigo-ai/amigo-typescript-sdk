import openapiTS, { astToString } from 'openapi-typescript'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const schemaUrl = 'https://api.amigo.ai/v1/openapi.json'
const outTypesFile = 'src/generated/api-types.ts'

/* -------- TypeScript types -------- */
await mkdir(dirname(outTypesFile), { recursive: true })
const ast = await openapiTS(schemaUrl)
await writeFile(outTypesFile, astToString(ast))

console.log('✅ OpenAPI types generated')
