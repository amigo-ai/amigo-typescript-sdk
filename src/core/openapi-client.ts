import createClient, { type Client } from 'openapi-fetch'
import { createErrorMiddleware } from './errors'
import { createAuthMiddleware } from './auth'
import type { paths } from '../generated/api-types'
import type { AmigoSdkConfig } from '..'
import { createRetryingFetch } from './retry'

export type AmigoFetch = Client<paths>

export function createAmigoFetch(config: AmigoSdkConfig, mockFetch?: typeof fetch): AmigoFetch {
  const wrappedFetch = createRetryingFetch(
    config.retry,
    mockFetch ?? (globalThis.fetch as typeof fetch)
  )

  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    fetch: wrappedFetch,
  })

  // Apply error handling middleware first (to catch all errors)
  client.use(createErrorMiddleware())

  // Apply auth middleware after error handling (so auth errors are properly handled)
  client.use(createAuthMiddleware(config))

  return client
}
