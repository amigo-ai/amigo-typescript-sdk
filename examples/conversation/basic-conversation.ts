// Basic TypeScript usage example: manage a conversation with the Amigo SDK
//
// Import from the published npm package
//
// Environment variables are loaded from .env via dotenv (see examples/.env.example).

import 'dotenv/config'
import { AmigoClient, errors, type AmigoSdkConfig, components } from '@amigo-ai/sdk'

async function run(): Promise<void> {
  const config: AmigoSdkConfig = {
    apiKey: process.env.AMIGO_API_KEY ?? '',
    apiKeyId: process.env.AMIGO_API_KEY_ID ?? '',
    userId: process.env.AMIGO_USER_ID ?? '',
    orgId: process.env.AMIGO_ORGANIZATION_ID ?? '',
    baseUrl: process.env.AMIGO_BASE_URL || undefined,
  }

  const serviceId = process.env.AMIGO_SERVICE_ID
  if (!serviceId) {
    console.error('Missing AMIGO_SERVICE_ID. Set it in your .env file.')
    process.exit(1)
  }

  const client = new AmigoClient(config)

  try {
    // 1) Create a conversation and log streamed events
    console.log('Creating conversation...')
    const createEvents = await client.conversations.createConversation(
      { service_id: serviceId, service_version_set_name: 'release' },
      { response_format: 'text' }
    )

    let conversationId: string | undefined
    const logCreate = makeEventLogger('create')
    for await (const evt of createEvents) {
      logCreate(evt)
      if (evt.type === 'conversation-created') {
        conversationId = evt.conversation_id
      }
    }

    if (!conversationId) {
      throw new Error('Conversation was not created (no id received).')
    }

    // 2) Interact with the conversation via text (high-level helper) and log streamed events
    console.log('Sending a text message to the conversation...')
    const interactionEvents = await client.conversations.interactWithConversation(
      conversationId,
      'Hello from the Amigo TypeScript SDK example!',
      { request_format: 'text', response_format: 'text' }
    )

    const logInteract = makeEventLogger('interact')
    for await (const evt of interactionEvents) {
      logInteract(evt)
      if (evt.type === 'interaction-complete') {
        break
      }
    }

    // 3) Get messages for the conversation and log them
    console.log('Fetching recent messages...')
    const messagesPage = await client.conversations.getConversationMessages(conversationId, {
      limit: 10,
      sort_by: ['+created_at'],
    })
    for (const m of messagesPage.messages ?? []) {
      console.log('[message]', m)
    }

    // 4) Finish the conversation
    console.log('Finishing conversation...')
    try {
      await client.conversations.finishConversation(conversationId)
      console.log('Conversation finished.')
    } catch (e) {
      if (e instanceof errors.ConflictError || e instanceof errors.NotFoundError) {
        console.warn(`Finish conversation warning: ${e.name} - ${e.message}`)
      } else {
        throw e
      }
    }

    console.log('Done.')
  } catch (err) {
    if (err instanceof errors.AmigoError) {
      console.error(`AmigoError (${err.name})`, {
        message: err.message,
        statusCode: err.statusCode,
        context: err.context,
      })
    } else {
      console.error('Unexpected error:', err)
    }
    process.exitCode = 1
  }
}

type StreamEvent =
  | components['schemas']['conversation__create_conversation__Response']
  | components['schemas']['conversation__interact_with_conversation__Response']

function makeEventLogger(label: string) {
  let newMessageCount = 0
  let printedEllipsis = false
  return (event: StreamEvent) => {
    if (event.type === 'new-message') {
      if (newMessageCount < 3) {
        newMessageCount++
        console.log(`[${label} event]`, event)
      } else if (!printedEllipsis) {
        printedEllipsis = true
        console.log(`[${label} event] ... (more new-message events)`)
      }
      return
    }
    console.log(`[${label} event]`, event)
  }
}

await run()
