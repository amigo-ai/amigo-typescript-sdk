import type { PlatformFetch } from '../core/openapi-client'
import {
  getWebSocketConstructor,
  type PlatformWebSocketConstructor,
  type PlatformWebSocketLike,
} from '../core/websocket'
import { extractData } from '../../core/utils'
import type { components } from '../../generated/platform-api-types'
import type { CallSid, EntityId, PlatformServiceId, WorkspaceId } from '../core/branded-types'

export interface PlatformSessionSocketOptions {
  serviceId: PlatformServiceId | string
  entityId: EntityId | string
  conversationId?: string
  toolEvents?: boolean
  token?: string
  WebSocket?: PlatformWebSocketConstructor
}

interface PlatformSessionRealtimeConfig {
  apiKey: string
  webSocketBaseUrl: string
  WebSocket?: PlatformWebSocketConstructor
}

/** Resource for active sessions, text-session starts, injection, and WebSocket connect. */
export class PlatformSessionResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId,
    private realtime: PlatformSessionRealtimeConfig
  ) {}

  /** List active voice sessions. */
  async listActive() {
    return extractData(
      this.c.GET('/v1/{workspace_id}/sessions/active', {
        params: { path: { workspace_id: this.workspaceId } },
      })
    )
  }

  /** Start an SMS, WhatsApp, or web text session with an entity. */
  async start(options: { body: components['schemas']['StartSessionRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/sessions/start', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Inject an external event or operator guidance into an active voice session. */
  async inject(options: {
    callSid: CallSid | string
    body: components['schemas']['InjectRequest']
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/sessions/{call_sid}/inject', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            call_sid: options.callSid,
          },
        },
        body: options.body,
      })
    )
  }

  /** Build the public platform text-session WebSocket URL. */
  buildTextSessionUrl(options: Omit<PlatformSessionSocketOptions, 'token' | 'WebSocket'>): string {
    const url = new URL(
      `/v1/${encodeURIComponent(this.workspaceId)}/sessions/connect`,
      `${this.realtime.webSocketBaseUrl}/`
    )
    url.searchParams.set('service_id', options.serviceId)
    url.searchParams.set('entity_id', options.entityId)
    url.searchParams.set('tool_events', String(options.toolEvents ?? true))
    if (options.conversationId) {
      url.searchParams.set('conversation_id', options.conversationId)
    }
    return url.toString()
  }

  /** Connect to the public bidirectional text-session WebSocket. */
  connectTextSession(options: PlatformSessionSocketOptions): PlatformWebSocketLike {
    const WebSocketCtor = getWebSocketConstructor(options.WebSocket ?? this.realtime.WebSocket)
    const token = options.token ?? this.realtime.apiKey
    const url = this.buildTextSessionUrl(options)
    return new WebSocketCtor(url, ['auth', token])
  }
}
