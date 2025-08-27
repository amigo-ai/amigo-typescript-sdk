// Conversation lifecycle events example using the Amigo TypeScript SDK
//
// This example demonstrates how to:
// - Stream and handle conversation lifecycle events with handler-style callbacks
// - Pass an AbortSignal to cancel an in-flight request/stream
// - Accumulate streamed text and react to completion
//
// Requirements:
// - Install deps in examples/: npm i
// - Copy examples/.env.example to examples/.env and fill in credentials
// - Run: npm run start --silent  (or: npx tsx conversation/conversation-events.ts)

import 'dotenv/config'
import { AmigoClient, errors, type AmigoSdkConfig, components } from '@amigo-ai/sdk'

type CreateEvents = components['schemas']['conversation__create_conversation__Response']
type InteractEvents = components['schemas']['conversation__interact_with_conversation__Response']
type StreamEvent = CreateEvents | InteractEvents

type StreamHandlers = {
  onConversationCreated?: (event: Extract<StreamEvent, { type: 'conversation-created' }>) => void
  onNewMessage?: (event: Extract<StreamEvent, { type: 'new-message' }>) => void
  onInteractionComplete?: (event: Extract<StreamEvent, { type: 'interaction-complete' }>) => void
  onError?: (event: Extract<StreamEvent, { type: 'error' }>) => void
  onAnyEvent?: (event: StreamEvent) => void
}

class TimeoutManager {
  private timer?: NodeJS.Timeout
  private abortController = new AbortController()

  constructor(private timeoutMs: number = 15_000) {}

  start(): AbortController {
    this.timer = setTimeout(() => {
      this.abortController.abort(new Error(`Request timed out after ${this.timeoutMs}ms`))
    }, this.timeoutMs)
    return this.abortController
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  isAborted(): boolean {
    return this.abortController.signal.aborted
  }
}

function dispatchEvent(event: StreamEvent, handlers: StreamHandlers): void {
  handlers.onAnyEvent?.(event)
  switch (event.type) {
    case 'conversation-created':
      handlers.onConversationCreated?.(event)
      break
    case 'new-message':
      handlers.onNewMessage?.(event)
      break
    case 'interaction-complete':
      handlers.onInteractionComplete?.(event)
      break
    case 'error':
      handlers.onError?.(event)
      break
    default:
      // Unknown event types are ignored by default
      break
  }
}

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
        console.log(`[${label} event] ... (more new-message events)\n`)
      }
      return
    }
    console.log(`[${label} event]`, event)
  }
}

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

  // Optional timeout protection for streaming calls
  const createTimeout = new TimeoutManager(25_000)
  const createAbort = createTimeout.start()
  const { signal: createSignal } = createAbort

  try {
    console.log('\nCreating conversation and handling streamed events...')

    const createEvents = await client.conversations.createConversation(
      { service_id: serviceId, service_version_set_name: 'release' },
      { response_format: 'text' },
      undefined,
      { signal: createSignal }
    )

    let conversationId: string | undefined
    let initialInteractionId: string | undefined
    let initialMessage = ''
    let createCompleted = false

    const logCreate = makeEventLogger('create')
    for await (const evt of createEvents) {
      logCreate(evt)
      dispatchEvent(evt, {
        onConversationCreated: e => {
          conversationId = e.conversation_id
        },
        onNewMessage: e => {
          if (typeof e.message === 'string') initialMessage += e.message
        },
        onInteractionComplete: e => {
          initialInteractionId = e.interaction_id
          createTimeout.clear()
          createCompleted = true
        },
        onError: e => {
          console.error('[create error]', e)
          createTimeout.clear()
        },
      })
      if (createCompleted) break
    }

    if (!conversationId) {
      throw new Error('Conversation was not created (no id received).')
    }

    console.log('\nCreated conversation:', conversationId)
    if (initialMessage) console.log('Initial assistant message (partial):', initialMessage)

    // Interact with the conversation using text and stream events with handlers
    console.log('\nInteracting with conversation (text)...')
    const interactTimeout = new TimeoutManager(25_000)
    const interactAbort = interactTimeout.start()
    const { signal: interactSignal } = interactAbort
    const interactionEvents = await client.conversations.interactWithConversation(
      conversationId,
      'Hello from the events example! Please tell me a fun fact about otters.',
      { request_format: 'text', response_format: 'text' },
      undefined,
      { signal: interactSignal }
    )

    let fullResponse = ''
    let latestInteractionId: string | undefined
    let interactionCompleted = false

    const logInteract = makeEventLogger('interact')
    for await (const evt of interactionEvents) {
      logInteract(evt)
      dispatchEvent(evt, {
        onNewMessage: e => {
          if (typeof e.message === 'string') fullResponse += e.message
        },
        onInteractionComplete: e => {
          latestInteractionId = e.interaction_id
          console.log('\nInteraction complete.\n')
          interactionCompleted = true
          interactTimeout.clear()
        },
        onError: e => {
          console.error('[interact error]', e)
          interactTimeout.clear()
        },
      })
      if (interactionCompleted) break
    }

    if (fullResponse) console.log('Full response:', fullResponse)
    if (latestInteractionId) console.log('Interaction id:', latestInteractionId)

    // Retrieve recent messages
    console.log('\nFetching recent messages...')
    const messagesPage = await client.conversations.getConversationMessages(conversationId, {
      limit: 10,
      sort_by: ['+created_at'],
    })
    for (const m of messagesPage.messages ?? []) {
      console.log('[message]', m)
    }

    // Finish the conversation gracefully
    console.log('\nFinishing conversation...')
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
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Request aborted (timeout or manual):', err.message)
    } else if (err instanceof errors.AmigoError) {
      console.error(err)
    } else {
      console.error('Unexpected error:', err)
    }
    process.exitCode = 1
  } finally {
    createTimeout.clear()
  }
}

await run()
