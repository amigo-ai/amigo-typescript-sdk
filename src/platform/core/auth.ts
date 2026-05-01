import type { Middleware } from 'openapi-fetch'

/**
 * Create a middleware that sets the Authorization header with a raw API key.
 * Platform API uses simple Bearer token auth — no token exchange needed.
 */
export function createPlatformAuthMiddleware(apiKey: string): Middleware {
  return {
    onRequest: async ({ request }) => {
      request.headers.set('Authorization', `Bearer ${apiKey}`)
      return request
    },
  }
}
