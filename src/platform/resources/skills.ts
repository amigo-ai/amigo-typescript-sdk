import type { PlatformFetch } from '../core/openapi-client'
import { extractData } from '../../core/utils'
import type { components, operations } from '../../generated/platform-api-types'
import type { WorkspaceId, SkillId } from '../core/branded-types'

/** Resource for managing skills. */
export class SkillResource {
  constructor(
    private c: PlatformFetch,
    private workspaceId: WorkspaceId
  ) {}

  /** List skills in the workspace. */
  async list(options?: { query?: operations['list-skills']['parameters']['query'] }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/skills', {
        params: { path: { workspace_id: this.workspaceId }, query: options?.query },
      })
    )
  }

  /** Get a skill by ID. */
  async get(options: { skillId: SkillId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/skills/{skill_id}', {
        params: { path: { workspace_id: this.workspaceId, skill_id: options.skillId } },
      })
    )
  }

  /** Create a new skill. */
  async create(options: { body: components['schemas']['CreateSkillRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/skills', {
        params: { path: { workspace_id: this.workspaceId } },
        body: options.body,
      })
    )
  }

  /** Update a skill. */
  async update(options: { skillId: SkillId; body: components['schemas']['UpdateSkillRequest'] }) {
    return extractData(
      this.c.PUT('/v1/{workspace_id}/skills/{skill_id}', {
        params: { path: { workspace_id: this.workspaceId, skill_id: options.skillId } },
        body: options.body,
      })
    )
  }

  /** Delete a skill. */
  async delete(options: { skillId: SkillId }): Promise<void> {
    await this.c.DELETE('/v1/{workspace_id}/skills/{skill_id}', {
      params: { path: { workspace_id: this.workspaceId, skill_id: options.skillId } },
    })
    return undefined
  }

  /** Test a skill in isolation. */
  async test(options: { skillId: SkillId; body: components['schemas']['TestSkillRequest'] }) {
    return extractData(
      this.c.POST('/v1/{workspace_id}/skills/{skill_id}/test', {
        params: { path: { workspace_id: this.workspaceId, skill_id: options.skillId } },
        body: options.body,
      })
    )
  }

  /** Get HSM/service references for a skill. */
  async getReferences(options: { skillId: SkillId }) {
    return extractData(
      this.c.GET('/v1/{workspace_id}/skills/{skill_id}/references', {
        params: { path: { workspace_id: this.workspaceId, skill_id: options.skillId } },
      })
    )
  }
}
