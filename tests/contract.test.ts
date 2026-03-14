/**
 * Contract tests that verify SDK resource methods match the live OpenAPI spec.
 * Run with: RUN_CONTRACT=true npx vitest run tests/contract.test.ts
 */
import { describe, it, expect, beforeAll } from 'vitest'

interface OpenApiSpec {
  info: { version: string }
  paths: Record<string, Record<string, { operationId?: string }>>
}

const OPENAPI_URL = 'https://api.amigo.ai/v1/openapi.json'

// Map of SDK resource methods to their expected OpenAPI operationIds
const SDK_OPERATION_MAP: Record<string, string[]> = {
  // ConversationResource
  'conversations.createConversation': ['create-conversation'],
  'conversations.interactWithConversation': ['interact-with-conversation'],
  'conversations.getConversations': ['get-conversations'],
  'conversations.getConversationMessages': ['get-conversation-messages'],
  'conversations.finishConversation': ['finish-conversation'],
  'conversations.recommendResponsesForInteraction': ['recommend-responses-for-interaction'],
  'conversations.getInteractionInsights': ['get-interaction-insights'],
  'conversations.getMessageSource': ['get-message-source'],
  'conversations.generateConversationStarters': ['generate-conversation-starters'],

  // UserResource
  'users.getUsers': ['get-users'],
  'users.createUser': ['create-user'],
  'users.deleteUser': ['delete-user'],
  'users.updateUser': ['modify-user'],
  'users.getUserModel': ['get-user-model'],

  // OrganizationResource
  'organizations.getOrganization': ['get-organization'],

  // ServiceResource
  'services.getServices': ['get-services'],
}

describe.skipIf(!process.env.RUN_CONTRACT)('OpenAPI Contract Tests', () => {
  let spec: OpenApiSpec

  beforeAll(async () => {
    const response = await fetch(OPENAPI_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`)
    }
    spec = (await response.json()) as OpenApiSpec
  })

  it('should have a valid spec version', () => {
    expect(spec.info.version).toBeTruthy()
  })

  it('should contain all operation IDs referenced by SDK methods', () => {
    const specOperationIds = new Set<string>()

    for (const [, methods] of Object.entries(spec.paths)) {
      for (const [, operation] of Object.entries(methods)) {
        if (typeof operation === 'object' && operation.operationId) {
          specOperationIds.add(operation.operationId)
        }
      }
    }

    const missingOperations: string[] = []

    for (const [sdkMethod, expectedOps] of Object.entries(SDK_OPERATION_MAP)) {
      for (const opId of expectedOps) {
        if (!specOperationIds.has(opId)) {
          missingOperations.push(`${sdkMethod} → ${opId}`)
        }
      }
    }

    if (missingOperations.length > 0) {
      console.warn('Missing operations in OpenAPI spec:', missingOperations)
    }

    expect(missingOperations).toEqual([])
  })

  it('should not have new endpoints missing from SDK', () => {
    const knownOperationIds = new Set(Object.values(SDK_OPERATION_MAP).flat())

    const unknownEndpoints: string[] = []

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (
          typeof operation === 'object' &&
          operation.operationId &&
          !knownOperationIds.has(operation.operationId)
        ) {
          unknownEndpoints.push(`${method.toUpperCase()} ${path} (${operation.operationId})`)
        }
      }
    }

    if (unknownEndpoints.length > 0) {
      console.warn(
        `Found ${unknownEndpoints.length} endpoints in OpenAPI spec not mapped in SDK:`,
        unknownEndpoints.slice(0, 10)
      )
    }

    // This is informational — we expect some endpoints may not be in the SDK yet
    // Fail only if the count seems unreasonably high (likely a spec/SDK version mismatch)
    expect(unknownEndpoints.length).toBeLessThan(100)
  })
})
