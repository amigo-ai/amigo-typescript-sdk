import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'
import type { OrgId, UserId } from '../core/branded-types'

/** Resource for managing users in the organization. */
export class UserResource {
  constructor(
    private c: AmigoFetch,
    private orgId: OrgId
  ) {}

  /** List users in the organization. */
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

  /** Create (invite) a new user to the organization. */
  async createUser(
    body: components['schemas']['user__create_invited_user__Request'],
    headers?: operations['create-invited-user']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/user/', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  /** Delete a user by ID. */
  async deleteUser(
    userId: UserId,
    headers?: operations['delete-user']['parameters']['header']
  ): Promise<void> {
    await this.c.DELETE('/v1/{organization}/user/{requested_user_id}', {
      params: { path: { organization: this.orgId, requested_user_id: userId } },
      headers,
    })
    return undefined
  }

  /** Update user information. */
  async updateUser(options: {
    userId: UserId
    body: components['schemas']['user__update_user_info__Request']
    headers?: operations['update-user-info']['parameters']['header']
  }): Promise<void> {
    const { userId, body, headers } = options
    await this.c.POST('/v1/{organization}/user/{requested_user_id}', {
      params: { path: { organization: this.orgId, requested_user_id: userId } },
      body,
      headers,
    })
    return undefined
  }

  /** Get the user model for a user. */
  async getUserModel(
    userId: UserId,
    headers?: operations['get-user-model']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/user/{user_id}/user_model', {
        params: { path: { organization: this.orgId, user_id: userId } },
        headers,
      })
    )
  }

  // --- Convenience aliases ---

  /** Alias for getUsers. */
  async list(
    queryParams?: operations['get-users']['parameters']['query'],
    headers?: operations['get-users']['parameters']['header']
  ) {
    return this.getUsers(queryParams, headers)
  }

  /** Alias for createUser. */
  async create(
    body: components['schemas']['user__create_invited_user__Request'],
    headers?: operations['create-invited-user']['parameters']['header']
  ) {
    return this.createUser(body, headers)
  }

  /** Alias for getUserModel. */
  async getModel(userId: UserId, headers?: operations['get-user-model']['parameters']['header']) {
    return this.getUserModel(userId, headers)
  }

  /** Alias for deleteUser. */
  async delete(
    userId: UserId,
    headers?: operations['delete-user']['parameters']['header']
  ): Promise<void> {
    return this.deleteUser(userId, headers)
  }

  /** Alias for updateUser. */
  async update(options: Parameters<UserResource['updateUser']>[0]): Promise<void> {
    return this.updateUser(options)
  }
}
