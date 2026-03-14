import { ConfigurationError } from './core/errors'
import { createAmigoFetch } from './core/openapi-client'
import { OrganizationResource } from './resources/organization'
import { ConversationResource } from './resources/conversation'
import { ServiceResource } from './resources/services'
import { UserResource } from './resources/user'
import type { RetryOptions } from './core/retry'
import type { UserId, OrgId } from './core/branded-types'

export interface AmigoSdkConfig {
  /** API key from Amigo dashboard */
  apiKey: string
  /** API-key ID from Amigo dashboard */
  apiKeyId: string
  /** User ID on whose behalf the request is made */
  userId: UserId
  /** The Organization ID */
  orgId: OrgId
  /** Base URL of the Amigo API */
  baseUrl?: string
  /** Retry configuration for HTTP requests */
  retry?: RetryOptions
}

const defaultBaseUrl = 'https://api.amigo.ai'

/**
 * Main client for the Amigo API.
 * Provides access to all API resources (organizations, conversations, services, users).
 */
export class AmigoClient {
  readonly organizations: OrganizationResource
  readonly conversations: ConversationResource
  readonly services: ServiceResource
  readonly users: UserResource
  readonly config: AmigoSdkConfig

  /** Create a new Amigo client with the given configuration. */
  constructor(config: AmigoSdkConfig) {
    this.config = validateConfig(config)

    const api = createAmigoFetch(this.config)
    this.organizations = new OrganizationResource(api, this.config.orgId)
    this.conversations = new ConversationResource(api, this.config.orgId)
    this.services = new ServiceResource(api, this.config.orgId)
    this.users = new UserResource(api, this.config.orgId)
  }
}

function validateConfig(config: AmigoSdkConfig) {
  if (!config.apiKey) {
    throw new ConfigurationError('API key is required', 'apiKey')
  }
  if (!config.apiKeyId) {
    throw new ConfigurationError('API key ID is required', 'apiKeyId')
  }
  if (!config.userId) {
    throw new ConfigurationError('User ID is required', 'userId')
  }
  if (!config.orgId) {
    throw new ConfigurationError('Organization ID is required', 'orgId')
  }
  if (!config.baseUrl) {
    config.baseUrl = defaultBaseUrl
  }
  return config
}

// Export all errors as a namespace to avoid polluting the main import space
export * as errors from './core/errors'

// Re-export useful types for consumers
export type { components, operations, paths } from './generated/api-types'

// Export branded types and helper functions
export type {
  ConversationId,
  MessageId,
  UserId,
  OrgId,
  InteractionId,
  ServiceId,
} from './core/branded-types'
export {
  conversationId,
  messageId,
  userId,
  orgId,
  interactionId,
  serviceId,
} from './core/branded-types'
