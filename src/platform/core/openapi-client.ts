import type { Client } from 'openapi-fetch'
import openapiFetchImport from 'openapi-fetch'
import { createErrorMiddleware } from '../../core/errors'
import { createPlatformAuthMiddleware } from './auth'
import type { paths } from '../../generated/platform-api-types'
import type { PlatformClientConfig } from '..'
import { createRetryingFetch } from '../../core/retry'

// Handle ESM/CJS interop
const createClient: typeof openapiFetchImport =
  typeof openapiFetchImport === 'function'
    ? openapiFetchImport
    : (openapiFetchImport as unknown as { default: typeof openapiFetchImport }).default

export type PlatformFetch = Client<paths>

/** Create an OpenAPI-typed fetch client for the Platform API. */
export function createPlatformFetch(
  config: PlatformClientConfig,
  mockFetch?: typeof fetch
): PlatformFetch {
  const wrappedFetch = createRetryingFetch(
    config.retry,
    mockFetch ?? config.fetch ?? (globalThis.fetch as typeof fetch)
  )

  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    fetch: wrappedFetch,
  })

  client.use(createErrorMiddleware())
  client.use(createPlatformAuthMiddleware(config.apiKey))

  return client
}
