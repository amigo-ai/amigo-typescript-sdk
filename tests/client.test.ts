import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAmigoFetch } from '../src/core/openapi-client'
import { NetworkError, AmigoError, NotFoundError, RateLimitError } from '../src/core/errors'
import { mockConfig, withMockAuth, mockSuccessfulAuth } from './test-helpers'

// MSW server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

describe('HTTP Client Test', () => {
  describe('Error middleware', () => {
    test('Error middleware should throw API error on non-200 response', async () => {
      // Mock auth and API endpoints using helper
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org-id/organization/', () => {
            return HttpResponse.json(null, {
              status: 404,
              statusText: 'The specified organization does not exist.',
            })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)

      await expect(
        client.GET('/v1/{organization}/organization/', {
          params: { path: { organization: 'test-org-id' } },
        })
      ).rejects.toThrow(NotFoundError)
    })

    test('Error middleware should throw NetworkError on network error', async () => {
      // Create a mock fetch that throws a TypeError for network errors
      const mockFetch = vi.fn().mockImplementation((request: Request) => {
        const url = request.url

        // Allow auth requests to succeed
        if (url.includes('signin_with_api_key')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id_token: 'mock-token',
                expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          )
        }

        // Throw network error for organization endpoint
        if (url.includes('/organization/')) {
          return Promise.reject(new TypeError('Failed to fetch'))
        }

        return Promise.reject(new TypeError('Failed to fetch'))
      })

      const client = createAmigoFetch(mockConfig, mockFetch)

      await expect(
        client.GET('/v1/{organization}/organization/', {
          params: { path: { organization: 'test-org-id' } },
        })
      ).rejects.toThrow(NetworkError)
    })

    test('Error middleware should throw AmigoError on other errors', async () => {
      // Mock auth endpoint to return success
      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          return HttpResponse.json({
            id_token: 'mock-token',
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          })
        }),
        // Mock API endpoint to return unknown error status
        http.get('https://api.example.com/v1/test-org-id/organization/', () => {
          return new HttpResponse(null, {
            status: 418,
            statusText: "I'm a teapot",
          })
        })
      )

      const client = createAmigoFetch(mockConfig)

      await expect(
        client.GET('/v1/{organization}/organization/', {
          params: { path: { organization: 'test-org-id' } },
        })
      ).rejects.toThrow(AmigoError)
    })
  })
})

describe('Retry logic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('408 GET retry: first 408 then 200; assert one sleep call', async () => {
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org-id/organization/', () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.json(null, { status: 408, statusText: 'Request Timeout' })
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = client.GET('/v1/{organization}/organization/', {
      params: { path: { organization: 'test-org-id' } },
    })

    await vi.runAllTimersAsync()
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
  })

  test('5xx GET retry: first 500 then 200; assert one sleep call', async () => {
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org-id/organization/', () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.json(null, { status: 500, statusText: 'Internal Error' })
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = client.GET('/v1/{organization}/organization/', {
      params: { path: { organization: 'test-org-id' } },
    })

    await vi.runAllTimersAsync()
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
  })

  test('429 GET respects numeric Retry-After: 1.5s; assert sleep ~1500 ms', async () => {
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org-id/organization/', () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.json(
              { error: 'rate limit' },
              { status: 429, headers: { 'Retry-After': '1.5' } }
            )
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = client.GET('/v1/{organization}/organization/', {
      params: { path: { organization: 'test-org-id' } },
    })

    await vi.advanceTimersByTimeAsync(1500)
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    expect(setTimeoutSpy).toHaveBeenCalled()
    const delay = (setTimeoutSpy.mock.calls[0]?.[1] as number) ?? 0
    expect(Math.round(delay)).toBe(1500)
  })

  test('429 POST with numeric Retry-After: retry after specified delay; success on second try', async () => {
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    server.use(
      ...withMockAuth(
        http.post('https://api.example.com/v1/test-org-id/retry-target', async () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.json(
              { error: 'rate limit' },
              { status: 429, headers: { 'Retry-After': '1' } }
            )
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = (client as any).POST('/v1/test-org-id/retry-target', {})

    await vi.advanceTimersByTimeAsync(1000)
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    const delay = (setTimeoutSpy.mock.calls[0]?.[1] as number) ?? 0
    expect(Math.round(delay)).toBe(1000)
  })

  test('429 POST with HTTP-date Retry-After: future date ~3s; sleep ≈ 3s', async () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    const in3s = new Date(Date.now() + 3000).toUTCString()

    server.use(
      ...withMockAuth(
        http.post('https://api.example.com/v1/test-org-id/retry-target', async () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.json(
              { error: 'rate limit' },
              { status: 429, headers: { 'Retry-After': in3s } }
            )
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = (client as any).POST('/v1/test-org-id/retry-target', {})

    await vi.advanceTimersByTimeAsync(3000)
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    const delay = (setTimeoutSpy.mock.calls[0]?.[1] as number) ?? 0
    expect(Math.round(delay)).toBe(3000)
  })

  test('429 POST without Retry-After: no retry; throws rate-limit error; no sleep', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    server.use(
      ...withMockAuth(
        http.post('https://api.example.com/v1/test-org-id/retry-target', async () => {
          return HttpResponse.json({ error: 'rate limit' }, { status: 429 })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    await expect((client as any).POST('/v1/test-org-id/retry-target', {})).rejects.toThrow(
      RateLimitError
    )
    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  test('GET timeout retry: first transport/timeout error then 200; one sleep', async () => {
    let calls = 0
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org-id/organization/', () => {
          calls += 1
          if (calls === 1) {
            return HttpResponse.error()
          }
          return HttpResponse.json({ ok: true })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const req = client.GET('/v1/{organization}/organization/', {
      params: { path: { organization: 'test-org-id' } },
    })

    await vi.runAllTimersAsync()
    await expect(req).resolves.toBeTruthy()
    expect(calls).toBe(2)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1)
  })

  test('POST timeout not retried: timeout throws; no sleep', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    let calls = 0
    server.use(
      ...withMockAuth(
        http.post(
          'https://api.example.com/v1/test-org-id/conversation/conversation_starter',
          () => {
            calls += 1
            return HttpResponse.error()
          }
        )
      )
    )

    const client = createAmigoFetch(mockConfig)
    await expect(
      (client as any).POST('/v1/test-org-id/conversation/conversation_starter', {})
    ).rejects.toThrow()
    expect(calls).toBe(1)
    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  test('Backoff clamped: large base, small cap; stub Math.random()=1 -> sleep equals cap', async () => {
    const originalRandom = Math.random
    Math.random = () => 1
    try {
      let calls = 0
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org-id/organization/', () => {
            calls += 1
            if (calls === 1) {
              return HttpResponse.json(null, { status: 500 })
            }
            return HttpResponse.json({ ok: true })
          })
        )
      )

      const client = createAmigoFetch({
        ...mockConfig,
        retry: { backoffBaseMs: 60_000, maxDelayMs: 1_000 },
      } as any)
      const req = client.GET('/v1/{organization}/organization/', {
        params: { path: { organization: 'test-org-id' } },
      })

      await vi.runAllTimersAsync()
      await expect(req).resolves.toBeTruthy()
      expect(calls).toBe(2)
      const delay = (setTimeoutSpy.mock.calls[0]?.[1] as number) ?? 0
      expect(Math.round(delay)).toBe(1000)
    } finally {
      Math.random = originalRandom
    }
  })

  test.todo('Max attempts: 500→500→500; two sleeps then server error thrown')

  test.skip('401 refresh (optional): first 401 then 200; exactly one refresh then success', async () => {
    // TODO: implement with fake timers and MSW
  })
})
