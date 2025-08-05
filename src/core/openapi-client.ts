import createClient, { Middleware, type Client } from 'openapi-fetch'
import { createApiError, NetworkError, ParseError, ConfigurationError } from './errors'
import { createAuthMiddleware } from './auth'
import type { paths } from '../generated/api-types'
import type { AmigoSdkConfig } from '..'

export type AmigoFetch = Client<paths>

// Type helper to extract the data type from openapi-fetch responses
type ExtractDataType<T> = T extends { data?: infer D } ? D : never

// Helper function to extract data from openapi-fetch responses
// Since our middleware throws on errors, successful responses will have data
export async function extractData<T>(responsePromise: Promise<T>): Promise<ExtractDataType<T>> {
  const result = await responsePromise
  // openapi-fetch guarantees data exists on successful responses
  return (result as { data: ExtractDataType<T> }).data
}

// Utility function to safely parse response bodies
async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text() // No need to clone since we only read once
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return text // Return as string if not valid JSON
    }
  } catch (err) {
    throw new ParseError(
      'Failed to parse error response',
      'response',
      err instanceof Error ? err : new Error(String(err))
    )
  }
}

// Helper to detect network-related errors
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return (
    error instanceof TypeError ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('network')
  )
}

export function createAmigoFetch(config: AmigoSdkConfig): AmigoFetch {
  // Validate configuration
  if (!config.apiKey) {
    throw new ConfigurationError('API key is required', 'apiKey')
  }
  if (!config.apiKeyId) {
    throw new ConfigurationError('API key ID is required', 'apiKeyId')
  }
  if (!config.userId) {
    throw new ConfigurationError('User ID is required', 'userId')
  }
  if (!config.orgId) {
    throw new ConfigurationError('Organization ID is required', 'orgId')
  }

  if (!config.baseUrl) {
    config.baseUrl = 'https://api.amigo.ai'
  }

  const client = createClient<paths>({
    baseUrl: config.baseUrl,
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
