import { AmigoFetch } from '../core/openapi-client'
import { extractData, parseNdjsonStream } from '../core/utils'
import { components, operations } from '../generated/api-types'

// Request body for Interact with Conversation
export type InteractWithConversationBody =
  | FormData // text: multipart/form-data with field `recorded_message`
  | Blob // voice: raw audio (or text encoded to bytes)
  | ArrayBuffer // voice
  | Uint8Array // voice
  | ReadableStream<Uint8Array> // voice streaming
  | Buffer // Node.js environments: voice

export class ConversationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  async createConversation(
    body: components['schemas']['src__app__endpoints__conversation__create_conversation__Request'],
    queryParams: operations['create-conversation']['parameters']['query'],
    headers?: operations['create-conversation']['parameters']['header']
  ) {
    const resp = await this.c.POST('/v1/{organization}/conversation/', {
      params: { path: { organization: this.orgId }, query: queryParams },
      body,
      headers,
      // Ensure we receive a stream for NDJSON
      parseAs: 'stream',
    })

    // onResponse middleware throws for non-2xx; if we reach here, it's OK.
    return parseNdjsonStream<
      components['schemas']['src__app__endpoints__conversation__create_conversation__Response']
    >(resp.response)
  }

  async interactWithConversation(
    conversationId: string,
    body: InteractWithConversationBody,
    queryParams: operations['interact-with-conversation']['parameters']['query'],
    headers?: operations['interact-with-conversation']['parameters']['header']
  ) {
    const resp = await this.c.POST('/v1/{organization}/conversation/{conversation_id}/interact', {
      params: {
        path: { organization: this.orgId, conversation_id: conversationId },
        query: queryParams,
      },
      body,
      headers,
      parseAs: 'stream',
    })

    return parseNdjsonStream<
      components['schemas']['src__app__endpoints__conversation__interact_with_conversation__Response']
    >(resp.response)
  }

  async getConversations(
    queryParams?: operations['get-conversations']['parameters']['query'],
    headers?: operations['get-conversations']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/conversation/', {
        params: { path: { organization: this.orgId }, query: queryParams },
        headers,
      })
    )
  }

  async getConversationMessages(
    conversationId: string,
    queryParams?: operations['get-conversation-messages']['parameters']['query'],
    headers?: operations['get-conversation-messages']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/conversation/{conversation_id}/messages/', {
        params: {
          path: { organization: this.orgId, conversation_id: conversationId },
          query: queryParams,
        },
        headers,
      })
    )
  }

  async finishConversation(
    conversationId: string,
    headers?: operations['finish-conversation']['parameters']['header']
  ) {
    await this.c.POST('/v1/{organization}/conversation/{conversation_id}/finish/', {
      params: { path: { organization: this.orgId, conversation_id: conversationId } },
      headers,
      // No content is expected; parse as text to access raw Response
      parseAs: 'text',
    })
    return
  }

  async recommendResponsesForInteraction(
    conversationId: string,
    interactionId: string,
    headers?: operations['recommend-responses-for-interaction']['parameters']['header']
  ) {
    return extractData(
      this.c.GET(
        '/v1/{organization}/conversation/{conversation_id}/interaction/{interaction_id}/recommend_responses',
        {
          params: {
            path: {
              organization: this.orgId,
              conversation_id: conversationId,
              interaction_id: interactionId,
            },
          },
          headers,
        }
      )
    )
  }

  async getInteractionInsights(
    conversationId: string,
    interactionId: string,
    headers?: operations['get-interaction-insights']['parameters']['header']
  ) {
    return extractData(
      this.c.GET(
        '/v1/{organization}/conversation/{conversation_id}/interaction/{interaction_id}/insights',
        {
          params: {
            path: {
              organization: this.orgId,
              conversation_id: conversationId,
              interaction_id: interactionId,
            },
          },
          headers,
        }
      )
    )
  }

  async getMessageSource(
    conversationId: string,
    messageId: string,
    headers?: operations['retrieve-message-source']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/conversation/{conversation_id}/messages/{message_id}/source', {
        params: {
          path: {
            organization: this.orgId,
            conversation_id: conversationId,
            message_id: messageId,
          },
        },
        headers,
      })
    )
  }

  async generateConversationStarters(
    body: components['schemas']['src__app__endpoints__conversation__generate_conversation_starter__Request'],
    queryParams?: operations['generate-conversation-starter']['parameters']['query'],
    headers?: operations['generate-conversation-starter']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/conversation/conversation_starter', {
        params: { path: { organization: this.orgId }, query: queryParams },
        body,
        headers,
      })
    )
  }
}
