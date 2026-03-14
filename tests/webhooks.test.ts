import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { parseWebhookEvent, verifySignature, WebhookVerificationError } from '../src/webhooks'

const VALID_PAYLOAD = JSON.stringify({
  type: 'conversation-post-processing-complete',
  post_processing_type: 'extract-memories',
  conversation_id: 'conv_123',
  org_id: 'org_456',
})

const SECRET = 'test-webhook-secret'

function sign(body: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(`v1:${timestamp}:${body}`).digest('hex')
}

describe('parseWebhookEvent', () => {
  it('parses a valid event without signature', () => {
    const event = parseWebhookEvent({ payload: VALID_PAYLOAD })
    expect(event.type).toBe('conversation-post-processing-complete')
    expect(event.conversation_id).toBe('conv_123')
    expect(event.org_id).toBe('org_456')
  })

  it('parses a valid event with correct signature', () => {
    const ts = String(Date.now())
    const sig = sign(VALID_PAYLOAD, ts, SECRET)
    const event = parseWebhookEvent({
      payload: VALID_PAYLOAD,
      signature: sig,
      timestamp: ts,
      secret: SECRET,
    })
    expect(event.type).toBe('conversation-post-processing-complete')
  })

  it('accepts Buffer payload', () => {
    const event = parseWebhookEvent({ payload: Buffer.from(VALID_PAYLOAD) })
    expect(event.type).toBe('conversation-post-processing-complete')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseWebhookEvent({ payload: 'not json' })).toThrow(WebhookVerificationError)
  })

  it('throws on missing type field', () => {
    expect(() => parseWebhookEvent({ payload: '{"foo":"bar"}' })).toThrow('missing "type" field')
  })

  it('throws on unknown event type', () => {
    expect(() => parseWebhookEvent({ payload: '{"type":"unknown-event"}' })).toThrow(
      'Unknown webhook event type'
    )
  })

  it('throws on invalid signature', () => {
    const ts = String(Date.now())
    expect(() =>
      parseWebhookEvent({
        payload: VALID_PAYLOAD,
        signature: 'bad-signature-hex',
        timestamp: ts,
        secret: SECRET,
      })
    ).toThrow('Signature verification failed')
  })

  it('throws on stale timestamp', () => {
    const ts = String(Date.now() - 600_000) // 10 min ago
    const sig = sign(VALID_PAYLOAD, ts, SECRET)
    expect(() =>
      parseWebhookEvent({
        payload: VALID_PAYLOAD,
        signature: sig,
        timestamp: ts,
        secret: SECRET,
        maxAge: 300_000,
      })
    ).toThrow('too old')
  })

  it('throws on invalid timestamp', () => {
    const sig = sign(VALID_PAYLOAD, 'not-a-number', SECRET)
    expect(() =>
      parseWebhookEvent({
        payload: VALID_PAYLOAD,
        signature: sig,
        timestamp: 'not-a-number',
        secret: SECRET,
      })
    ).toThrow('Invalid timestamp')
  })
})

describe('verifySignature', () => {
  it('accepts a valid signature', () => {
    const ts = '1234567890'
    const body = 'test body'
    const sig = sign(body, ts, SECRET)
    expect(() => verifySignature(body, ts, sig, SECRET)).not.toThrow()
  })

  it('rejects an invalid signature', () => {
    expect(() => verifySignature('body', '123', 'wrong', SECRET)).toThrow(
      'Signature verification failed'
    )
  })
})
