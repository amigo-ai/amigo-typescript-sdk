import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { ContextGraphId, WorkspaceId } from '../core/branded-types'

/** Resource for managing platform context graphs. */
export class ContextGraphResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List context graphs in the workspace. */
  async list(options?: { query?: operations['list-context_graphs']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/context-graphs', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get a context graph by ID. */
  async get(options: { contextGraphId: ContextGraphId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/context-graphs/{context_graph_id}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            context_graph_id: options.contextGraphId,
          },
        },
      })
    )
  }

  /** Create a new context graph. */
  async create(options: { body: components['schemas']['CreateContextGraphRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/context-graphs', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update a context graph. */
  async update(options: {
    contextGraphId: ContextGraphId
    body: components['schemas']['UpdateContextGraphRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/context-graphs/{context_graph_id}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            context_graph_id: options.contextGraphId,
          },
        },
        body: options.body,
      })
    )
  }

  /** Delete a context graph. */
  async delete(options: { contextGraphId: ContextGraphId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/context-graphs/{context_graph_id}', {
      params: {
        path: {
          workspace_id: this.workspaceId,
          context_graph_id: options.contextGraphId,
        },
      },
    })
    return undefined
  }

  /** List context graph versions. */
  async listVersions(options: {
    contextGraphId: ContextGraphId
    query?: operations['list-context_graph-versions']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/context-graphs/{context_graph_id}/versions', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            context_graph_id: options.contextGraphId,
          },
          query: options.query,
        },
      })
    )
  }

  /** Get a specific context graph version. */
  async getVersion(options: { contextGraphId: ContextGraphId; version: number | 'latest' }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/context-graphs/{context_graph_id}/versions/{version}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            context_graph_id: options.contextGraphId,
            version: options.version,
          },
        },
      })
    )
  }

  /** Create a new context graph version. */
  async createVersion(options: {
    contextGraphId: ContextGraphId
    body: components['schemas']['CreateContextGraphVersionRequest']
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/context-graphs/{context_graph_id}/versions', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            context_graph_id: options.contextGraphId,
          },
        },
        body: options.body,
      })
    )
  }
}
