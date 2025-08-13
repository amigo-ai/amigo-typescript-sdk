import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { operations } from '../generated/api-types'

export class ServiceResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  /**
   * Get services
   * @param headers - The headers
   * @returns The services
   */
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
}
