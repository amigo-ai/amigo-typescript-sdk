import type { AmigoFetch } from '../core/openapi-client'
import { extractData } from '../core/utils'
import type { components, operations } from '../generated/api-types'
import type { OrgId, AgentId } from '../core/branded-types'

/** Resource for managing agents in the organization. */
export class AgentResource {
  constructor(
    private c: AmigoFetch,
    private orgId: OrgId
  ) {}

  /** Create a new agent for the organization. */
  async createAgent(options: {
    body: components['schemas']['organization__create_agent__Request']
    headers?: operations['create-agent']['parameters']['header']
  }) {
    const { body, headers } = options
    return extractData(
      this.c.POST('/v1/{organization}/organization/agent', {
        params: { path: { organization: this.orgId } },
        body,
        headers,
      })
    )
  }

  /** List agents for the organization. */
  async getAgents(options?: {
    query?: operations['get-agents']['parameters']['query']
    headers?: operations['get-agents']['parameters']['header']
  }) {
    const { query, headers } = options ?? {}
    return extractData(
      this.c.GET('/v1/{organization}/organization/agent', {
        params: { path: { organization: this.orgId }, query },
        headers,
      })
    )
  }

  /** Delete an agent by ID. */
  async deleteAgent(options: {
    agentId: AgentId
    headers?: operations['delete-agent']['parameters']['header']
  }): Promise<void> {
    const { agentId, headers } = options
    await this.c.DELETE('/v1/{organization}/organization/agent/{agent_id}/', {
      params: { path: { organization: this.orgId, agent_id: agentId } },
      headers,
    })
    return undefined
  }

  /** Create a new version of an agent. */
  async createAgentVersion(options: {
    agentId: AgentId
    body: components['schemas']['organization__create_agent_version__Request']
    query?: operations['create-agent-version']['parameters']['query']
    headers?: operations['create-agent-version']['parameters']['header']
  }) {
    const { agentId, body, query, headers } = options
    return extractData(
      this.c.POST('/v1/{organization}/organization/agent/{agent_id}/', {
        params: { path: { organization: this.orgId, agent_id: agentId }, query },
        body,
        headers,
      })
    )
  }

  /** Get versions of an agent. */
  async getAgentVersions(options: {
    agentId: AgentId
    query?: operations['get-agent-versions']['parameters']['query']
    headers?: operations['get-agent-versions']['parameters']['header']
  }) {
    const { agentId, query, headers } = options
    return extractData(
      this.c.GET('/v1/{organization}/organization/agent/{agent_id}/version', {
        params: { path: { organization: this.orgId, agent_id: agentId }, query },
        headers,
      })
    )
  }

  // --- Convenience aliases ---

  /** Alias for getAgents. */
  async list(options?: Parameters<AgentResource['getAgents']>[0]) {
    return this.getAgents(options)
  }

  /** Alias for createAgent. */
  async create(options: Parameters<AgentResource['createAgent']>[0]) {
    return this.createAgent(options)
  }

  /** Alias for deleteAgent. */
  async delete(options: Parameters<AgentResource['deleteAgent']>[0]): Promise<void> {
    return this.deleteAgent(options)
  }
}
