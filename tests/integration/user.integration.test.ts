import { describe, test, expect } from 'vitest'
import { config as loadEnv } from 'dotenv'
import { AmigoClient, errors } from '../../src/index'
import type { components } from '../../src/generated/api-types'

// Load environment variables from .env file
loadEnv()

const requiredEnvVars = ['AMIGO_API_KEY', 'AMIGO_API_KEY_ID', 'AMIGO_USER_ID', 'AMIGO_ORGANIZATION_ID'] as const
const hasIntegrationEnv = requiredEnvVars.every(name => Boolean(process.env[name]))

if (!hasIntegrationEnv) {
  console.warn(`Skipping user integration tests. Missing one of: ${requiredEnvVars.join(', ')}`)
}

const integrationSuite = (hasIntegrationEnv ? describe.sequential : describe.skip) as typeof describe

// Real API configuration - these should be valid credentials for testing
const testConfig = {
  apiKey: process.env.AMIGO_API_KEY || 'test-api-key',
  apiKeyId: process.env.AMIGO_API_KEY_ID || 'test-api-key-id',
  userId: process.env.AMIGO_USER_ID || 'test-user-id',
  orgId: process.env.AMIGO_ORGANIZATION_ID || 'valid-org-id',
  baseUrl: process.env.AMIGO_BASE_URL || 'https://internal-api.amigo.ai',
}

function createClient(config = testConfig) {
  return new AmigoClient(config)
}

integrationSuite('Integration - User (Real API)', () => {
  let createdUserId: string | undefined
  let createdUserEmail: string | undefined

  test('create a test user succeeds and returns created user details', async () => {
    const client = createClient()
    const uniqueSuffix = Date.now().toString(36)
    const email = `ts-sdk-it-${uniqueSuffix}@example.com`
    const body: components['schemas']['user__create_invited_user__Request'] = {
      first_name: 'TS',
      last_name: 'SDK-IT',
      email,
      role_name: 'DefaultUserRole',
    }

    const result = await client.users.createUser(body)
    expect(result).toBeDefined()
    expect(typeof result.user_id).toBe('string')
    createdUserId = result.user_id
    createdUserEmail = email
  })

  test('update the test user succeeds', async () => {
    expect(createdUserId).toBeDefined()
    const client = createClient()

    const updateBody: components['schemas']['user__update_user_info__Request'] = {
      first_name: 'TS-Updated',
      last_name: 'SDK-IT-Updated',
      preferred_language: {},
      timezone: {},
    }

    await client.users.updateUser(createdUserId!, updateBody as any)
  })

  test('get users returns the created user and supports filtering', async () => {
    expect(createdUserId).toBeDefined()
    expect(createdUserEmail).toBeDefined()
    const client = createClient()

    const listById = await client.users.getUsers({ user_id: [createdUserId!] })
    expect(listById).toBeDefined()
    expect(Array.isArray(listById.users)).toBe(true)
    expect(listById.users.some(u => u.user_id === createdUserId)).toBe(true)
    expect(typeof listById.has_more).toBe('boolean')
    expect(
      listById.continuation_token === null || typeof listById.continuation_token === 'number'
    ).toBe(true)

    const listByEmail = await client.users.getUsers({ email: [createdUserEmail!] })
    expect(listByEmail).toBeDefined()
    expect(Array.isArray(listByEmail.users)).toBe(true)
    expect(listByEmail.users.some(u => u.email === createdUserEmail)).toBe(true)
    expect(typeof listByEmail.has_more).toBe('boolean')
    expect(
      listByEmail.continuation_token === null || typeof listByEmail.continuation_token === 'number'
    ).toBe(true)
  })

  test('delete the test user returns 204/void', async () => {
    expect(createdUserId).toBeDefined()
    const client = createClient()
    await expect(client.users.deleteUser(createdUserId!)).resolves.toBeUndefined()
  })

  // Error cases (one per endpoint)
  test('create user with non-existent role returns NotFoundError', async () => {
    const client = createClient()
    const body: components['schemas']['user__create_invited_user__Request'] = {
      first_name: 'Bad',
      last_name: 'Role',
      email: `bad-role-${Date.now().toString(36)}@example.com`,
      role_name: 'role-that-does-not-exist',
    }
    await expect(client.users.createUser(body)).rejects.toThrow(errors.NotFoundError)
  })

  test('update user for non-existent id returns NotFoundError', async () => {
    const client = createClient()
    const body: components['schemas']['user__update_user_info__Request'] = {
      first_name: 'X',
      last_name: 'Y',
      preferred_language: null,
      timezone: null,
    }
    await expect(client.users.updateUser('non-existent-id', body)).rejects.toThrow(
      errors.NotFoundError
    )
  })

  test('get users for invalid org returns NotFoundError', async () => {
    const invalidClient = createClient({ ...testConfig, orgId: 'invalid-org-id-123' })
    await expect(invalidClient.users.getUsers()).rejects.toThrow(errors.NotFoundError)
  })

  test('delete non-existent user returns NotFoundError', async () => {
    const client = createClient()
    await expect(client.users.deleteUser('non-existent-id')).rejects.toThrow(errors.NotFoundError)
  })
})
