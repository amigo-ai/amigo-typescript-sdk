import createClient, { Middleware, type Client } from 'openapi-fetch'
import { HttpError } from './errors'
import type { paths } from '../generated/api-types'
import type { AmigoSdkConfig } from '..'

export type AmigoFetch = Client<paths>

export function createAmigoFetch(config: AmigoSdkConfig): AmigoFetch {
  const client = createClient<paths>({
    baseUrl: config.baseUrl ?? 'https://api.amigo.ai/v1',
  })

  // TODO Implement Auth Strategy
  let token: string | null = null

  const mw: Middleware = {
    onRequest: async ({ request }) => {
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
      return request
    },
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
  client.use(mw)
  return client
}
