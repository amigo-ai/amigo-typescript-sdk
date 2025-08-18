import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'

export class OrganizationResource {
  constructor(
    private c: AmigoFetch,
    private orgId: string
  ) {}

  /**
   * Get organization details
   * @param headers - The headers
   * @returns The organization details
   */
  async getOrganization(headers?: operations['get-organization']['parameters']['header']) {
    return extractData(
      this.c.GET('/v1/{organization}/organization/', {
        params: { path: { organization: this.orgId } },
        headers,
      })
    )
  }

  /**
   * Get agents
   * @param queryParams - The query parameters
   * @param headers - The headers
   * @returns The agents
   */
  async getAgents(
    queryParams?: operations['get-agents']['parameters']['query'],
    headers?: operations['get-agents']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/organization/agent', {
        params: { path: { organization: this.orgId }, query: queryParams },
        headers,
      })
    )
  }

  /**
   * Get agent versions
   * @param agentId - The ID of the agent
   * @param queryParams - The query parameters
   * @param headers - The headers
   * @returns The agent versions
   */
  async getAgentVersions(
    agentId: string,
    queryParams?: operations['get-agent-versions']['parameters']['query'],
    headers?: operations['get-agent-versions']['parameters']['header']
  ) {
    return extractData(
      this.c.GET('/v1/{organization}/organization/agent/{agent_id}/version', {
        params: { path: { organization: this.orgId, agent_id: agentId }, query: queryParams },
        headers,
      })
    )
  }
}
