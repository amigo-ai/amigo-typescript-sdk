/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AgentResource } from '../../src/resources/agent'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { NotFoundError, ValidationError } from '../../src/core/errors'
import { mockConfig, withMockAuth } from '../test-helpers'
import { orgId, agentId } from '../../src/core/branded-types'

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

describe('AgentResource', () => {
  describe('createAgent', () => {
    test('creates and returns agent', async () => {
      const mockResponse = { agent_id: 'agent-1', name: 'Test Agent' }

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/organization/agent',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.name).toBe('Test Agent')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.createAgent({
        body: { name: 'Test Agent' } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('forwards headers', async () => {
      const mockResponse = { agent_id: 'agent-1' }

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/organization/agent', ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await resource.createAgent({
        body: { name: 'Test' } as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })

    test('throws ValidationError on 422', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/organization/agent', () => {
            return HttpResponse.json(
              { detail: 'bad' },
              { status: 422, statusText: 'Unprocessable Entity' }
            )
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await expect(resource.createAgent({ body: {} as any })).rejects.toThrow(ValidationError)
    })
  })

  describe('getAgents', () => {
    test('returns agents list', async () => {
      const mockResponse = { agents: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/organization/agent', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.getAgents()

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query parameters', async () => {
      const mockResponse = { agents: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/organization/agent', ({ request }) => {
            const url = new URL(request.url)
            expect(url.searchParams.get('limit')).toBe('5')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await resource.getAgents({ query: { limit: 5 } as any })
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/bad-org/organization/agent', () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('bad-org'))
      await expect(resource.getAgents()).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteAgent', () => {
    test('returns void on success', async () => {
      server.use(
        ...withMockAuth(
          http.delete('https://api.example.com/v1/test-org/organization/agent/agent-1/', () => {
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await expect(resource.deleteAgent({ agentId: agentId('agent-1') })).resolves.toBeUndefined()
    })

    test('forwards headers on delete', async () => {
      server.use(
        ...withMockAuth(
          http.delete(
            'https://api.example.com/v1/test-org/organization/agent/agent-1/',
            ({ request }) => {
              expect(request.headers.get('x-mongo-cluster-name')).toBe('xyz')
              return HttpResponse.text('', { status: 204, statusText: 'No Content' })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await resource.deleteAgent({
        agentId: agentId('agent-1'),
        headers: { 'x-mongo-cluster-name': 'xyz' },
      })
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.delete('https://api.example.com/v1/test-org/organization/agent/missing/', () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await expect(resource.deleteAgent({ agentId: agentId('missing') })).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('createAgentVersion', () => {
    test('creates and returns agent version', async () => {
      const mockResponse = { version: 1, agent_id: 'agent-1' }

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/organization/agent/agent-1/',
            async ({ request }) => {
              const body = (await request.json()) as any
              expect(body.persona).toBe('helpful')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.createAgentVersion({
        agentId: agentId('agent-1'),
        body: { persona: 'helpful' } as any,
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query parameters for dry run', async () => {
      const mockResponse = { version: 1 }

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/organization/agent/agent-1/',
            ({ request }) => {
              const url = new URL(request.url)
              expect(url.searchParams.get('dry_run')).toBe('true')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await resource.createAgentVersion({
        agentId: agentId('agent-1'),
        body: {} as any,
        query: { dry_run: true } as any,
      })
    })
  })

  describe('getAgentVersions', () => {
    test('returns versions list', async () => {
      const mockResponse = { versions: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/organization/agent/agent-1/version', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.getAgentVersions({
        agentId: agentId('agent-1'),
      })

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query and header parameters', async () => {
      const mockResponse = { versions: [], has_more: false }

      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/organization/agent/agent-1/version',
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
      const resource = new AgentResource(client, orgId('test-org'))
      await resource.getAgentVersions({
        agentId: agentId('agent-1'),
        query: { limit: 10 } as any,
        headers: { 'x-mongo-cluster-name': 'abc' },
      })
    })
  })

  describe('convenience aliases', () => {
    test('list delegates to getAgents', async () => {
      const mockResponse = { agents: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/organization/agent', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.list()
      expect(result).toEqual(mockResponse as unknown)
    })

    test('create delegates to createAgent', async () => {
      const mockResponse = { agent_id: 'agent-1' }

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/organization/agent', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      const result = await resource.create({ body: { name: 'Test' } as any })
      expect(result).toEqual(mockResponse as unknown)
    })

    test('delete delegates to deleteAgent', async () => {
      server.use(
        ...withMockAuth(
          http.delete('https://api.example.com/v1/test-org/organization/agent/agent-1/', () => {
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new AgentResource(client, orgId('test-org'))
      await expect(resource.delete({ agentId: agentId('agent-1') })).resolves.toBeUndefined()
    })
  })
})
