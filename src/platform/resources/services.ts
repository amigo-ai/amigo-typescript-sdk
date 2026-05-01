import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, PlatformServiceId } from '../core/branded-types'

/** Resource for managing services. */
export class PlatformServiceResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List services in the workspace. */
  async list(options?: { query?: operations['list-services']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/services', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get a service by ID. */
  async get(options: { serviceId: PlatformServiceId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/services/{service_id}', {
        params: { path: { workspace_id: this.workspaceId, service_id: options.serviceId } },
      })
    )
  }

  /** Create a new service. */
  async create(options: { body: components['schemas']['CreateServiceRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/services', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update a service. */
  async update(options: {
    serviceId: PlatformServiceId
    body: components['schemas']['UpdateServiceRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/services/{service_id}', {
        params: { path: { workspace_id: this.workspaceId, service_id: options.serviceId } },
        body: options.body,
      })
    )
  }

  /** Delete a service. */
  async delete(options: { serviceId: PlatformServiceId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/services/{service_id}', {
      params: { path: { workspace_id: this.workspaceId, service_id: options.serviceId } },
    })
    return undefined
  }

  /** Upsert a version set for a service. */
  async upsertVersionSet(options: {
    serviceId: PlatformServiceId
    name: string
    body: components['schemas']['UpsertVersionSetRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/services/{service_id}/version-sets/{name}', {
        params: {
          path: {
            workspace_id: this.workspaceId,
            service_id: options.serviceId,
            name: options.name,
          },
        },
        body: options.body,
      })
    )
  }

  /** Resolve all tools available to a service. */
  async resolveTools(options: {
    serviceId: PlatformServiceId
    query?: operations['resolve-service-tools']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/services/{service_id}/tools/resolve', {
        params: {
          path: { workspace_id: this.workspaceId, service_id: options.serviceId },
          query: options.query,
        },
      })
    )
  }

  /** Run one voice turn through a service. */
  async voiceTurn(options: {
    serviceId: PlatformServiceId
    body: components['schemas']['Body_voice-turn'] | FormData
  }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/services/{service_id}/voice-turn', {
        params: { path: { workspace_id: this.workspaceId, service_id: options.serviceId } },
        body: options.body as components['schemas']['Body_voice-turn'],
      })
    )
  }
}
