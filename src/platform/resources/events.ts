import type { PlatformFetch } from '../core/openapi-client'
import { parseSseStream } from '../../core/utils'
import type { components } from '../../generated/platform-api-types'
import type { WorkspaceId } from '../core/branded-types'

/** Resource for streaming workspace-level platform events. */
export class PlatformEventResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** Open the workspace Server-Sent Events stream. */
  async stream(options?: { lastEventId?: string; signal?: AbortSignal }) {
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    if (options?.lastEventId) {
      headers['Last-Event-ID'] = options.lastEventId
    }

    const resp = await this.c.GET('/v1/{workspace_id}/events/stream', {
      params: { path: { workspace_id: this.workspaceId } },
      headers,
      parseAs: 'stream',
      ...(options?.signal && { signal: options.signal }),
    })

    return parseSseStream<components['schemas']['WorkspaceSSEEvent']>(resp.response)
  }
}
