import { Middleware } from 'openapi-fetch'
import { components } from '../generated/api-types'
import { AmigoSdkConfig } from '..'
import { AuthenticationError, NetworkError, ParseError, createApiError } from './errors'

type SignInWithApiKeyResponse =
  components['schemas']['src__app__endpoints__user__sign_in_with_api_key__Response']

/** Helper function to trade API key for a bearer token */
export async function getBearerToken(config: AmigoSdkConfig): Promise<SignInWithApiKeyResponse> {
  try {
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
      let body: unknown
      try {
        const text = await response.text()
        body = text ? JSON.parse(text) : undefined
      } catch {
        body = undefined
      }

      const error = createApiError(response, body)

      // For 401s, enhance the error message but preserve all the original details
      if (response.status === 401) {
        throw new AuthenticationError(`Failed to authenticate with API key: ${error.message}`, {
          statusCode: error.statusCode,
          errorCode: error.errorCode,
          context: error.context,
          cause: error,
        })
      }

      throw error
    }

    try {
      const data = (await response.json()) as SignInWithApiKeyResponse
      return data
    } catch (err) {
      throw new ParseError(
        'Failed to parse authentication response',
        'json',
        err instanceof Error ? err : new Error(String(err))
      )
    }
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new NetworkError('Failed to connect to authentication endpoint', err, {
        url: `${config.baseUrl}/v1/${config.orgId}/user/signin_with_api_key`,
        method: 'POST',
      })
    }
    throw err
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
        if (error instanceof AuthenticationError) {
          throw error
        }
        throw new AuthenticationError('Failed to obtain bearer token', {
          errorCode: 'invalid_token',
          cause: error,
        })
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
      // Wrap network errors in authentication context
      if (error instanceof NetworkError) {
        throw new AuthenticationError('Network error while authenticating with Amigo API', {
          errorCode: 'missing_credentials',
          cause: error,
        })
      }
      // Pass through other error types
      throw error
    },
  }
}
