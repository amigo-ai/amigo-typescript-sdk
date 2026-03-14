declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

/** A branded string representing a Conversation ID. */
export type ConversationId = Brand<string, 'ConversationId'>
/** A branded string representing a Message ID. */
export type MessageId = Brand<string, 'MessageId'>
/** A branded string representing a User ID. */
export type UserId = Brand<string, 'UserId'>
/** A branded string representing an Organization ID. */
export type OrgId = Brand<string, 'OrgId'>
/** A branded string representing an Interaction ID. */
export type InteractionId = Brand<string, 'InteractionId'>
/** A branded string representing a Service ID. */
export type ServiceId = Brand<string, 'ServiceId'>
/** A branded string representing an Agent ID. */
export type AgentId = Brand<string, 'AgentId'>
/** A branded string representing a Tool ID. */
export type ToolId = Brand<string, 'ToolId'>
/** A branded string representing a Dynamic Behavior Set ID. */
export type DynamicBehaviorSetId = Brand<string, 'DynamicBehaviorSetId'>
/** A branded string representing a Metric ID. */
export type MetricId = Brand<string, 'MetricId'>
/** A branded string representing a Simulation Persona ID. */
export type SimulationPersonaId = Brand<string, 'SimulationPersonaId'>
/** A branded string representing a Simulation Scenario ID. */
export type SimulationScenarioId = Brand<string, 'SimulationScenarioId'>
/** A branded string representing a Simulation Unit Test ID. */
export type SimulationUnitTestId = Brand<string, 'SimulationUnitTestId'>
/** A branded string representing a Simulation Unit Test Set ID. */
export type SimulationUnitTestSetId = Brand<string, 'SimulationUnitTestSetId'>
/** A branded string representing a Webhook Destination ID. */
export type WebhookDestinationId = Brand<string, 'WebhookDestinationId'>
/** A branded string representing a Role ID. */
export type RoleId = Brand<string, 'RoleId'>
/** A branded string representing an API Key ID. */
export type ApiKeyId = Brand<string, 'ApiKeyId'>

/** Create a branded ConversationId from a plain string. */
export function conversationId(id: string): ConversationId {
  return id as ConversationId
}

/** Create a branded MessageId from a plain string. */
export function messageId(id: string): MessageId {
  return id as MessageId
}

/** Create a branded UserId from a plain string. */
export function userId(id: string): UserId {
  return id as UserId
}

/** Create a branded OrgId from a plain string. */
export function orgId(id: string): OrgId {
  return id as OrgId
}

/** Create a branded InteractionId from a plain string. */
export function interactionId(id: string): InteractionId {
  return id as InteractionId
}

/** Create a branded ServiceId from a plain string. */
export function serviceId(id: string): ServiceId {
  return id as ServiceId
}

/** Create a branded AgentId from a plain string. */
export function agentId(id: string): AgentId {
  return id as AgentId
}

/** Create a branded ToolId from a plain string. */
export function toolId(id: string): ToolId {
  return id as ToolId
}

/** Create a branded DynamicBehaviorSetId from a plain string. */
export function dynamicBehaviorSetId(id: string): DynamicBehaviorSetId {
  return id as DynamicBehaviorSetId
}

/** Create a branded MetricId from a plain string. */
export function metricId(id: string): MetricId {
  return id as MetricId
}

/** Create a branded SimulationPersonaId from a plain string. */
export function simulationPersonaId(id: string): SimulationPersonaId {
  return id as SimulationPersonaId
}

/** Create a branded SimulationScenarioId from a plain string. */
export function simulationScenarioId(id: string): SimulationScenarioId {
  return id as SimulationScenarioId
}

/** Create a branded SimulationUnitTestId from a plain string. */
export function simulationUnitTestId(id: string): SimulationUnitTestId {
  return id as SimulationUnitTestId
}

/** Create a branded SimulationUnitTestSetId from a plain string. */
export function simulationUnitTestSetId(id: string): SimulationUnitTestSetId {
  return id as SimulationUnitTestSetId
}

/** Create a branded WebhookDestinationId from a plain string. */
export function webhookDestinationId(id: string): WebhookDestinationId {
  return id as WebhookDestinationId
}

/** Create a branded RoleId from a plain string. */
export function roleId(id: string): RoleId {
  return id as RoleId
}

/** Create a branded ApiKeyId from a plain string. */
export function apiKeyId(id: string): ApiKeyId {
  return id as ApiKeyId
}
