import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, IntegrationId } from '../core/branded-types'

/** Resource for managing integrations. */
export class IntegrationResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List integrations in the workspace. */
  async list(options?: { query?: operations['list-integrations']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/integrations', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get an integration by ID. */
  async get(options: { integrationId: IntegrationId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/integrations/{integration_id}', {
        params: {
          path: { workspace_id: this.workspaceId, integration_id: options.integrationId },
        },
      })
    )
  }

  /** Create a new integration. */
  async create(options: { body: components['schemas']['CreateIntegrationRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/integrations', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update an integration. */
  async update(options: {
    integrationId: IntegrationId
    body: components['schemas']['UpdateIntegrationRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/integrations/{integration_id}', {
        params: {
          path: { workspace_id: this.workspaceId, integration_id: options.integrationId },
        },
        body: options.body,
      })
    )
  }

  /** Delete an integration. */
  async delete(options: { integrationId: IntegrationId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/integrations/{integration_id}', {
      params: {
        path: { workspace_id: this.workspaceId, integration_id: options.integrationId },
      },
    })
    return undefined
  }

  /** Test an integration endpoint. */
  async testEndpoint(options: {
    integrationId: IntegrationId
    endpointName: string
    body: components['schemas']['TestEndpointRequest']
  }) {
    return extractData(
      this.c.POST(
        '/v1/{workspace_id}/integrations/{integration_id}/endpoints/{endpoint_name}/test',
        {
          params: {
            path: {
              workspace_id: this.workspaceId,
              integration_id: options.integrationId,
              endpoint_name: options.endpointName,
            },
          },
          body: options.body,
        }
      )
    )
  }

  /** Check integration health for the workspace. */
  async healthCheck() {
    return extractData(
      this.c.GET('/v1/{workspace_id}/integrations/health-check', {
        params: { path: { workspace_id: this.workspaceId } },
      })
    )
  }
}
