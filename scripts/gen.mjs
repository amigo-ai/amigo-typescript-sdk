import openapiTS, { astToString } from 'openapi-typescript'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const schemaUrl = 'https://api.amigo.ai/v1/openapi.json'
const outTypesFile = 'src/generated/api-types.ts'

/* -------- TypeScript types -------- */
await mkdir(dirname(outTypesFile), { recursive: true })
const ast = await openapiTS(schemaUrl, { defaultNonNullable: false })

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
