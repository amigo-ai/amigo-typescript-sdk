/**
 * Load/stress test scaffolding for streaming endpoints.
 * Tests concurrent NDJSON stream handling under load.
 *
 * Run with: RUN_LOAD=true npx vitest run tests/streaming-load.test.ts
 */
import { describe, it, expect } from 'vitest'

// Simulates NDJSON stream processing under load
function createMockNdjsonStream(eventCount: number, delayMs = 0): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let sent = 0

  return new ReadableStream({
    async pull(controller) {
      if (sent >= eventCount) {
        controller.close()
        return
      }

      const event = JSON.stringify({
        type: 'server.message',
        sequence: sent,
        timestamp: new Date().toISOString(),
        data: { content: `Event ${sent}` },
      })

      controller.enqueue(encoder.encode(event + '\n'))
      sent++

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    },
  })
}

async function consumeStream(stream: ReadableStream<Uint8Array>): Promise<number> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let count = 0
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.trim()) {
        JSON.parse(line) // Validate parseable
        count++
      }
    }
  }

  return count
}

describe.skipIf(!process.env.RUN_LOAD)('Streaming Load Tests', () => {
  it('should handle 1000 events in a single stream', async () => {
    const stream = createMockNdjsonStream(1000)
    const count = await consumeStream(stream)
    expect(count).toBe(1000)
  })

  it('should handle 10 concurrent streams of 100 events each', async () => {
    const streams = Array.from({ length: 10 }, () => createMockNdjsonStream(100))
    const results = await Promise.all(streams.map(consumeStream))
    expect(results).toEqual(Array(10).fill(100))
  })

  it('should handle streams with varying delays', async () => {
    const streams = [
      createMockNdjsonStream(50, 0),
      createMockNdjsonStream(50, 1),
      createMockNdjsonStream(50, 5),
    ]
    const results = await Promise.all(streams.map(consumeStream))
    expect(results).toEqual([50, 50, 50])
  }, 30000)

  it('should handle large events (10KB each)', async () => {
    const largePayload = 'x'.repeat(10000)
    const encoder = new TextEncoder()
    let sent = 0
    const eventCount = 100

    const stream = new ReadableStream({
      pull(controller) {
        if (sent >= eventCount) {
          controller.close()
          return
        }
        const event = JSON.stringify({
          type: 'server.message',
          sequence: sent,
          data: { content: largePayload },
        })
        controller.enqueue(encoder.encode(event + '\n'))
        sent++
      },
    })

    const count = await consumeStream(stream)
    expect(count).toBe(eventCount)
  })
})
