import createClient, { Middleware, type Client } from 'openapi-fetch'
import { createApiError, NetworkError, ParseError, ConfigurationError } from './errors'
import { createAuthMiddleware } from './auth'
import type { paths } from '../generated/api-types'
import type { AmigoSdkConfig } from '..'
import { isNetworkError, parseResponseBody } from './utils'

export type AmigoFetch = Client<paths>

export function createAmigoFetch(
  config: AmigoSdkConfig,
  mockFetch?: (input: Request) => Promise<Response>
): AmigoFetch {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    ...(mockFetch && { fetch: mockFetch }),
  })

  // Apply error handling middleware first (to catch all errors)
  const errorMw: Middleware = {
    async onResponse({ response }) {
      if (!response.ok) {
        const body = await parseResponseBody(response)
        throw createApiError(response, body)
      }
    },
    async onError({ error, request }) {
      // Handle network-related errors consistently
      if (isNetworkError(error)) {
        throw new NetworkError(
          `Network error: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            url: request?.url,
            method: request?.method,
          }
        )
      }
      throw error
    },
  }
  client.use(errorMw)

  // Apply auth middleware after error handling (so auth errors are properly handled)
  client.use(createAuthMiddleware(config))

  return client
}
