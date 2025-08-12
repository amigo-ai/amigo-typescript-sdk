import { http, HttpResponse } from 'msw'
import { AmigoSdkConfig } from '../src/index'
import { components } from '../src/generated/api-types'

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

export const mockAgentVersionRequest: components['schemas']['src__app__endpoints__organization__create_agent_version__Request'] =
  {
    initials: 'SDK',
    identity: {
      name: 'sdk_integration_test_agent',
      role: 'sdk_integration_test_role',
      developed_by: 'SDK Integration Tests',
      default_spoken_language: 'eng',
      relationship_to_developer: {
        ownership: 'user',
        type: 'assistant',
        conversation_visibility: 'visible',
        thought_visibility: 'hidden',
      },
    },
    background: 'SDK integration test background',
    behaviors: [],
    communication_patterns: [],
    voice_config: {
      voice_id: 'iP95p4xoKVk53GoZ742B',
      stability: 0.35,
      similarity_boost: 0.9,
      style: 0,
    },
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
