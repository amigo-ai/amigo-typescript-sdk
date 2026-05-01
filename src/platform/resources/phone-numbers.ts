import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, PhoneNumberId } from '../core/branded-types'

/** Resource for managing phone numbers. */
export class PhoneNumberResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List phone numbers in the workspace. */
  async list(options?: { query?: operations['list-phone-numbers']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/phone-numbers', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get a phone number by ID. */
  async get(options: { phoneNumberId: PhoneNumberId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/phone-numbers/{phone_number_id}', {
        params: {
          path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
        },
      })
    )
  }

  /** Create a phone number. */
  async create(options: { body: components['schemas']['CreatePhoneNumberRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/phone-numbers', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update a phone number. */
  async update(options: {
    phoneNumberId: PhoneNumberId
    body: components['schemas']['UpdatePhoneNumberRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/phone-numbers/{phone_number_id}', {
        params: {
          path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
        },
        body: options.body,
      })
    )
  }

  /** Delete a phone number. */
  async delete(options: { phoneNumberId: PhoneNumberId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/phone-numbers/{phone_number_id}', {
      params: {
        path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
      },
    })
    return undefined
  }

  /** Set call forwarding for a phone number. */
  async setForwarding(options: {
    phoneNumberId: PhoneNumberId
    body: components['schemas']['ForwardingConfigRequest']
  }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/phone-numbers/{phone_number_id}/forwarding', {
        params: {
          path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
        },
        body: options.body,
      })
    )
  }

  /** Clear call forwarding for a phone number. */
  async clearForwarding(options: { phoneNumberId: PhoneNumberId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/phone-numbers/{phone_number_id}/forwarding', {
      params: {
        path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
      },
    })
    return undefined
  }

  /** Get the Twilio sub-account for the workspace. */
  async getTwilioSubAccount() {
    return extractData(
      this.c.GET('/v1/{workspace_id}/twilio/sub-account', {
        params: { path: { workspace_id: this.workspaceId } },
      })
    )
  }

  /** Provision a Twilio sub-account for the workspace. */
  async provisionTwilioSubAccount() {
    return extractData(
      this.c.POST('/v1/{workspace_id}/twilio/sub-account', {
        params: { path: { workspace_id: this.workspaceId } },
      })
    )
  }

  /** Search available phone numbers for purchase. */
  async searchAvailable(options?: {
    query?: operations['search-available-phone-numbers']['parameters']['query']
  }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/twilio/phone-numbers/available', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Purchase a phone number. */
  async purchase(options: { body: components['schemas']['PurchasePhoneNumberRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/twilio/phone-numbers/purchase', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Release a purchased phone number. */
  async release(options: { phoneNumberId: PhoneNumberId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/twilio/phone-numbers/{phone_number_id}/release', {
      params: {
        path: { workspace_id: this.workspaceId, phone_number_id: options.phoneNumberId },
      },
    })
    return undefined
  }

  /** Bind a channel-manager phone number to a workspace/service. */
  async bind(options: { body: components['schemas']['BindChannelPhoneRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/phone-numbers/bind', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }
}
