declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

/** A branded string representing a Workspace ID. */
export type WorkspaceId = Brand<string, 'WorkspaceId'>
/** A branded string representing a Skill ID. */
export type SkillId = Brand<string, 'SkillId'>
/** A branded string representing an Integration ID. */
export type IntegrationId = Brand<string, 'IntegrationId'>
/** A branded string representing an HSM ID. */
export type HsmId = Brand<string, 'HsmId'>
/** A branded string representing a Context Graph ID. */
export type ContextGraphId = Brand<string, 'ContextGraphId'>
/** A branded string representing a Platform Agent ID. */
export type PlatformAgentId = Brand<string, 'PlatformAgentId'>
/** A branded string representing a Platform Service ID. */
export type PlatformServiceId = Brand<string, 'PlatformServiceId'>
/** A branded string representing a Phone Number ID. */
export type PhoneNumberId = Brand<string, 'PhoneNumberId'>
/** A branded string representing a Platform API Key ID. */
export type PlatformApiKeyId = Brand<string, 'PlatformApiKeyId'>
/** A branded string representing a Call SID. */
export type CallSid = Brand<string, 'CallSid'>
/** A branded string representing a Platform Conversation ID. */
export type PlatformConversationId = Brand<string, 'PlatformConversationId'>
/** A branded string representing a Data Source ID. */
export type DataSourceId = Brand<string, 'DataSourceId'>
/** A branded string representing an Operator ID. */
export type OperatorId = Brand<string, 'OperatorId'>
/** A branded string representing a Review Item ID. */
export type ReviewItemId = Brand<string, 'ReviewItemId'>
/** A branded string representing a Monitor Concept ID. */
export type MonitorConceptId = Brand<string, 'MonitorConceptId'>
/** A branded string representing a Unification Rule ID. */
export type UnificationRuleId = Brand<string, 'UnificationRuleId'>
/** A branded string representing an Entity ID. */
export type EntityId = Brand<string, 'EntityId'>
/** A branded string representing a Task ID. */
export type TaskId = Brand<string, 'TaskId'>

export function workspaceId(id: string): WorkspaceId {
  return id as WorkspaceId
}
export function skillId(id: string): SkillId {
  return id as SkillId
}
export function integrationId(id: string): IntegrationId {
  return id as IntegrationId
}
export function hsmId(id: string): HsmId {
  return id as HsmId
}
export function contextGraphId(id: string): ContextGraphId {
  return id as ContextGraphId
}
export function platformAgentId(id: string): PlatformAgentId {
  return id as PlatformAgentId
}
export function platformServiceId(id: string): PlatformServiceId {
  return id as PlatformServiceId
}
export function phoneNumberId(id: string): PhoneNumberId {
  return id as PhoneNumberId
}
export function platformApiKeyId(id: string): PlatformApiKeyId {
  return id as PlatformApiKeyId
}
export function callSid(id: string): CallSid {
  return id as CallSid
}
export function platformConversationId(id: string): PlatformConversationId {
  return id as PlatformConversationId
}
export function dataSourceId(id: string): DataSourceId {
  return id as DataSourceId
}
export function operatorId(id: string): OperatorId {
  return id as OperatorId
}
export function reviewItemId(id: string): ReviewItemId {
  return id as ReviewItemId
}
export function monitorConceptId(id: string): MonitorConceptId {
  return id as MonitorConceptId
}
export function unificationRuleId(id: string): UnificationRuleId {
  return id as UnificationRuleId
}
export function entityId(id: string): EntityId {
  return id as EntityId
}
export function taskId(id: string): TaskId {
  return id as TaskId
}
