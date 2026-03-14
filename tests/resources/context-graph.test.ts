/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ContextGraphResource } from '../../src/resources/context-graph'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { NotFoundError, ValidationError } from '../../src/core/errors'
import { mockConfig, withMockAuth } from '../test-helpers'
import { orgId } from '../../src/core/branded-types'

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

const HSM_BASE = 'organization/service_hierarchical_state_machine'

describe('ContextGraphResource', () => {
  describe('createContextGraph', () => {
    test('creates and returns context graph', async () => {
      const mockResponse = { id: 'hsm-1', name: 'Test Graph' }

      server.use(
        ...withMockAuth(
          http.post(`https://api.example.com/v1/test-org/${HSM_BASE}`, async ({ request }) => {
            const body = (await request.json()) as any
            expect(body.name).toBe('Test Graph')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.createContextGraph({
        body: { name: 'Test Graph' } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('forwards headers', async () => {
      const mockResponse = { id: 'hsm-1' }

      server.use(
        ...withMockAuth(
          http.post(`https://api.example.com/v1/test-org/${HSM_BASE}`, ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await resource.createContextGraph({
        body: { name: 'Test' } as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })

    test('throws ValidationError on 422', async () => {
      server.use(
        ...withMockAuth(
          http.post(`https://api.example.com/v1/test-org/${HSM_BASE}`, () => {
            return HttpResponse.json(
              { detail: 'bad' },
              { status: 422, statusText: 'Unprocessable Entity' }
            )
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await expect(resource.createContextGraph({ body: {} as any })).rejects.toThrow(
        ValidationError
      )
    })
  })

  describe('getContextGraphs', () => {
    test('returns context graphs list', async () => {
      const mockResponse = { state_machines: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get(`https://api.example.com/v1/test-org/${HSM_BASE}`, () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.getContextGraphs()

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query parameters', async () => {
      const mockResponse = { state_machines: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get(`https://api.example.com/v1/test-org/${HSM_BASE}`, ({ request }) => {
            const url = new URL(request.url)
            expect(url.searchParams.get('limit')).toBe('5')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await resource.getContextGraphs({ query: { limit: 5 } as any })
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get(`https://api.example.com/v1/bad-org/${HSM_BASE}`, () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('bad-org'))
      await expect(resource.getContextGraphs()).rejects.toThrow(NotFoundError)
    })
  })

  describe('createContextGraphVersion', () => {
    test('creates and returns version', async () => {
      const mockResponse = { version: 1, id: 'hsm-1' }

      server.use(
        ...withMockAuth(
          http.post(
            `https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/`,
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.states).toBeDefined()
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.createContextGraphVersion({
        contextGraphId: 'hsm-1',
        body: { states: [] } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query parameters for dry run', async () => {
      const mockResponse = { version: 1 }

      server.use(
        ...withMockAuth(
          http.post(`https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/`, ({ request }) => {
            const url = new URL(request.url)
            expect(url.searchParams.get('dry_run')).toBe('true')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await resource.createContextGraphVersion({
        contextGraphId: 'hsm-1',
        body: {} as any,
        query: { dry_run: true } as any,
      })
    })
  })

  describe('deleteContextGraph', () => {
    test('returns void on success', async () => {
      server.use(
        ...withMockAuth(
          http.delete(`https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/`, () => {
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await expect(
        resource.deleteContextGraph({ contextGraphId: 'hsm-1' })
      ).resolves.toBeUndefined()
    })

    test('forwards headers on delete', async () => {
      server.use(
        ...withMockAuth(
          http.delete(`https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/`, ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('xyz')
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await resource.deleteContextGraph({
        contextGraphId: 'hsm-1',
        headers: { 'x-mongo-cluster-name': 'xyz' },
      })
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.delete(`https://api.example.com/v1/test-org/${HSM_BASE}/missing/`, () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await expect(resource.deleteContextGraph({ contextGraphId: 'missing' })).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('getContextGraphVersions', () => {
    test('returns versions list', async () => {
      const mockResponse = { versions: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get(`https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/version`, () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.getContextGraphVersions({
        contextGraphId: 'hsm-1',
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query and header parameters', async () => {
      const mockResponse = { versions: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get(
            `https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/version`,
            ({ request }) => {
              const url = new URL(request.url)
              expect(url.searchParams.get('limit')).toBe('10')
              expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await resource.getContextGraphVersions({
        contextGraphId: 'hsm-1',
        query: { limit: 10 } as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })
  })

  describe('convenience aliases', () => {
    test('list delegates to getContextGraphs', async () => {
      const mockResponse = { state_machines: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get(`https://api.example.com/v1/test-org/${HSM_BASE}`, () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.list()
      expect(result).toEqual(mockResponse as unknown)
    })

    test('create delegates to createContextGraph', async () => {
      const mockResponse = { id: 'hsm-1' }

      server.use(
        ...withMockAuth(
          http.post(`https://api.example.com/v1/test-org/${HSM_BASE}`, () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      const result = await resource.create({ body: { name: 'Test' } as any })
      expect(result).toEqual(mockResponse as unknown)
    })

    test('delete delegates to deleteContextGraph', async () => {
      server.use(
        ...withMockAuth(
          http.delete(`https://api.example.com/v1/test-org/${HSM_BASE}/hsm-1/`, () => {
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ContextGraphResource(client, orgId('test-org'))
      await expect(resource.delete({ contextGraphId: 'hsm-1' })).resolves.toBeUndefined()
    })
  })
})
