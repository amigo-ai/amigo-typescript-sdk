import { Middleware } from 'openapi-fetch'
import { components } from '../generated/api-types'
import { AmigoSdkConfig } from '..'
import { AmigoError, AuthenticationError, NetworkError, ParseError, createApiError } from './errors'
import { isNetworkError, parseResponseBody } from './utils'

type SignInWithApiKeyResponse =
  components['schemas']['src__app__endpoints__user__sign_in_with_api_key__Response']

/** Helper function to trade API key for a bearer token */
export async function getBearerToken(config: AmigoSdkConfig): Promise<SignInWithApiKeyResponse> {
  const url = `${config.baseUrl}/v1/${config.orgId}/user/signin_with_api_key`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'x-api-key-id': config.apiKeyId,
        'x-user-id': config.userId,
      },
    })

    if (!response.ok) {
      const body = await parseResponseBody(response)
      const apiError = createApiError(response, body)

      // Enhance authentication errors with additional context
      if (response.status === 401) {
        throw new AuthenticationError(`Authentication failed: ${apiError.message}`, {
          ...apiError,
          context: { ...apiError.context, endpoint: 'signin_with_api_key' },
        })
      }
      throw apiError
    }

    return (await response.json()) as SignInWithApiKeyResponse
  } catch (err) {
    // Re-throw our custom errors as-is
    if (err instanceof AmigoError) {
      throw err
    }

    // Handle network errors
    if (isNetworkError(err)) {
      throw new NetworkError('Failed to connect to authentication endpoint', err as Error, {
        url,
        method: 'POST',
      })
    }

    // Handle JSON parsing errors
    throw new ParseError(
      'Failed to parse authentication response',
      'json',
      err instanceof Error ? err : new Error(String(err))
    )
  }
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
        const validToken = await ensureValidToken()
        if (validToken?.id_token) {
          request.headers.set('Authorization', `Bearer ${validToken.id_token}`)
        }
      } catch (error) {
        // Clear token and re-throw - getBearerToken already provides proper error types
        token = null
        throw error
      }
      return request
    },

    onResponse: async ({ response }) => {
      // Handle 401 responses by clearing token to force refresh on next request
      if (response.status === 401) {
        token = null
      }
    },

    onError: async ({ error }) => {
      // Clear token on any error to force refresh
      token = null
      throw error
    },
  }
}
