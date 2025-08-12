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
   * Create an agent
   * @param agentName - The name of the agent
   * @param headers - The headers
   * @returns The agent details
   */
  async createAgent(
    body: components['schemas']['src__app__endpoints__organization__create_agent__Request'],
    headers?: operations['create-agent']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/organization/agent', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  /**
   * Create an agent version
   * @param agentId - The ID of the agent
   * @param body - The body of the request
   * @param queryParams - The query parameters
   * @param headers - The headers
   * @returns The agent version details
   */
  async createAgentVersion(
    agentId: string,
    body: components['schemas']['src__app__endpoints__organization__create_agent_version__Request'],
    queryParams?: operations['create-agent-version']['parameters']['query'],
    headers?: operations['create-agent-version']['parameters']['header']
  ) {
    return extractData(
      this.c.POST('/v1/{organization}/organization/agent/{agent_id}/', {
        params: { path: { organization: this.orgId, agent_id: agentId } },
        body,
        query: queryParams,
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
        params: { path: { organization: this.orgId } },
        query: queryParams,
        headers,
      })
    )
  }

  /**
   * Delete an agent
   * @param agentId - The ID of the agent
   * @param headers - The headers
   * @returns The agent details
   */
  async deleteAgent(
    agentId: string,
    headers?: operations['delete-agent']['parameters']['header']
  ): Promise<void> {
    // DELETE endpoints returns no content (e.g., 204 No Content).
    // Our middleware already throws on non-2xx responses, so simply await the call.
    await this.c.DELETE('/v1/{organization}/organization/agent/{agent_id}/', {
      params: { path: { organization: this.orgId, agent_id: agentId } },
      headers,
    })
    return
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
        params: { path: { organization: this.orgId, agent_id: agentId } },
        query: queryParams,
        headers,
      })
    )
  }
}
