import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'

export class ServiceResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  /**
   * Get services
   * @returns The services
   */
  async getServices() {
    return extractData(
      this.c.GET('/v1/{organization}/service/', {
        params: { path: { organization: this.orgId } },
      })
    )
  }
}
