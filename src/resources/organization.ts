import { AmigoFetch, extractData } from '../core/openapi-client'

export class OrganizationResource {
  constructor(private c: AmigoFetch) {}

  async getOrganization(orgId: string) {
    return extractData(
      this.c.GET('/v1/{organization}/organization/', {
        params: { path: { organization: orgId } },
      })
    )
  }
}
