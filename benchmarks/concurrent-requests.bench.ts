import { performance } from 'node:perf_hooks'

const API_KEY = process.env.AMIGO_API_KEY!
const API_KEY_ID = process.env.AMIGO_API_KEY_ID!
const BASE_URL = process.env.AMIGO_BASE_URL || 'https://internal-api.amigo.ai'
const USER_ID = process.env.AMIGO_USER_ID!
const ORG_ID = process.env.AMIGO_ORG_ID || 'dogfood'

async function getToken(): Promise<string> {
  const resp = await fetch(`${BASE_URL}/v1/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: API_KEY, api_key_id: API_KEY_ID }),
  })
  const data = (await resp.json()) as { access_token: string }
  return data.access_token
}

async function benchConcurrent(n: number, token: string) {
  const start = performance.now()
  const results = await Promise.allSettled(
    Array.from({ length: n }, () =>
      fetch(`${BASE_URL}/v1/${ORG_ID}/service/`, {
        headers: { Authorization: `Bearer ${token}`, 'x-user-id': USER_ID },
      })
    )
  )
  const elapsed = performance.now() - start
  const ok = results.filter((r) => r.status === 'fulfilled').length
  const failed = n - ok
  console.log(`  ${n} parallel: ${elapsed.toFixed(0)}ms (${ok} ok, ${failed} failed, ${(n / (elapsed / 1000)).toFixed(1)} req/s)`)
}

async function main() {
  console.log('Concurrent Request Handling:')
  const token = await getToken()
  for (const n of [10, 50, 100]) await benchConcurrent(n, token)
}

main().catch(console.error)
