import { createAmigoFetch } from './core/openapi-client'
import { OrganizationResource } from './resources/organization'
import { ServiceResource } from './resources/services'

export interface AmigoSdkConfig {
  /** API key from Amigo dashboard */
  apiKey: string
  /** API-key ID from Amigo dashboard */
  apiKeyId: string
  /** User ID on whose behalf the request is made */
  userId: string
  /** The Organization ID */
  orgId: string
  /** Base URL of the Amigo API */
  baseUrl?: string
}

export class AmigoClient {
  readonly organizations: OrganizationResource
  readonly services: ServiceResource

  constructor(config: AmigoSdkConfig) {
    const api = createAmigoFetch(config)
    this.organizations = new OrganizationResource(api)
    this.services = new ServiceResource(api)
  }
}

// Export all errors as a namespace to avoid polluting the main import space
export * as errors from './core/errors'
