import { describe, test, expect } from 'vitest'
import { config } from 'dotenv'
import { AmigoClient } from '../src/index'
import { errors } from '../src/index'

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
})
