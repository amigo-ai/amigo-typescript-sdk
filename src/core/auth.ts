import { Middleware } from 'openapi-fetch'
import { components } from '../generated/api-types'
import { AmigoSdkConfig } from '..'
import { AuthError } from './errors'

type SignInWithApiKeyResponse =
  components['schemas']['src__app__endpoints__user__sign_in_with_api_key__Response']

/** Helper function to trade API key for a bearer token */
export async function getBearerToken(config: AmigoSdkConfig): Promise<SignInWithApiKeyResponse> {
  const response = await fetch(`${config.baseUrl}/v1/${config.orgId}/user/signin_with_api_key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'x-api-key-id': config.apiKeyId,
      'x-user-id': config.userId,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to sign in with API key')
  }

  const data = (await response.json()) as SignInWithApiKeyResponse
  return data
}

export function createAuthMiddleware(config: AmigoSdkConfig): Middleware {
  let token: SignInWithApiKeyResponse | null = null
  let refreshPromise: Promise<SignInWithApiKeyResponse> | null = null

  const shouldRefreshToken = (tokenData: SignInWithApiKeyResponse): boolean => {
    if (!tokenData.expires_at) return false

    const expiryTime = new Date(tokenData.expires_at).getTime()
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime
    const refreshThreshold = 5 * 60 * 1000 // 5 minutes in milliseconds

    return timeUntilExpiry <= refreshThreshold
  }

  const ensureValidToken = async (): Promise<SignInWithApiKeyResponse> => {
    if (!token || shouldRefreshToken(token)) {
      if (!refreshPromise) {
        refreshPromise = getBearerToken(config)
        try {
          token = await refreshPromise
        } finally {
          refreshPromise = null
        }
      } else {
        token = await refreshPromise
      }
    }
    return token
  }

  return {
    onRequest: async ({ request }) => {
      try {
        debugger
        const validToken = await ensureValidToken()
        if (validToken?.id_token) {
          request.headers.set('Authorization', `Bearer ${validToken.id_token}`)
        }
      } catch (error) {
        throw new AuthError('Failed to obtain Amigo auth token', error)
      }
      return request
    },
    onResponse: async ({ response }) => {
      // Handle 401 responses by clearing token to force refresh
      if (response.status === 401) {
        token = null
      }
    },
    onError: async ({ error }) => {
      token = null
      // Wrap or re-throw so callers see a consistent error family
      if (error instanceof AuthError) {
        // already typed
        return error
      }
      return new AuthError('Network error while contacting Amigo API', error)
    },
  }
}
