import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { OrganizationResource } from '../../src/resources/organization'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { NotFoundError } from '../../src/core/errors'
import type { components } from '../../src/generated/api-types'
import { mockConfig, withMockAuth } from '../test-helpers'

// Mock organization response
const mockOrganizationResponse: components['schemas']['organization__get_organization__Response'] =
  {
    org_id: 'test-org',
    org_name: 'Test Organization',
    title: 'Welcome to Test Org',
    main_description: 'This is a test organization for API testing',
    sub_description: 'Built with Amigo AI platform',
    onboarding_instructions: ['Step 1: Welcome', 'Step 2: Setup'],
    default_user_preferences: null,
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

describe('OrganizationResource', () => {
  test('getOrganization returns data', async () => {
    // Mock auth and API endpoints using helper
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/organization/', () => {
          return HttpResponse.json(mockOrganizationResponse)
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')
    const result = await organizationResource.getOrganization()

    expect(result).toBeDefined()
    expect(result).toEqual(mockOrganizationResponse)
    expect(result!.org_id).toBe('test-org')
    expect(result!.org_name).toBe('Test Organization')
  })

  test('getOrganization throws an error if the organization does not exist', async () => {
    // Mock auth endpoint and 404 API response using helper
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/nonexistent-org/organization/', () => {
          return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'nonexistent-org')

    await expect(organizationResource.getOrganization()).rejects.toThrow(NotFoundError)
  })

  test('getAgents returns data', async () => {
    const mockAgentsResponse: components['schemas']['organization__get_agents__Response'] = {
      agents: [
        {
          id: 'agent-1',
          name: 'Agent One',
          deprecated: false,
          latest_version: 1,
        },
      ],
      has_more: false,
      continuation_token: null,
    }

    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/organization/agent', async () => {
          return HttpResponse.json(mockAgentsResponse)
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')

    const result = await organizationResource.getAgents()
    expect(result).toEqual(mockAgentsResponse)
    expect(result.agents).toHaveLength(1)
    expect(result.agents[0]!.id).toBe('agent-1')
    expect(result.has_more).toBe(false)
  })

  test('getAgents throws ValidationError on 422', async () => {
    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/organization/agent', async () => {
          return HttpResponse.json(
            { detail: 'invalid query' },
            { status: 422, statusText: 'Unprocessable Entity' }
          )
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')

    await expect(organizationResource.getAgents()).rejects.toThrow()
  })

  test('getAgentVersions returns data (empty list)', async () => {
    const mockAgentVersions: components['schemas']['organization__get_agent_versions__Response'] = {
      agent_versions: [],
      has_more: false,
      continuation_token: null,
    }

    server.use(
      ...withMockAuth(
        http.get(
          'https://api.example.com/v1/test-org/organization/agent/agent-1/version',
          async () => {
            return HttpResponse.json(mockAgentVersions)
          }
        )
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')

    const result = await organizationResource.getAgentVersions('agent-1')
    expect(result).toEqual(mockAgentVersions)
    expect(result.agent_versions).toHaveLength(0)
    expect(result.has_more).toBe(false)
  })

  test('getAgentVersions throws NotFoundError on 404', async () => {
    server.use(
      ...withMockAuth(
        http.get(
          'https://api.example.com/v1/nonexistent-org/organization/agent/missing-agent/version',
          async () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          }
        )
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'nonexistent-org')

    await expect(organizationResource.getAgentVersions('missing-agent')).rejects.toThrow(
      NotFoundError
    )
  })

  test('getAgents passes query parameters correctly', async () => {
    const mockAgentsResponse: components['schemas']['organization__get_agents__Response'] = {
      agents: [],
      has_more: false,
      continuation_token: null,
    }

    server.use(
      ...withMockAuth(
        http.get('https://api.example.com/v1/test-org/organization/agent', async ({ request }) => {
          const url = new URL(request.url)
          const params = url.searchParams

          expect(params.getAll('id')).toEqual(['agent-1', 'agent-2'])
          expect(params.get('deprecated')).toBe('true')
          expect(params.get('limit')).toBe('10')
          expect(params.get('continuation_token')).toBe('5')

          return HttpResponse.json(mockAgentsResponse)
        })
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')

    await organizationResource.getAgents({
      id: ['agent-1', 'agent-2'],
      deprecated: true,
      limit: 10,
      continuation_token: 5,
    })
  })

  test('getAgentVersions passes query parameters correctly', async () => {
    const mockAgentVersions: components['schemas']['organization__get_agent_versions__Response'] = {
      agent_versions: [],
      has_more: false,
      continuation_token: null,
    }

    server.use(
      ...withMockAuth(
        http.get(
          'https://api.example.com/v1/test-org/organization/agent/agent-1/version',
          async ({ request }) => {
            const url = new URL(request.url)
            const params = url.searchParams

            expect(params.get('version')).toBe('1-3')
            expect(params.get('limit')).toBe('2')
            expect(params.get('continuation_token')).toBe('7')
            expect(params.getAll('sort_by')).toEqual(['+version', '-version'])

            return HttpResponse.json(mockAgentVersions)
          }
        )
      )
    )

    const client = createAmigoFetch(mockConfig)
    const organizationResource = new OrganizationResource(client, 'test-org')

    await organizationResource.getAgentVersions('agent-1', {
      version: '1-3',
      limit: 2,
      continuation_token: 7,
      sort_by: ['+version', '-version'],
    })
  })
})
