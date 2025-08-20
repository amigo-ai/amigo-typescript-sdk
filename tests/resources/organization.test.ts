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
})
