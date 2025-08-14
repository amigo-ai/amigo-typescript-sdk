import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ServiceResource } from '../../src/resources/services'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { NotFoundError } from '../../src/core/errors'
import type { components } from '../../src/generated/api-types'
import { mockConfig, withMockAuth } from '../test-helpers'

// Mock service instance
const mockService: components['schemas']['ServiceInstance'] = {
  id: 'service-123',
  name: 'Test Service',
  description: 'A test service for API testing',
  is_active: true,
  version_sets: {},
  service_hierarchical_state_machine_id: 'hsm-456',
  agent_id: 'agent-789',
  tags: [],
}

// Mock services response
const mockServicesResponse: components['schemas']['service__get_services__Response'] = {
  services: [mockService],
  has_more: false,
  continuation_token: null,
  filter_values: null,
}

// MSW server setup
const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('ServiceResource', () => {
  test('getServices returns data', async () => {
    // Mock auth and API endpoints using helper
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/service/', () => {
          return HttpResponse.json(mockServicesResponse)
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const serviceResource = new ServiceResource(client, 'test-org')
    const result = await serviceResource.getServices()

    expect(result).toBeDefined()
    expect(result).toEqual(mockServicesResponse)
    expect(result!.services).toHaveLength(1)
    expect(result!.services[0]!.id).toBe('service-123')
    expect(result!.services[0]!.name).toBe('Test Service')
    expect(result!.has_more).toBe(false)
  })

  test('getServices throws an error if the organization does not exist', async () => {
    // Mock auth endpoint and 404 API response using helper
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/nonexistent-org/service/', () => {
          return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const serviceResource = new ServiceResource(client, 'nonexistent-org')

    await expect(serviceResource.getServices()).rejects.toThrow(NotFoundError)
  })
})
