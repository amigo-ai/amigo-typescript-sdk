import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { operations } from '../generated/api-types'
import type { OrgId } from '../core/branded-types'

/** Resource for retrieving organization details. */
export class OrganizationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: OrgId
  ) {}

  /**
   * Get organization details
   * @param headers - The headers
   * @returns The organization details
   */
  async getOrganization(headers?: operations['get-organization']['parameters']['header']) {
    return extractData(
      this.c.GET('/v1/{organization}/organization/', {
        params: { path: { organization: this.orgId } },
        headers,
      })
    )
  }

  /** Alias for getOrganization. */
  async get(headers?: operations['get-organization']['parameters']['header']) {
    return this.getOrganization(headers)
  }
}
