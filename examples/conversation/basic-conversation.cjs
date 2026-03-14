// Basic CommonJS usage example: manage a conversation with the Amigo SDK
//
// This example demonstrates the same conversation lifecycle as basic-conversation.ts
// but using CommonJS require() syntax for environments that don't support ES modules.
//
// Run with: node conversation/basic-conversation.cjs
// (from the examples directory)
//
// Environment variables are loaded from .env via dotenv (see examples/.env.example).

'use strict'

require('dotenv').config()

const { AmigoClient, errors } = require('@amigo-ai/sdk')

async function run() {
  const config = {
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
    console.log('\nCreating conversation...')
    const createEvents = await client.conversations.createConversation(
      { service_id: serviceId },
      { response_format: 'text' }
    )

    let conversationId
    for await (const evt of createEvents) {
      console.log('[create event]', evt.type)
      if (evt.type === 'conversation-created') {
        conversationId = evt.conversation_id
      }
      if (evt.type === 'interaction-complete') {
        break
      }
    }

    if (!conversationId) {
      throw new Error('Conversation was not created (no id received).')
    }
    console.log('Conversation ID:', conversationId)

    // 2) Get the conversation by id
    console.log('\nFetching conversation by id...')
    const listById = await client.conversations.getConversations({ id: [conversationId] })
    console.log('Found', listById.conversations.length, 'conversation(s)')

    // 3) Interact with the conversation via text
    console.log('\nSending a text message to the conversation...')
    const interactionEvents = await client.conversations.interactWithConversation(
      conversationId,
      'Hello from the Amigo SDK CommonJS example!',
      { request_format: 'text', response_format: 'text' }
    )

    for await (const evt of interactionEvents) {
      console.log('[interact event]', evt.type)
      if (evt.type === 'interaction-complete') {
        break
      }
    }

    // 4) Get messages for the conversation
    console.log('\nFetching recent messages...')
    const messagesPage = await client.conversations.getConversationMessages(conversationId, {
      limit: 10,
      sort_by: ['+created_at'],
    })
    console.log('Found', messagesPage.messages.length, 'message(s)')

    // 5) Finish the conversation
    console.log('\nFinishing conversation...')
    try {
      await client.conversations.finishConversation(conversationId)
      console.log('Conversation finished.')
    } catch (e) {
      if (e instanceof errors.ConflictError || e instanceof errors.NotFoundError) {
        console.warn('Finish conversation warning:', e.name, '-', e.message)
      } else {
        throw e
      }
    }

    console.log('\nDone.')
  } catch (err) {
    if (err instanceof errors.AmigoError) {
      console.error('Amigo API Error:', err)
    } else {
      console.error('Unexpected error:', err)
    }
    process.exitCode = 1
  }
}

run()
