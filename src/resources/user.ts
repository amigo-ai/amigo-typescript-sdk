import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'

export class UserResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  async getUsers(
    queryParams?: operations['get-users']['parameters']['query'],
    headers?: operations['get-users']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/user/', {
        params: { path: { organization: this.orgId }, query: queryParams },
        headers,
      })
    )
  }

  async createUser(
    body: components['schemas']['user__create_invited_user__Request'],
    headers?: operations['create-invited-user']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/user/invite', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  async deleteUser(userId: string, headers?: operations['delete-user']['parameters']['header']) {
    // DELETE endpoints returns no content (e.g., 204 No Content).
    // Our middleware already throws on non-2xx responses, so simply await the call.
    await this.c.DELETE('/v1/{organization}/user/{requested_user_id}', {
      params: { path: { organization: this.orgId, requested_user_id: userId } },
      headers,
    })
    return
  }

  async updateUser(
    userId: string,
    body: components['schemas']['user__update_user_info__Request'],
    headers?: operations['update-user-info']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/user/{requested_user_id}/user', {
        params: { path: { organization: this.orgId, requested_user_id: userId } },
        body,
        headers,
      })
    )
  }
}
