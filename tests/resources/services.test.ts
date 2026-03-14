/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ServiceResource } from '../../src/resources/services'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { NotFoundError, ValidationError } from '../../src/core/errors'
import type { components } from '../../src/generated/api-types'
import { mockConfig, withMockAuth } from '../test-helpers'
import { orgId, serviceId } from '../../src/core/branded-types'

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
  keyterms: [],
  creator: { org_id: 'test-org', user_id: 'user-1' },
  updated_by: { org_id: 'test-org', user_id: 'user-1' },
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
    const serviceResource = new ServiceResource(client, orgId('test-org'))
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
    const serviceResource = new ServiceResource(client, orgId('nonexistent-org'))

    await expect(serviceResource.getServices()).rejects.toThrow(NotFoundError)
  })

  test('getServices passes query parameters and headers', async () => {
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/service/', ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('limit')).toBe('5')
          expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
          return HttpResponse.json(mockServicesResponse)
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const resource = new ServiceResource(client, orgId('test-org'))
    await resource.getServices({ limit: 5 } as any, { 'x-mongo-cluster-name': 'abc' })
  })

  describe('createService', () => {
    test('creates and returns service', async () => {
      const mockResponse = { id: 'service-new', name: 'New Service' }

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/service/', async ({ request }) => {
            const body = (await request.json()) as any
            expect(body.name).toBe('New Service')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      const result = await resource.createService({
        body: { name: 'New Service' } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('forwards headers', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/service/', ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
            return HttpResponse.json({ id: 'service-new' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await resource.createService({
        body: { name: 'Test' } as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })

    test('throws ValidationError on 422', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/service/', () => {
            return HttpResponse.json(
              { detail: 'bad' },
              { status: 422, statusText: 'Unprocessable Entity' }
            )
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await expect(resource.createService({ body: {} as any })).rejects.toThrow(ValidationError)
    })
  })

  describe('updateService', () => {
    test('updates and returns service', async () => {
      const mockResponse = { id: 'service-123', name: 'Updated' }

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/service/service-123/',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.name).toBe('Updated')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      const result = await resource.updateService({
        serviceId: serviceId('service-123'),
        body: { name: 'Updated' } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('forwards headers', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/service/service-123/', ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('xyz')
            return HttpResponse.json({ id: 'service-123' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await resource.updateService({
        serviceId: serviceId('service-123'),
        body: { name: 'Updated' } as any,
        headers: { 'x-mongo-cluster-name': 'xyz' },
      })
    })
  })

  describe('upsertVersionSet', () => {
    test('upserts and returns version set', async () => {
      const mockResponse = { version_set_name: 'release', versions: {} }

      server.use(
        ...withMockAuth(
          http.put(
            'https://api.example.com/v1/test-org/service/service-123/version_sets/release/',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body).toBeDefined()
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      const result = await resource.upsertVersionSet({
        serviceId: serviceId('service-123'),
        versionSetName: 'release',
        body: { agent_version: 1 } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('forwards headers', async () => {
      server.use(
        ...withMockAuth(
          http.put(
            'https://api.example.com/v1/test-org/service/service-123/version_sets/staging/',
            ({ request }) => {
              expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
              return HttpResponse.json({ version_set_name: 'staging' })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await resource.upsertVersionSet({
        serviceId: serviceId('service-123'),
        versionSetName: 'staging',
        body: {} as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })
  })

  describe('deleteVersionSet', () => {
    test('returns void on success', async () => {
      server.use(
        ...withMockAuth(
          http.delete(
            'https://api.example.com/v1/test-org/service/service-123/version_sets/dev/',
            () => {
              return HttpResponse.text('', { status: 204, statusText: 'No Content' })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await expect(
        resource.deleteVersionSet({
          serviceId: serviceId('service-123'),
          versionSetName: 'dev',
        })
      ).resolves.toBeUndefined()
    })

    test('forwards headers on delete', async () => {
      server.use(
        ...withMockAuth(
          http.delete(
            'https://api.example.com/v1/test-org/service/service-123/version_sets/dev/',
            ({ request }) => {
              expect(request.headers.get('x-mongo-cluster-name')).toBe('xyz')
              return HttpResponse.text('', { status: 204, statusText: 'No Content' })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await resource.deleteVersionSet({
        serviceId: serviceId('service-123'),
        versionSetName: 'dev',
        headers: { 'x-mongo-cluster-name': 'xyz' },
      })
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.delete(
            'https://api.example.com/v1/test-org/service/service-123/version_sets/missing/',
            () => {
              return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      await expect(
        resource.deleteVersionSet({
          serviceId: serviceId('service-123'),
          versionSetName: 'missing',
        })
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('convenience aliases', () => {
    test('list delegates to getServices', async () => {
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/service/', () => {
            return HttpResponse.json(mockServicesResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      const result = await resource.list()
      expect(result).toEqual(mockServicesResponse)
    })

    test('create delegates to createService', async () => {
      const mockResponse = { id: 'service-new' }

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/service/', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ServiceResource(client, orgId('test-org'))
      const result = await resource.create({ body: { name: 'Test' } as any })
      expect(result).toEqual(mockResponse as unknown)
    })
  })
})
