/**
 * Webhook event types and payload interfaces for the Amigo AI platform.
 *
 * @see https://docs.amigo.ai/webhooks
 */

/** Post-processing operation types. */
export type PostProcessingType =
  | 'generate-tasks'
  | 'generate-user-models'
  | 'extract-memories'
  | 'compute-metrics'

/** Fired when async post-processing completes for a conversation. */
export interface ConversationPostProcessingCompleteEvent {
  type: 'conversation-post-processing-complete'
  post_processing_type: PostProcessingType
  conversation_id: string
  org_id: string
}

/**
 * Discriminated union of all webhook event types.
 * Expand this union as Amigo adds new event types.
 */
export type WebhookEvent = ConversationPostProcessingCompleteEvent

/** All known webhook event type strings. */
export type WebhookEventType = WebhookEvent['type']

/** Headers included in every webhook request from Amigo. */
export interface WebhookHeaders {
  /** Unique key for deduplication across retries. */
  'x-amigo-idempotent-key': string
  /** UNIX timestamp in milliseconds of the delivery attempt. */
  'x-amigo-request-timestamp': string
  /** HMAC-SHA256 signature of `v1:{timestamp}:{body}`. */
  'x-amigo-request-signature': string
}
