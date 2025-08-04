import createClient, { Middleware, type Client } from 'openapi-fetch'
import { HttpError } from './errors'
import { createAuthMiddleware } from './auth'
import type { paths } from '../generated/api-types'
import type { AmigoSdkConfig } from '..'

export type AmigoFetch = Client<paths>

export function createAmigoFetch(config: AmigoSdkConfig): AmigoFetch {
  if (!config.baseUrl) {
    config.baseUrl = 'https://api.amigo.ai/v1'
  }

  const client = createClient<paths>({
    baseUrl: config.baseUrl,
  })

  client.use(createAuthMiddleware(config))

  // Error handling middleware
  const errorMw: Middleware = {
    async onResponse({ response }) {
      if (!response.ok) {
        const body = await response
          .clone()
          .text()
          .catch(() => '')
        throw new HttpError(response.status, body)
      }
    },
  }
  client.use(errorMw)

  return client
}
