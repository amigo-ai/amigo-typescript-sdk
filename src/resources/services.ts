import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'
import type { OrgId, ServiceId } from '../core/branded-types'

/** Resource for managing services. */
export class ServiceResource {
  constructor(
    private c: AmigoFetch,
    private orgId: OrgId
  ) {}

  /** List services for the organization. */
  async getServices(
    queryParams?: operations['get-services']['parameters']['query'],
    headers?: operations['get-services']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/service/', {
        params: { path: { organization: this.orgId }, query: queryParams },
        headers,
      })
    )
  }

  /** Create a new service. */
  async createService(options: {
    body: components['schemas']['service__create_service__Request']
    headers?: operations['create-service']['parameters']['header']
  }) {
    const { body, headers } = options
    return extractData(
      this.c.POST('/v1/{organization}/service/', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  /** Update a service. */
  async updateService(options: {
    serviceId: ServiceId
    body: components['schemas']['service__update_service__Request']
    headers?: operations['update-service']['parameters']['header']
  }) {
    const { serviceId, body, headers } = options
    return extractData(
      this.c.POST('/v1/{organization}/service/{service_id}/', {
        params: { path: { organization: this.orgId, service_id: serviceId } },
        body,
        headers,
      })
    )
  }

  /** Upsert a service version set. */
  async upsertVersionSet(options: {
    serviceId: ServiceId
    versionSetName: string
    body: components['schemas']['service__upsert_service_version_set__Request']
    headers?: operations['upsert-service-version-set']['parameters']['header']
  }) {
    const { serviceId, versionSetName, body, headers } = options
    return extractData(
      this.c.PUT('/v1/{organization}/service/{service_id}/version_sets/{version_set_name}/', {
        params: {
          path: {
            organization: this.orgId,
            service_id: serviceId,
            version_set_name: versionSetName,
          },
        },
        body,
        headers,
      })
    )
  }

  /** Delete a service version set. */
  async deleteVersionSet(options: {
    serviceId: ServiceId
    versionSetName: string
    headers?: operations['delete-service-version-set']['parameters']['header']
  }): Promise<void> {
    const { serviceId, versionSetName, headers } = options
    await this.c.DELETE(
      '/v1/{organization}/service/{service_id}/version_sets/{version_set_name}/',
      {
        params: {
          path: {
            organization: this.orgId,
            service_id: serviceId,
            version_set_name: versionSetName,
          },
        },
        headers,
      }
    )
    return undefined
  }

  // --- Convenience aliases ---

  /** Alias for getServices. */
  async list(
    queryParams?: operations['get-services']['parameters']['query'],
    headers?: operations['get-services']['parameters']['header']
  ) {
    return this.getServices(queryParams, headers)
  }

  /** Alias for createService. */
  async create(options: Parameters<ServiceResource['createService']>[0]) {
    return this.createService(options)
  }
}
