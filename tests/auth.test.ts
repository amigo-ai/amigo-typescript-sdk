import { describe, test, vi, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getBearerToken, createAuthMiddleware } from '../src/core/auth'
import { AmigoSdkConfig } from '../src/index'
import { AuthenticationError, NetworkError } from '../src/core/errors'
import { createAmigoFetch } from '../src/core/openapi-client'

// Mock config for testing
const mockConfig: AmigoSdkConfig = {
  apiKey: 'test-api-key',
  apiKeyId: 'test-api-key-id',
  userId: 'test-user-id',
  orgId: 'test-org-id',
  baseUrl: 'https://api.example.com',
}

// Mock successful auth response
const mockSuccessResponse = {
  id_token: 'mock-bearer-token-123',
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
}

// MSW server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

describe('SDK Auth Tests', () => {
  describe('API Key <> Bearer token exchange', () => {
    test('outgoing signin_with_api_key request has correct headers and URL', async () => {
      // Set up MSW handler to capture the request
      let capturedRequest: Request | null = null

      server.use(
        http.post(
          'https://api.example.com/v1/test-org-id/user/signin_with_api_key',
          async ({ request }) => {
            capturedRequest = request.clone()
            return HttpResponse.json(mockSuccessResponse)
          }
        )
      )

      await getBearerToken(mockConfig)

      // Verify the request was made correctly
      expect(capturedRequest).not.toBeNull()
      expect(capturedRequest!.method).toBe('POST')
      expect(capturedRequest!.url).toBe(
        'https://api.example.com/v1/test-org-id/user/signin_with_api_key'
      )

      // Verify headers
      expect(capturedRequest!.headers.get('x-api-key')).toBe('test-api-key')
      expect(capturedRequest!.headers.get('x-api-key-id')).toBe('test-api-key-id')
      expect(capturedRequest!.headers.get('x-user-id')).toBe('test-user-id')
    })

    test('non OK response throws error', async () => {
      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          return HttpResponse.json(null, {
            status: 401,
            statusText: 'API key not found, is incorrect, or the requested user is not found.',
          })
        })
      )

      await expect(getBearerToken(mockConfig)).rejects.toThrow(AuthenticationError)
    })

    test('response json is parsed into SignInWithApiKeyResponse type', async () => {
      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const response = await getBearerToken(mockConfig)

      expect(response).toEqual(mockSuccessResponse)
      expect(typeof response.id_token).toBe('string')
      expect(typeof response.expires_at).toBe('string')
    })
  })

  describe('Auth Middleware Tests', () => {
    test('Authorization Bearer token is set on outgoing requests', async () => {
      // Mock the auth endpoint
      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const middleware = createAuthMiddleware(mockConfig)

      // Create a mock request
      const mockRequest = new Request('https://api.example.com/test-endpoint')

      // Call the middleware's onRequest handler
      const modifiedRequest = await middleware.onRequest!({
        request: mockRequest,
        params: {},
      } as any)

      // Verify the Authorization header was added
      expect(modifiedRequest?.headers.get('Authorization')).toBe('Bearer mock-bearer-token-123')
    })

    test('expired token is refreshed', async () => {
      let authCallCount = 0

      // Mock expired token response first, then fresh token
      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          authCallCount++
          if (authCallCount === 1) {
            // First call - return expired token
            return HttpResponse.json({
              ...mockSuccessResponse,
              expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
            })
          } else {
            // Second call - return fresh token
            return HttpResponse.json({
              ...mockSuccessResponse,
              id_token: 'fresh-token-456',
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            })
          }
        })
      )

      const middleware = createAuthMiddleware(mockConfig)
      const mockRequest1 = new Request('https://api.example.com/test-endpoint-1')
      const mockRequest2 = new Request('https://api.example.com/test-endpoint-2')

      // First request should get expired token
      await middleware.onRequest!({
        request: mockRequest1,
        params: {},
      } as any)

      // Add a small delay to ensure token is considered expired
      await new Promise(resolve => setTimeout(resolve, 10))

      // Second request should trigger refresh and get new token
      const modifiedRequest2 = await middleware.onRequest!({
        request: mockRequest2,
        params: {},
      } as any)

      // Verify fresh token is used
      expect(modifiedRequest2?.headers.get('Authorization')).toBe('Bearer fresh-token-456')
      expect(authCallCount).toBe(2) // Token should have been refreshed
    })

    test('non OK response clears token', async () => {
      let authCallCount = 0

      server.use(
        http.post('https://api.example.com/v1/test-org-id/user/signin_with_api_key', () => {
          authCallCount++
          return HttpResponse.json(mockSuccessResponse)
        })
      )

      const middleware = createAuthMiddleware(mockConfig)
      const mockRequest = new Request('https://api.example.com/test-endpoint')

      // First request to get token
      await middleware.onRequest!({
        request: mockRequest,
        params: {},
      } as any)
      expect(authCallCount).toBe(1)

      // Simulate 401 response
      const mock401Response = new Response('Unauthorized', { status: 401 })
      await middleware.onResponse!({
        response: mock401Response,
        request: mockRequest,
        params: {},
      } as any)

      // Next request should fetch token again (token was cleared)
      const mockRequest2 = new Request('https://api.example.com/test-endpoint-2')
      await middleware.onRequest!({
        request: mockRequest2,
        params: {},
      } as any)

      expect(authCallCount).toBe(2) // Token should have been re-fetched
    })
  })
})
