import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { operations } from '../generated/api-types'

export class OrganizationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
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
}
