import createClient, { Middleware, type Client } from 'openapi-fetch'
import { createErrorMiddleware } from './errors'
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
  client.use(createErrorMiddleware())

  // Apply auth middleware after error handling (so auth errors are properly handled)
  client.use(createAuthMiddleware(config))

  return client
}
