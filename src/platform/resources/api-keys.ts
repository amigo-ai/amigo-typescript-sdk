import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, PlatformApiKeyId } from '../core/branded-types'

/** Resource for managing API keys. */
export class PlatformApiKeyResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** Get information about the currently authenticated API key. */
  async me() {
    return extractData(this.c.GET('/v1/auth/me'))
  }

  /** List API keys in the workspace. */
  async list(options?: { query?: operations['list-api-keys']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/api-keys', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Create a new API key. */
  async create(options: { body: components['schemas']['CreateApiKeyRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/api-keys', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Delete an API key. */
  async delete(options: { keyId: PlatformApiKeyId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/api-keys/{key_id}', {
      params: { path: { workspace_id: this.workspaceId, key_id: options.keyId } },
    })
    return undefined
  }

  /** Rotate an API key and return the replacement secret. */
  async rotate(options: {
    keyId: PlatformApiKeyId
    body: components['schemas']['RotateApiKeyRequest']
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/api-keys/{key_id}/rotate', {
        params: { path: { workspace_id: this.workspaceId, key_id: options.keyId } },
        body: options.body,
      })
    )
  }
}
