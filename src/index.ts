import { createAmigoFetch } from './core/openapi-client'
import { OrganizationResource } from './resources/organization'

export interface AmigoSdkConfig {
  apiKey: string
  apiKeyId: string
  userId: string
  baseUrl?: string
}

export class AmigoClient {
  readonly organizations: OrganizationResource

  constructor(config: AmigoSdkConfig) {
    const api = createAmigoFetch(config)
    this.organizations = new OrganizationResource(api)
  }
}
