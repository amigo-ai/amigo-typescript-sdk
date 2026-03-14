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
