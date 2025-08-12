import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'

export class OrganizationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  /**
   * Get organization details
   * @returns The organization details
   */
  async getOrganization() {
    return extractData(
      this.c.GET('/v1/{organization}/organization/', {
        params: { path: { organization: this.orgId } },
      })
    )
  }

  /**
   * Create an agent
   * @param agentName - The name of the agent
   * @returns The agent details
   */
  async createAgent(agentName: string) {
    return extractData(
      this.c.POST('/v1/{organization}/organization/agent', {
        params: { path: { organization: this.orgId } },
        body: { agent_name: agentName },
      })
    )
  }
}
