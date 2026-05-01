import { describe, test, expect } from 'vitest'
import {
  extractData,
  parseNdjsonStream,
  parseSseStream,
  parseResponseBody,
  isNetworkError,
} from '../src/core/utils'
import { ParseError } from '../src/core/errors'

function createNdjsonStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line))
      controller.close()
    },
  })
}

function createTextStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

describe('extractData', () => {
  test('returns data when present', async () => {
    const promise = Promise.resolve({ data: { ok: true } }) as Promise<{ data?: { ok: boolean } }>
    const data = await extractData(promise)
    expect(data).toEqual({ ok: true })
  })

  test('throws ParseError when data is undefined', async () => {
    const promise = Promise.resolve({}) as Promise<{ data?: unknown }>
    await expect(extractData(promise)).rejects.toBeInstanceOf(ParseError)
  })

  test('throws ParseError when data is null', async () => {
    const promise = Promise.resolve({ data: null }) as Promise<{ data?: unknown }>
    await expect(extractData(promise)).rejects.toBeInstanceOf(ParseError)
  })
})

describe('parseNdjsonStream', () => {
  test('yields parsed objects for valid NDJSON lines', async () => {
    const stream = createNdjsonStream(['{"a":1}\n', '{"b":2}\n'])
    const response = new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } })
    const out: Array<Record<string, unknown>> = []
    for await (const obj of parseNdjsonStream<Record<string, unknown>>(response)) {
      out.push(obj)
    }
    expect(out).toEqual([{ a: 1 }, { b: 2 }])
  })

  test('handles trailing line without newline', async () => {
    const stream = createNdjsonStream(['{"a":1}\n', '{"b":2}'])
    const response = new Response(stream)
    const out: Array<Record<string, unknown>> = []
    for await (const obj of parseNdjsonStream<Record<string, unknown>>(response)) {
      out.push(obj)
    }
    expect(out).toEqual([{ a: 1 }, { b: 2 }])
  })

  test('skips empty lines', async () => {
    const stream = createNdjsonStream(['\n', '   \n', '{"x":1}\n', '\n'])
    const response = new Response(stream)
    const out: Array<Record<string, unknown>> = []
    for await (const obj of parseNdjsonStream<Record<string, unknown>>(response)) {
      out.push(obj)
    }
    expect(out).toEqual([{ x: 1 }])
  })

  test('throws ParseError on invalid JSON line', async () => {
    const stream = createNdjsonStream(['{"a":1}\n', '{bad json}\n'])
    const response = new Response(stream)
    const iter = parseNdjsonStream<Record<string, unknown>>(response)
    const received: Array<Record<string, unknown>> = []
    await expect(
      (async () => {
        for await (const obj of iter) received.push(obj)
      })()
    ).rejects.toBeInstanceOf(ParseError)
    expect(received).toEqual([{ a: 1 }])
  })

  test('returns without yielding when response body is missing', async () => {
    const response = new Response(null)
    const out: unknown[] = []
    for await (const obj of parseNdjsonStream(response)) {
      out.push(obj)
    }
    expect(out).toEqual([])
  })
})

describe('parseSseStream', () => {
  test('yields parsed JSON server-sent events', async () => {
    const stream = createTextStream([
      'retry: 3000\n\n',
      'id: 1\nevent: token\ndata: {"type":"token","token":"hi"}\n\n',
      'id: 2\nevent: done\ndata: {"type":"done"}\n\n',
    ])
    const response = new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
    const out: unknown[] = []
    for await (const event of parseSseStream(response)) {
      out.push(event)
    }
    expect(out).toEqual([
      { id: '1', event: 'token', data: { type: 'token', token: 'hi' } },
      { id: '2', event: 'done', data: { type: 'done' } },
    ])
  })

  test('handles multiline text data and comments', async () => {
    const stream = createTextStream([
      ': heartbeat\n',
      'event: message\r\n',
      'data: hello\r\n',
      'data: world\r\n\r\n',
    ])
    const response = new Response(stream)
    const out: unknown[] = []
    for await (const event of parseSseStream(response)) {
      out.push(event)
    }
    expect(out).toEqual([{ event: 'message', data: 'hello\nworld' }])
  })
})

describe('parseResponseBody', () => {
  test('parses JSON responses', async () => {
    const response = new Response(JSON.stringify({ ok: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    })
    const parsed = await parseResponseBody(response)
    expect(parsed).toEqual({ ok: 1 })
  })

  test('returns text for non-JSON responses', async () => {
    const response = new Response('hello world', {
      headers: { 'Content-Type': 'text/plain' },
    })
    const parsed = await parseResponseBody(response)
    expect(parsed).toBe('hello world')
  })

  test('returns undefined for empty body', async () => {
    const response = new Response('')
    const parsed = await parseResponseBody(response)
    expect(parsed).toBeUndefined()
  })

  test('returns undefined if reading the body throws', async () => {
    const response = new Response(
      new ReadableStream({
        start(controller) {
          // Mark stream as errored so consumers (text/json) will reject when reading
          controller.error(new Error('boom'))
        },
      })
    )
    const parsed = await parseResponseBody(response)
    expect(parsed).toBeUndefined()
  })

  test('returns raw text when invalid JSON', async () => {
    const response = new Response('{bad json}')
    const parsed = await parseResponseBody(response)
    expect(parsed).toBe('{bad json}')
  })
})

describe('isNetworkError', () => {
  test('detects TypeError as network error', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
  })

  test('detects common network error messages', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
    expect(isNetworkError(new Error('Network request failed'))).toBe(true)
    expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true)
    expect(isNetworkError(new Error('ETIMEDOUT'))).toBe(true)
    expect(isNetworkError(new Error('ENOTFOUND'))).toBe(true)
    expect(isNetworkError(new Error('random network hiccup'))).toBe(true)
  })

  test('returns false for non-network errors and non-Error values', () => {
    expect(isNetworkError(new Error('some other error'))).toBe(false)
    expect(isNetworkError('string')).toBe(false)
    expect(isNetworkError({})).toBe(false)
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
  })
})
