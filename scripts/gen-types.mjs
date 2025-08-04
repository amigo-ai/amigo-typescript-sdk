import openapiTS, { astToString } from 'openapi-typescript'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const schema_url = 'https://api.amigo.ai/v1/openapi.json'
const outFile = 'src/generated/api-types.ts'

const ast = await openapiTS(schema_url)
const content = astToString(ast)

await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, content)

console.log(`✅ OpenAPI types written to ${outFile}`)
