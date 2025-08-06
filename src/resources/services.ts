import { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'

export class ServiceResource {
  constructor(private c: AmigoFetch) {}

  async getServices(orgId: string) {
    return extractData(
      this.c.GET('/v1/{organization}/service/', {
        params: { path: { organization: orgId } },
      })
    )
  }
}
