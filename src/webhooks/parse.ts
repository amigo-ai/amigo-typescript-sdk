import { createHmac, timingSafeEqual } from 'node:crypto'
import type { WebhookEvent, WebhookEventType } from './types'

/** Options for parsing a webhook event. */
export interface ParseWebhookEventOptions {
  /** Raw request body (string or Buffer). */
  payload: string | Buffer
  /** HMAC-SHA256 signature from `x-amigo-request-signature` header. */
  signature?: string
  /** Timestamp from `x-amigo-request-timestamp` header (ms). */
  timestamp?: string
  /** Webhook destination secret for signature verification. */
  secret?: string
  /**
   * Maximum age of the webhook event in milliseconds.
   * Events older than this are rejected to prevent replay attacks.
   * @default 300_000 (5 minutes)
   */
  maxAge?: number
}

/** Error thrown when webhook verification fails. */
export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}

const KNOWN_EVENT_TYPES: Set<WebhookEventType> = new Set(['conversation-post-processing-complete'])

/**
 * Parse and optionally verify a webhook event payload.
 *
 * If `signature`, `timestamp`, and `secret` are all provided, the
 * payload's HMAC-SHA256 signature is verified before parsing.
 *
 * @throws {WebhookVerificationError} If signature verification fails or the event is too old.
 * @returns The typed webhook event.
 */
export function parseWebhookEvent(options: ParseWebhookEventOptions): WebhookEvent {
  const { payload, signature, timestamp, secret, maxAge = 300_000 } = options

  const body = typeof payload === 'string' ? payload : payload.toString('utf-8')

  // Verify signature if all pieces are present
  if (signature && timestamp && secret) {
    verifySignature(body, timestamp, signature, secret)

    // Check timestamp freshness
    const eventTime = parseInt(timestamp, 10)
    if (isNaN(eventTime)) {
      throw new WebhookVerificationError('Invalid timestamp')
    }
    if (Date.now() - eventTime > maxAge) {
      throw new WebhookVerificationError(
        `Webhook event is too old (received ${Date.now() - eventTime}ms ago, max ${maxAge}ms)`
      )
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new WebhookVerificationError('Invalid JSON payload')
  }

  if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
    throw new WebhookVerificationError('Payload missing "type" field')
  }

  const event = parsed as { type: string }
  if (!KNOWN_EVENT_TYPES.has(event.type as WebhookEventType)) {
    throw new WebhookVerificationError(`Unknown webhook event type: ${event.type}`)
  }

  return parsed as WebhookEvent
}

/**
 * Verify the HMAC-SHA256 signature of a webhook payload.
 *
 * @throws {WebhookVerificationError} If the signature does not match.
 */
export function verifySignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): void {
  const expected = createHmac('sha256', secret).update(`v1:${timestamp}:${body}`).digest('hex')

  const sigBuf = Buffer.from(signature, 'utf-8')
  const expectedBuf = Buffer.from(expected, 'utf-8')

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new WebhookVerificationError('Signature verification failed')
  }
}
