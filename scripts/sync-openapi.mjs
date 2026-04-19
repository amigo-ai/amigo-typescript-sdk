import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = process.cwd()
const OUT_FILE = path.resolve(REPO_ROOT, 'specs/openapi-baseline.json')
const DEFAULT_URL = 'https://api.amigo.ai/v1/openapi.json'
const args = process.argv.slice(2)

function getArgValue(name) {
  const index = args.indexOf(name)
  return index === -1 ? undefined : args[index + 1]
}

async function loadSpec() {
  const specArg = getArgValue('--spec')
  if (specArg) {
    const specPath = path.resolve(REPO_ROOT, specArg)
    console.log(`Syncing OpenAPI snapshot from file: ${specPath}`)
    const raw = fs.readFileSync(specPath, 'utf-8')
    return JSON.parse(raw)
  }

  const specUrl = getArgValue('--url') ?? DEFAULT_URL
  console.log(`Syncing OpenAPI snapshot from URL: ${specUrl}`)

  const response = await fetch(specUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI schema: HTTP ${response.status} ${response.statusText}`)
  }

  return response.json()
}

const document = await loadSpec()

if (!document || typeof document !== 'object' || typeof document.openapi !== 'string') {
  throw new Error('Invalid OpenAPI document received while syncing snapshot.')
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, `${JSON.stringify(document, null, 2)}\n`)

console.log(`Wrote ${OUT_FILE}`)
