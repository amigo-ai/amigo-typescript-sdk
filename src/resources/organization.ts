import { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'

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
