import { BadRequestError } from '../core/errors'
import type { AmigoFetch } from '../core/openapi-client'
import { extractData, parseNdjsonStream } from '../core/utils'
import type { components, operations } from '../generated/api-types'

type VoiceData = Blob | Uint8Array | ReadableStream<Uint8Array>
export type InteractionInput = string | VoiceData

type InteractQuery = operations['interact-with-conversation']['parameters']['query']
type InteractQuerySerialized = Omit<InteractQuery, 'request_audio_config'> & {
  request_audio_config?: string | null
}

export class ConversationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  async createConversation(
    body: components['schemas']['conversation__create_conversation__Request'],
    queryParams: operations['create-conversation']['parameters']['query'],
    headers?: operations['create-conversation']['parameters']['header'],
    options?: { signal?: AbortSignal }
  ) {
    const resp = await this.c.POST('/v1/{organization}/conversation/', {
      params: { path: { organization: this.orgId }, query: queryParams },
      body,
      headers: {
        Accept: 'application/x-ndjson',
        ...(headers ?? {}),
      } as operations['create-conversation']['parameters']['header'],
      // Ensure we receive a stream for NDJSON
      parseAs: 'stream',
      ...(options?.signal && { signal: options.signal }),
    })

    // onResponse middleware throws for non-2xx; if we reach here, it's OK.
    return parseNdjsonStream<components['schemas']['conversation__create_conversation__Response']>(
      resp.response
    )
  }

  async interactWithConversation(
    conversationId: string,
    input: InteractionInput,
    queryParams: operations['interact-with-conversation']['parameters']['query'],
    headers?: operations['interact-with-conversation']['parameters']['header'],
    options?: { signal?: AbortSignal }
  ) {
    // Build body based on requested format, then perform a single POST
    let bodyToSend: FormData | VoiceData

    if (queryParams.request_format === 'text') {
      if (typeof input !== 'string') {
        throw new BadRequestError("textMessage is required when request_format is 'text'")
      }
      const form = new FormData()
      const blob = new Blob([input], { type: 'text/plain; charset=utf-8' })
      form.append('recorded_message', blob, 'message.txt')
      bodyToSend = form
    } else if (queryParams.request_format === 'voice') {
      if (typeof input === 'string') {
        throw new BadRequestError(
          "voice input must be a byte source when request_format is 'voice'"
        )
      }
      bodyToSend = input
    } else {
      throw new BadRequestError('Unsupported or missing request_format in params')
    }

    // Normalize nested object params that must be sent as JSON strings
    const normalizedQuery: InteractQuerySerialized = {
      ...queryParams,
      request_audio_config:
        typeof queryParams.request_audio_config === 'object' &&
        queryParams.request_audio_config !== null
          ? JSON.stringify(queryParams.request_audio_config)
          : (queryParams.request_audio_config ?? undefined),
    }

    const resp = await this.c.POST('/v1/{organization}/conversation/{conversation_id}/interact', {
      params: {
        path: { organization: this.orgId, conversation_id: conversationId },
        query: normalizedQuery as unknown as InteractQuery,
      },
      body: bodyToSend,
      headers: {
        Accept: 'application/x-ndjson',
        ...(headers ?? {}),
      } as operations['interact-with-conversation']['parameters']['header'],
      parseAs: 'stream',
      ...(options?.signal && { signal: options.signal }),
    })

    return parseNdjsonStream<
      components['schemas']['conversation__interact_with_conversation__Response']
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

  // Note: the OpenAPI response schema isn't correct for this endpoint.
  // TODO -- fix response typing.
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
    body: components['schemas']['conversation__generate_conversation_starter__Request'],
    headers?: operations['generate-conversation-starter']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/conversation/conversation_starter', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }
}
