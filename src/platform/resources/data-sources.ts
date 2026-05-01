import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, DataSourceId } from '../core/branded-types'

/** Resource for managing data sources. */
export class DataSourceResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List data sources in the workspace. */
  async list(options?: { query?: operations['list-data-sources']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/data-sources', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get a data source by ID. */
  async get(options: { dataSourceId: DataSourceId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/data-sources/{data_source_id}', {
        params: {
          path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
        },
      })
    )
  }

  /** Create a new data source. */
  async create(options: { body: components['schemas']['CreateDataSourceRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/data-sources', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update a data source. */
  async update(options: {
    dataSourceId: DataSourceId
    body: components['schemas']['UpdateDataSourceRequest']
  }) {
    return extractData(
      this.c.PATCH('/v1/{workspace_id}/data-sources/{data_source_id}', {
        params: {
          path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
        },
        body: options.body,
      })
    )
  }

  /** Get data source status. */
  async getStatus(options: { dataSourceId: DataSourceId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/data-sources/{data_source_id}/status', {
        params: {
          path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
        },
      })
    )
  }

  /** Get data source sync history. */
  async getSyncHistory(options: {
    dataSourceId: DataSourceId
    query?: operations['data-source-sync-history']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/data-sources/{data_source_id}/sync-history', {
        params: {
          path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
          query: options.query,
        },
      })
    )
  }

  /** Trigger a data source sync. */
  async triggerSync(options: { dataSourceId: DataSourceId }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/data-sources/{data_source_id}/sync', {
        params: {
          path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
        },
      })
    )
  }

  /** Delete a data source. */
  async delete(options: { dataSourceId: DataSourceId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/data-sources/{data_source_id}', {
      params: {
        path: { workspace_id: this.workspaceId, data_source_id: options.dataSourceId },
      },
    })
    return undefined
  }
}
