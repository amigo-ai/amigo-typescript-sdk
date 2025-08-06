import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAmigoFetch } from '../src/core/openapi-client'
import { NetworkError, AmigoError, NotFoundError } from '../src/core/errors'
import { mockConfig, withMockAuth } from './test-helpers'

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
