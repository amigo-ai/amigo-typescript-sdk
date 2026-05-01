import type { PlatformFetch } from '../core/openapi-client'
import { extractData, parseSseStream } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { PlatformConversationId, WorkspaceId } from '../core/branded-types'

/** Resource for managing unified platform conversations. */
export class PlatformConversationResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List voice and text conversations in the workspace. */
  async list(options?: {
    query?: operations['list_conversations_v1__workspace_id__conversations_get']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/conversations', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Create a text conversation. */
  async create(options: { body: components['schemas']['CreateConversationRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/conversations', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Get a conversation detail by ID. */
  async get(options: { conversationId: PlatformConversationId | string }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/conversations/{conversation_id}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            conversation_id: options.conversationId,
          },
        },
      })
    )
  }

  /** Close a text conversation. */
  async close(options: { conversationId: PlatformConversationId | string }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/conversations/{conversation_id}', {
      params: {
        path: {
          workspace_id: this.workspaceId,
          conversation_id: options.conversationId,
        },
      },
    })
    return undefined
  }

  /** Send a text turn and receive the full JSON response. */
  async createTurn(options: {
    conversationId: PlatformConversationId | string
    body: components['schemas']['TurnRequest']
    query?: operations['create_turn_v1__workspace_id__conversations__conversation_id__turns_post']['parameters']['query']
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/conversations/{conversation_id}/turns', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            conversation_id: options.conversationId,
          },
          query: options.query,
        },
        body: options.body,
        headers: { Accept: 'application/json' },
      })
    )
  }

  /** Send a text turn and receive typed Server-Sent Events. */
  async streamTurn(options: {
    conversationId: PlatformConversationId | string
    body: components['schemas']['TurnRequest']
    query?: operations['create_turn_v1__workspace_id__conversations__conversation_id__turns_post']['parameters']['query']
    signal?: AbortSignal
  }) {
    const resp = await this.c.POST('/v1/{workspace_id}/conversations/{conversation_id}/turns', {
      params: {
        path: {
          workspace_id: this.workspaceId,
          conversation_id: options.conversationId,
        },
        query: options.query,
      },
      body: options.body,
      headers: { Accept: 'text/event-stream' },
      parseAs: 'stream',
      ...(options.signal && { signal: options.signal }),
    })

    return parseSseStream<components['schemas']['TurnStreamEvent']>(resp.response)
  }
}
