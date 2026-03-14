import { performance } from 'node:perf_hooks'

const API_KEY = process.env.AMIGO_API_KEY!
const API_KEY_ID = process.env.AMIGO_API_KEY_ID!
const BASE_URL = process.env.AMIGO_BASE_URL || 'https://internal-api.amigo.ai'

async function bench() {
  const times: number[] = []
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    const resp = await fetch(`${BASE_URL}/v1/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY, api_key_id: API_KEY_ID }),
    })
    if (!resp.ok) throw new Error(`Sign-in failed: ${resp.status}`)
    await resp.json()
    times.push(performance.now() - start)
  }
  console.log('Token Refresh Latency:')
  console.log(`  Cold start: ${times[0].toFixed(1)}ms`)
  console.log(
    `  Avg (warm): ${(times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1)).toFixed(1)}ms`
  )
  console.log(`  Min: ${Math.min(...times).toFixed(1)}ms`)
  console.log(`  Max: ${Math.max(...times).toFixed(1)}ms`)
}

bench().catch(console.error)
