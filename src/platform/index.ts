import { ConfigurationError } from '../core/errors'
import type { RetryOptions } from '../core/retry'
import { createPlatformFetch, type PlatformFetch } from './core/openapi-client'
import { type PlatformWebSocketConstructor, webSocketBaseFromHttpBase } from './core/websocket'
import { PlatformAgentResource } from './resources/agents'
import { PlatformApiKeyResource } from './resources/api-keys'
import { ContextGraphResource } from './resources/context-graphs'
import { PlatformConversationResource } from './resources/conversations'
import { DataSourceResource } from './resources/data-sources'
import { PlatformEventResource } from './resources/events'
import { FhirResource } from './resources/fhir'
import { IntegrationResource } from './resources/integrations'
import { PhoneNumberResource } from './resources/phone-numbers'
import { PlatformServiceResource } from './resources/services'
import { PlatformSessionResource } from './resources/sessions'
import { SkillResource } from './resources/skills'
import { WorkspaceResource } from './resources/workspaces'
import type { WorkspaceId } from './core/branded-types'
import type { components as PlatformComponents } from '../generated/platform-api-types'

export interface PlatformClientConfig {
  /** Platform API key or JWT. */
  apiKey: string
  /** Workspace ID used by workspace-scoped resources. */
  workspaceId: WorkspaceId
  /** Platform API base URL. */
  baseUrl?: string
  /** Platform WebSocket base URL. Defaults to `baseUrl` with ws/wss protocol. */
  webSocketBaseUrl?: string
  /** Retry configuration for HTTP requests. */
  retry?: RetryOptions
  /** Fetch implementation override for tests or non-standard runtimes. */
  fetch?: typeof fetch
  /** WebSocket constructor override for Node runtimes without global WebSocket. */
  WebSocket?: PlatformWebSocketConstructor
}

const defaultBaseUrl = 'https://api.platform.amigo.ai'

/** Main client for the workspace-scoped Amigo Platform API. */
export class PlatformClient {
  readonly api: PlatformFetch
  readonly agents: PlatformAgentResource
  readonly apiKeys: PlatformApiKeyResource
  readonly contextGraphs: ContextGraphResource
  readonly conversations: PlatformConversationResource
  readonly dataSources: DataSourceResource
  readonly events: PlatformEventResource
  readonly fhir: FhirResource
  readonly integrations: IntegrationResource
  readonly phoneNumbers: PhoneNumberResource
  readonly services: PlatformServiceResource
  readonly sessions: PlatformSessionResource
  readonly skills: SkillResource
  readonly workspaces: WorkspaceResource
  readonly config: Required<
    Pick<PlatformClientConfig, 'apiKey' | 'workspaceId' | 'baseUrl' | 'webSocketBaseUrl'>
  > &
    Omit<PlatformClientConfig, 'apiKey' | 'workspaceId' | 'baseUrl' | 'webSocketBaseUrl'>

  constructor(config: PlatformClientConfig) {
    this.config = validateConfig(config)
    this.api = createPlatformFetch(this.config)

    this.workspaces = new WorkspaceResource(this.api, this.config.workspaceId)
    this.agents = new PlatformAgentResource(this.api, this.config.workspaceId)
    this.apiKeys = new PlatformApiKeyResource(this.api, this.config.workspaceId)
    this.contextGraphs = new ContextGraphResource(this.api, this.config.workspaceId)
    this.conversations = new PlatformConversationResource(this.api, this.config.workspaceId)
    this.dataSources = new DataSourceResource(this.api, this.config.workspaceId)
    this.events = new PlatformEventResource(this.api, this.config.workspaceId)
    this.fhir = new FhirResource(this.api, this.config.workspaceId)
    this.integrations = new IntegrationResource(this.api, this.config.workspaceId)
    this.phoneNumbers = new PhoneNumberResource(this.api, this.config.workspaceId)
    this.services = new PlatformServiceResource(this.api, this.config.workspaceId)
    this.sessions = new PlatformSessionResource(this.api, this.config.workspaceId, {
      apiKey: this.config.apiKey,
      webSocketBaseUrl: this.config.webSocketBaseUrl,
      WebSocket: this.config.WebSocket,
    })
    this.skills = new SkillResource(this.api, this.config.workspaceId)
  }
}

function validateConfig(config: PlatformClientConfig): PlatformClient['config'] {
  if (!config.apiKey) {
    throw new ConfigurationError('Platform API key is required', 'apiKey')
  }
  if (!config.workspaceId) {
    throw new ConfigurationError('Workspace ID is required', 'workspaceId')
  }

  const baseUrl = config.baseUrl ?? defaultBaseUrl
  const webSocketBaseUrl = config.webSocketBaseUrl ?? webSocketBaseFromHttpBase(baseUrl)

  return {
    ...config,
    baseUrl,
    webSocketBaseUrl,
  }
}

export { createPlatformFetch }
export type { PlatformFetch, PlatformWebSocketConstructor }
export type { ServerSentEvent } from '../core/utils'

export {
  AmigoError,
  BadRequestError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  ServiceUnavailableError,
  ConfigurationError,
  ValidationError,
  NetworkError,
  ParseError,
  isAmigoError,
} from '../core/errors'

export type { components, operations, paths } from '../generated/platform-api-types'

export type CallSummary = PlatformComponents['schemas']['CallSummary']
export type CallDetail = PlatformComponents['schemas']['CallDetailResponse']
export type CallTurn = PlatformComponents['schemas']['Turn']
export type CallToolCall = PlatformComponents['schemas']['ToolCall']
export type PlaybackTimeline = PlatformComponents['schemas']['PlaybackTimeline']
export type TimelineActor = PlatformComponents['schemas']['TimelineActor']
export type TimelineLaneDefinition = PlatformComponents['schemas']['TimelineLaneDefinition']
export type TimelineSegment = PlatformComponents['schemas']['TimelineSegment']
export type TimelineTimebase = PlatformComponents['schemas']['TimelineTimebase']
export type TurnTimeline = PlatformComponents['schemas']['TurnTimeline']
export type TimelineSegmentType = TimelineSegment['type']
export type TimelineLane = TimelineSegment['lane']
export type TimelineTrack = NonNullable<TimelineSegment['track']>
export type TimelineActorKind = TimelineActor['kind']
export type TimelineActorRole = TimelineActor['role']

export type {
  CallSid,
  ContextGraphId,
  DataSourceId,
  EntityId,
  HsmId,
  IntegrationId,
  MonitorConceptId,
  OperatorId,
  PhoneNumberId,
  PlatformAgentId,
  PlatformApiKeyId,
  PlatformConversationId,
  PlatformServiceId,
  ReviewItemId,
  SkillId,
  TaskId,
  UnificationRuleId,
  WorkspaceId,
} from './core/branded-types'
export {
  callSid,
  contextGraphId,
  dataSourceId,
  entityId,
  hsmId,
  integrationId,
  monitorConceptId,
  operatorId,
  phoneNumberId,
  platformAgentId,
  platformApiKeyId,
  platformConversationId,
  platformServiceId,
  reviewItemId,
  skillId,
  taskId,
  unificationRuleId,
  workspaceId,
} from './core/branded-types'
