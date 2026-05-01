import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, PlatformAgentId } from '../core/branded-types'

/** Resource for managing platform agents. */
export class PlatformAgentResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List agents in the workspace. */
  async list(options?: { query?: operations['list-agents']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/agents', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get an agent by ID. */
  async get(options: { agentId: PlatformAgentId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/agents/{agent_id}', {
        params: { path: { workspace_id: this.workspaceId, agent_id: options.agentId } },
      })
    )
  }

  /** Create a new agent. */
  async create(options: { body: components['schemas']['CreateAgentRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/agents', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update an agent. */
  async update(options: {
    agentId: PlatformAgentId
    body: components['schemas']['UpdateAgentRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/agents/{agent_id}', {
        params: { path: { workspace_id: this.workspaceId, agent_id: options.agentId } },
        body: options.body,
      })
    )
  }

  /** Delete an agent. */
  async delete(options: { agentId: PlatformAgentId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/agents/{agent_id}', {
      params: { path: { workspace_id: this.workspaceId, agent_id: options.agentId } },
    })
    return undefined
  }

  /** List agent versions. */
  async listVersions(options: {
    agentId: PlatformAgentId
    query?: operations['list-agent-versions']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/agents/{agent_id}/versions', {
        params: {
          path: { workspace_id: this.workspaceId, agent_id: options.agentId },
          query: options.query,
        },
      })
    )
  }

  /** Get a specific agent version, or pass `"latest"` for the most recent version. */
  async getVersion(options: { agentId: PlatformAgentId; version: number | 'latest' }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/agents/{agent_id}/versions/{version}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            agent_id: options.agentId,
            version: options.version,
          },
        },
      })
    )
  }

  /** Create a new agent version. */
  async createVersion(options: {
    agentId: PlatformAgentId
    body: components['schemas']['CreateAgentVersionRequest']
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/agents/{agent_id}/versions', {
        params: { path: { workspace_id: this.workspaceId, agent_id: options.agentId } },
        body: options.body,
      })
    )
  }
}
