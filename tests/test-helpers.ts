import { http, HttpResponse } from 'msw'
import { AmigoSdkConfig } from '../src/index'

/**
 * Standard mock configuration used across tests
 */
export const mockConfig: AmigoSdkConfig = {
  apiKey: 'test-api-key',
  apiKeyId: 'test-api-key-id',
  userId: 'test-user-id',
  orgId: 'test-org-id',
  baseUrl: 'https://api.example.com',
}

/**
 * Standard successful authentication response
 */
export const mockAuthResponse = {
  id_token: 'mock-token',
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

/**
 * Creates a successful signin endpoint mock handler
 * @param orgId - Organization ID for the endpoint URL (defaults to 'test-org-id')
 * @param baseUrl - Base URL for the endpoint (defaults to 'https://api.example.com')
 * @returns MSW http handler for successful signin
 */
export function mockSuccessfulAuth(
  orgId: string = 'test-org-id',
  baseUrl: string = 'https://api.example.com'
) {
  return http.post(`${baseUrl}/v1/${orgId}/user/signin_with_api_key`, () => {
    return HttpResponse.json(mockAuthResponse)
  })
}

/**
 * Creates a failed signin endpoint mock handler
 * @param status - HTTP status code (defaults to 401)
 * @param statusText - HTTP status text (defaults to 'Unauthorized')
 * @param orgId - Organization ID for the endpoint URL (defaults to 'test-org-id')
 * @param baseUrl - Base URL for the endpoint (defaults to 'https://api.example.com')
 * @returns MSW http handler for failed signin
 */
export function mockFailedAuth(
  status: number = 401,
  statusText: string = 'Unauthorized',
  orgId: string = 'test-org-id',
  baseUrl: string = 'https://api.example.com'
) {
  return http.post(`${baseUrl}/v1/${orgId}/user/signin_with_api_key`, () => {
    return HttpResponse.json(null, { status, statusText })
  })
}

/**
 * Creates both successful auth and a custom API endpoint mock
 * @param apiMock - The API endpoint mock handler
 * @param orgId - Organization ID for auth endpoint (defaults to 'test-org-id')
 * @param baseUrl - Base URL for endpoints (defaults to 'https://api.example.com')
 * @returns Array of MSW handlers [auth, api]
 */
export function withMockAuth(
  apiMock: ReturnType<typeof http.get | typeof http.post | typeof http.put | typeof http.delete>,
  orgId: string = 'test-org-id',
  baseUrl: string = 'https://api.example.com'
) {
  return [mockSuccessfulAuth(orgId, baseUrl), apiMock]
}

/**
 * Creates a network error mock (simulates ENOTFOUND, etc.)
 * @param orgId - Organization ID for the endpoint URL (defaults to 'test-org-id')
 * @param baseUrl - Base URL for the endpoint (defaults to 'https://api.example.com')
 * @returns MSW http handler that throws a network error
 */
export function mockNetworkErrorAuth(
  orgId: string = 'test-org-id',
  baseUrl: string = 'https://api.example.com'
) {
  return http.post(`${baseUrl}/v1/${orgId}/user/signin_with_api_key`, () => {
    throw new Error('Network error')
  })
}
