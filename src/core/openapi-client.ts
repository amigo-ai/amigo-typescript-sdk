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
  return (result as any).data
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

  client.use(createAuthMiddleware(config))

  // Error handling middleware
  const errorMw: Middleware = {
    async onResponse({ response }) {
      if (!response.ok) {
        let body: unknown
        try {
          const text = await response.clone().text()
          try {
            body = text ? JSON.parse(text) : undefined
          } catch {
            body = text
          }
        } catch (err) {
          throw new ParseError(
            'Failed to parse error response',
            'response',
            err instanceof Error ? err : new Error(String(err))
          )
        }

        throw createApiError(response, body)
      }
    },
    async onError({ error }) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed', error)
      }
      throw error
    },
  }
  client.use(errorMw)

  return client
}
