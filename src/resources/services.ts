import { AmigoFetch } from '../core/openapi-client'

export class ServiceResource {
  constructor(private c: AmigoFetch) {}

  async getServices(orgId: string) {
    return this.c.GET('/v1/{organization}/service/', {
      params: { path: { organization: orgId } },
    })
  }
}
