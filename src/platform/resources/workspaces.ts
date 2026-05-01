import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId } from '../core/branded-types'

/** Resource for managing workspaces. */
export class WorkspaceResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId?: WorkspaceId
  ) {}

  private requireWorkspaceId(): WorkspaceId {
    if (!this.workspaceId) {
      throw new Error('workspaceId is required for this operation')
    }
    return this.workspaceId
  }

  /** List workspaces accessible to this API key. */
  async list(options?: { query?: operations['list-workspaces']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/workspaces', {
        params: { query: options?.query },
      })
    )
  }

  /** Get a workspace by ID. */
  async get(options?: { workspaceId?: WorkspaceId }) {
    return extractData(
      this.c.GET('/v1/workspaces/{workspace_id}', {
        params: { path: { workspace_id: options?.workspaceId ?? this.requireWorkspaceId() } },
      })
    )
  }

  /** Create a new workspace. */
  async create(options: { body: components['schemas']['CreateWorkspaceRequest'] }) {
    return extractData(
      this.c.POST('/v1/workspaces', {
        body: options.body,
      })
    )
  }

  /** Create a self-service workspace. */
  async createSelfService(options: { body: components['schemas']['CreateWorkspaceRequest'] }) {
    return extractData(
      this.c.POST('/v1/workspaces/self-service', {
        body: options.body,
      })
    )
  }

  /** Update a workspace. */
  async update(options: {
    workspaceId?: WorkspaceId
    body: components['schemas']['UpdateWorkspaceRequest']
  }) {
    return extractData(
      this.c.PATCH('/v1/workspaces/{workspace_id}', {
        params: { path: { workspace_id: options.workspaceId ?? this.requireWorkspaceId() } },
        body: options.body,
      })
    )
  }

  /** Provision workspace resources (idempotent). */
  async provision(options?: { workspaceId?: WorkspaceId }) {
    return extractData(
      this.c.POST('/v1/workspaces/{workspace_id}/provision', {
        params: { path: { workspace_id: options?.workspaceId ?? this.requireWorkspaceId() } },
      })
    )
  }

  /** Archive a workspace. */
  async archive(options: {
    workspaceId?: WorkspaceId
    body: components['schemas']['ArchiveWorkspaceRequest']
  }) {
    return extractData(
      this.c.POST('/v1/workspaces/{workspace_id}/archive', {
        params: { path: { workspace_id: options.workspaceId ?? this.requireWorkspaceId() } },
        body: options.body,
      })
    )
  }

  /** Check whether a workspace can be converted between environments. */
  async checkEnvironmentConversion(options?: {
    workspaceId?: WorkspaceId
    query?: operations['check-environment-conversion']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/workspaces/{workspace_id}/environment-check', {
        params: {
          path: { workspace_id: options?.workspaceId ?? this.requireWorkspaceId() },
          query: options?.query,
        },
      })
    )
  }

  /** Convert a workspace environment. */
  async convertEnvironment(options: {
    workspaceId?: WorkspaceId
    body: components['schemas']['ConvertEnvironmentRequest']
  }) {
    return extractData(
      this.c.POST('/v1/workspaces/{workspace_id}/convert-environment', {
        params: { path: { workspace_id: options.workspaceId ?? this.requireWorkspaceId() } },
        body: options.body,
      })
    )
  }

  /** Get voice settings for a workspace. */
  async getVoiceSettings(options?: { workspaceId?: WorkspaceId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/settings/voice', {
        params: { path: { workspace_id: options?.workspaceId ?? this.requireWorkspaceId() } },
      })
    )
  }

  /** Update voice settings for a workspace. */
  async updateVoiceSettings(options: {
    workspaceId?: WorkspaceId
    body: components['schemas']['VoiceSettingsRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/settings/voice', {
        params: { path: { workspace_id: options.workspaceId ?? this.requireWorkspaceId() } },
        body: options.body,
      })
    )
  }

  /** Get test caller numbers for a workspace. */
  async getTestCallerNumbers(options?: { workspaceId?: WorkspaceId }) {
    return extractData(
      this.c.GET('/v1/workspaces/{workspace_id}/test-caller-numbers', {
        params: { path: { workspace_id: options?.workspaceId ?? this.requireWorkspaceId() } },
      })
    )
  }

  /** Update test caller numbers for a workspace. */
  async updateTestCallerNumbers(options: {
    workspaceId?: WorkspaceId
    body: components['schemas']['TestCallerNumbersRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/workspaces/{workspace_id}/test-caller-numbers', {
        params: { path: { workspace_id: options.workspaceId ?? this.requireWorkspaceId() } },
        body: options.body,
      })
    )
  }
}
