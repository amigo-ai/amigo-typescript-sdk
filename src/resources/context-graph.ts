import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'
import type { OrgId } from '../core/branded-types'

/** Branded type for Context Graph (HSM) IDs. */
type ContextGraphId = string

/** Resource for managing context graphs (service hierarchical state machines). */
export class ContextGraphResource {
  constructor(
    private c: AmigoFetch,
    private orgId: OrgId
  ) {}

  /** Create a new context graph. */
  async createContextGraph(options: {
    body: components['schemas']['organization__create_service_hierarchical_state_machine__Request']
    headers?: operations['create-service-hierarchical-state-machine']['parameters']['header']
  }) {
    const { body, headers } = options
    return extractData(
      this.c.POST('/v1/{organization}/organization/service_hierarchical_state_machine', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  /** List context graphs for the organization. */
  async getContextGraphs(options?: {
    query?: operations['get-service-hierarchical-state-machines']['parameters']['query']
    headers?: operations['get-service-hierarchical-state-machines']['parameters']['header']
  }) {
    const { query, headers } = options ?? {}
    return extractData(
      this.c.GET('/v1/{organization}/organization/service_hierarchical_state_machine', {
        params: { path: { organization: this.orgId }, query },
        headers,
      })
    )
  }

  /** Create a new version of a context graph. */
  async createContextGraphVersion(options: {
    contextGraphId: ContextGraphId
    body: components['schemas']['organization__create_service_hierarchical_state_machine_version__Request']
    query?: operations['create-service-hierarchical-state-machine-version']['parameters']['query']
    headers?: operations['create-service-hierarchical-state-machine-version']['parameters']['header']
  }) {
    const { contextGraphId, body, query, headers } = options
    return extractData(
      this.c.POST(
        '/v1/{organization}/organization/service_hierarchical_state_machine/{service_hierarchical_state_machine_id}/',
        {
          params: {
            path: {
              organization: this.orgId,
              service_hierarchical_state_machine_id: contextGraphId,
            },
            query,
          },
          body,
          headers,
        }
      )
    )
  }

  /** Delete a context graph. */
  async deleteContextGraph(options: {
    contextGraphId: ContextGraphId
    headers?: operations['delete-service-hierarchical-state-machine']['parameters']['header']
  }): Promise<void> {
    const { contextGraphId, headers } = options
    await this.c.DELETE(
      '/v1/{organization}/organization/service_hierarchical_state_machine/{state_machine_id}/',
      {
        params: {
          path: { organization: this.orgId, state_machine_id: contextGraphId },
        },
        headers,
      }
    )
    return undefined
  }

  /** Get versions of a context graph. */
  async getContextGraphVersions(options: {
    contextGraphId: ContextGraphId
    query?: operations['get-service-hierarchical-state-machine-versions']['parameters']['query']
    headers?: operations['get-service-hierarchical-state-machine-versions']['parameters']['header']
  }) {
    const { contextGraphId, query, headers } = options
    return extractData(
      this.c.GET(
        '/v1/{organization}/organization/service_hierarchical_state_machine/{service_hierarchical_state_machine_id}/version',
        {
          params: {
            path: {
              organization: this.orgId,
              service_hierarchical_state_machine_id: contextGraphId,
            },
            query,
          },
          headers,
        }
      )
    )
  }

  // --- Convenience aliases ---

  /** Alias for getContextGraphs. */
  async list(options?: Parameters<ContextGraphResource['getContextGraphs']>[0]) {
    return this.getContextGraphs(options)
  }

  /** Alias for createContextGraph. */
  async create(options: Parameters<ContextGraphResource['createContextGraph']>[0]) {
    return this.createContextGraph(options)
  }

  /** Alias for deleteContextGraph. */
  async delete(options: Parameters<ContextGraphResource['deleteContextGraph']>[0]) {
    return this.deleteContextGraph(options)
  }
}
