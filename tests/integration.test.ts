import { describe, test, expect } from 'vitest'
import { config } from 'dotenv'
import { AmigoClient } from '../src/index'
import { errors } from '../src/index'
import { createAgentVersionRequestBody } from './test-helpers'

// Load environment variables from .env file
config()

/**
 * Integration tests for AmigoClient against real API endpoints.
 * These tests are skipped by default and should only be run manually during demos.
 *
 * To run these tests, set the environment variable RUN_INTEGRATION=true:
 * RUN_INTEGRATION=true npm test -- integration.test.ts
 */

// Only run integration tests when explicitly enabled
const RUN_INTEGRATION = process.env.RUN_INTEGRATION?.toLowerCase() === 'true'

// Real API configuration - these should be valid credentials for testing
const testConfig = {
  apiKey: process.env.AMIGO_API_KEY || 'test-api-key',
  apiKeyId: process.env.AMIGO_API_KEY_ID || 'test-api-key-id',
  userId: process.env.AMIGO_USER_ID || 'test-user-id',
  orgId: process.env.AMIGO_ORGANIZATION_ID || 'valid-org-id',
  baseUrl: process.env.AMIGO_BASE_URL || 'https://internal-api.amigo.ai',
}

describe.skipIf(!RUN_INTEGRATION)('Integration Tests - Real API', () => {
  let client: AmigoClient

  test('should get organization data successfully', async () => {
    client = new AmigoClient(testConfig)

    const orgData = await client.organizations.getOrganization()

    expect(typeof orgData).toBe('object')
  })

  test('should get services data successfully', async () => {
    client = new AmigoClient(testConfig)

    const servicesData = await client.services.getServices()

    expect(typeof servicesData).toBe('object')
  })

  test('should throw NotFoundError for invalid organization ID', async () => {
    const invalidConfig = {
      ...testConfig,
      orgId: 'invalid-org-id-123',
    }
    client = new AmigoClient(invalidConfig)

    await expect(client.organizations.getOrganization()).rejects.toThrow(errors.NotFoundError)
  })

  test('should throw AuthenticationError for invalid credentials', async () => {
    const invalidConfig = {
      ...testConfig,
      apiKey: 'invalid-api-key',
    }
    client = new AmigoClient(invalidConfig)

    await expect(client.organizations.getOrganization()).rejects.toThrow(errors.AuthenticationError)
  })

  test('should create and delete an agent successfully', async () => {
    client = new AmigoClient(testConfig)
    const uniqueName = `sdk_test_agent_${Math.random().toString(36).slice(2, 10)}`

    const agent = await client.organizations.createAgent({ agent_name: uniqueName })
    expect(agent).toBeDefined()
    expect(typeof agent.id).toBe('string')

    // Best-effort cleanup
    await client.organizations.deleteAgent(agent.id)
  })

  test('should create an agent version and list it via getAgentVersions', async () => {
    client = new AmigoClient(testConfig)
    const uniqueName = `sdk_test_agent_${Math.random().toString(36).slice(2, 10)}`

    // Create an agent to attach a version to
    const agent = await client.organizations.createAgent({ agent_name: uniqueName })
    expect(agent).toBeDefined()

    try {
      // Create agent version
      const createdVersion = await client.organizations.createAgentVersion(
        agent.id,
        createAgentVersionRequestBody
      )
      expect(createdVersion).toBeDefined()
      expect(typeof createdVersion.id).toBe('string')

      // Verify the version appears in the versions list
      const versions = await client.organizations.getAgentVersions(agent.id)
      expect(versions).toBeDefined()
      expect(Array.isArray(versions.agent_versions)).toBe(true)
      expect(versions.agent_versions.some(v => v.id === createdVersion.id)).toBe(true)
    } finally {
      // Best-effort cleanup
      await client.organizations.deleteAgent(agent.id)
    }
  })

  test('should list agents for the organization', async () => {
    client = new AmigoClient(testConfig)
    const resp = await client.organizations.getAgents()
    expect(resp).toBeDefined()
    expect(resp).toHaveProperty('agents')
    expect(Array.isArray(resp.agents)).toBe(true)
  })
})
