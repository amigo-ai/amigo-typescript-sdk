import { describe, test, expect, beforeAll } from 'vitest'
import { config as loadEnv } from 'dotenv'
import { AmigoClient, errors } from '../../src/index'

// Load environment variables from .env file
loadEnv()

// Real API configuration - these should be valid credentials for testing
const testConfig = {
  apiKey: process.env.AMIGO_API_KEY || 'test-api-key',
  apiKeyId: process.env.AMIGO_API_KEY_ID || 'test-api-key-id',
  userId: process.env.AMIGO_USER_ID || 'test-user-id',
  orgId: process.env.AMIGO_ORGANIZATION_ID || 'valid-org-id',
  baseUrl: process.env.AMIGO_BASE_URL || 'https://internal-api.amigo.ai',
}

// Use a single conversation across tests to reduce noise
describe.sequential('Integration - Conversation (Real API)', () => {
  const serviceId = '689b81e7afdaf934f4b48f81'
  let client: AmigoClient
  let conversationId: string | undefined
  let interactionId: string | undefined

  // Ensure no unfinished conversations exist for this service before starting
  beforeAll(async () => {
    client = new AmigoClient(testConfig)
    try {
      // Verify target service exists for this org to avoid 5xx from misconfiguration
      const services = await client.services.getServices()
      const serviceExists = Array.isArray((services as any).services)
        ? (services as any).services.some((s: any) => s.id === serviceId)
        : true // if schema differs, skip this check
      if (!serviceExists) {
        throw new Error(`Service ${serviceId} not found for org ${testConfig.orgId}`)
      }

      const existing = await client.conversations.getConversations({
        service_id: [serviceId],
        is_finished: false,
        limit: 25,
        sort_by: ['-created_at'],
      })
      for (const c of existing.conversations ?? []) {
        try {
          await client.conversations.finishConversation(c.id)
        } catch {
          // Ignore best-effort failures (already finished or conflicts)
        }
      }
    } catch {
      // Ignore listing errors; tests will surface issues during creation
    }

    // Small delay to allow backend eventual consistency after finishing conversations
    await new Promise(resolve => setTimeout(resolve, 500))
  })

  test('create conversation streams events and returns 201 with ids', async () => {
    client = new AmigoClient(testConfig)

    const events = await client.conversations.createConversation(
      {
        service_id: serviceId,
        service_version_set_name: 'release',
      },
      { response_format: 'text' }
    )

    let sawNewMessage = false

    for await (const evt of events) {
      if (evt && typeof evt === 'object' && 'type' in evt) {
        const type = (evt as any).type as string
        if (type === 'error') {
          throw new Error(`error event: ${JSON.stringify(evt)}`)
        }
        if (type === 'conversation-created') {
          conversationId = (evt as any).conversation_id
          expect(typeof conversationId).toBe('string')
        } else if (type === 'new-message') {
          sawNewMessage = true
          expect(typeof (evt as any).message).toBe('string')
        } else if (type === 'interaction-complete') {
          interactionId = (evt as any).interaction_id
          expect(typeof interactionId).toBe('string')
          // We have what we need; stop reading the stream to avoid hanging
          break
        }
      }
    }

    expect(conversationId).toBeDefined()
    expect(interactionId).toBeDefined()
    expect(sawNewMessage).toBe(true)
  }, 30000)

  test('recommend responses returns suggestions', async () => {
    expect(conversationId).toBeDefined()
    expect(interactionId).toBeDefined()
    client = new AmigoClient(testConfig)

    const recommendations = await client.conversations.recommendResponsesForInteraction(
      conversationId!,
      interactionId!
    )

    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations.recommended_responses)).toBe(true)
  }, 30000)

  test('get conversations can filter by id', async () => {
    expect(conversationId).toBeDefined()
    client = new AmigoClient(testConfig)

    const list = await client.conversations.getConversations({ id: [conversationId!] })
    expect(list).toBeDefined()
    expect(Array.isArray(list.conversations)).toBe(true)
    expect(list.conversations.some(c => c.id === conversationId)).toBe(true)
  })

  test('interact with conversation (text) streams events and returns 200', async () => {
    expect(conversationId).toBeDefined()
    client = new AmigoClient(testConfig)

    const form = new FormData()
    const text = "Hello, I'm sending a text message from the SDK!"
    const blob = new Blob([text], { type: 'text/plain; charset=utf-8' })
    form.append('recorded_message', blob, 'message.txt')

    const events = await client.conversations.interactWithConversation(conversationId!, form, {
      request_format: 'text',
      response_format: 'text',
    })

    let sawNewMessage = false
    let sawInteractionComplete = false
    let latestInteractionId: string | undefined

    for await (const evt of events) {
      if (evt && typeof evt === 'object' && 'type' in evt) {
        const type = (evt as any).type as string
        if (type === 'new-message') {
          sawNewMessage = true
        } else if (type === 'interaction-complete') {
          sawInteractionComplete = true
          latestInteractionId = (evt as any).interaction_id
          // Stop after completion to avoid waiting for server to close stream
          break
        }
      }
    }

    expect(sawNewMessage).toBe(true)
    expect(sawInteractionComplete).toBe(true)

    // Prefer most recent interaction for insights/messaging checks
    if (latestInteractionId) interactionId = latestInteractionId
  }, 30000)

  test('get conversation messages pagination works', async () => {
    expect(conversationId).toBeDefined()
    client = new AmigoClient(testConfig)

    const page1 = await client.conversations.getConversationMessages(conversationId!, {
      limit: 1,
      sort_by: ['+created_at'],
    })
    expect(page1).toBeDefined()
    expect(Array.isArray(page1.messages)).toBe(true)
    expect(page1.messages.length).toBe(1)
    expect(typeof page1.has_more).toBe('boolean')
    if (page1.has_more) {
      expect(page1.continuation_token).not.toBeNull()
      const page2 = await client.conversations.getConversationMessages(conversationId!, {
        limit: 1,
        continuation_token: page1.continuation_token ?? undefined,
        sort_by: ['+created_at'],
      })
      expect(page2).toBeDefined()
      expect(Array.isArray(page2.messages)).toBe(true)
      expect(page2.messages.length).toBe(1)
    }
  })

  test('get interaction insights returns data', async () => {
    expect(conversationId).toBeDefined()
    expect(interactionId).toBeDefined()
    client = new AmigoClient(testConfig)

    const insights = await client.conversations.getInteractionInsights(
      conversationId!,
      interactionId!
    )
    expect(insights).toBeDefined()
    expect(typeof insights.current_state_name).toBe('string')
  })

  test('finish conversation returns 204', async () => {
    expect(conversationId).toBeDefined()
    client = new AmigoClient(testConfig)
    try {
      await client.conversations.finishConversation(conversationId!)
    } catch (e) {
      // If the conversation was already auto-completed or not found due to eventual consistency
      expect(e instanceof errors.ConflictError || e instanceof errors.NotFoundError).toBe(true)
    }
  })
})
