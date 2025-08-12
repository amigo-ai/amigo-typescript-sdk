import { describe, test } from 'vitest'

// Stubs only. Implement using MSW as in other resource tests (see `tests/resources/organization.test.ts`).

describe('ConversationResource', () => {
  describe('createConversation', () => {
    test.todo('streams NDJSON events and yields conversation and interaction ids')
    test.todo('sends body, query params, and headers')
    test.todo('supports AbortSignal cancellation')
    test.todo('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)')
  })

  describe('interactWithConversation', () => {
    test.todo('streams NDJSON events for text FormData with recorded_message')
    test.todo('accepts ReadableStream<Uint8Array> input (streaming)')
    test.todo('passes query params (request_format/response_format) and headers')
    test.todo('supports AbortSignal cancellation')
    test.todo('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)')
  })

  describe('getConversations', () => {
    test.todo('returns data on success')
    test.todo('passes query params correctly (arrays, pagination, sorting)')
    test.todo('passes headers through')
    test.todo('throws NotFoundError on 404')
  })

  describe('getConversationMessages', () => {
    test.todo('returns messages list for a conversation')
    test.todo('supports pagination params (limit, continuation_token, sort_by)')
    test.todo('passes headers through')
    test.todo('throws NotFoundError on 404')
  })

  describe('finishConversation', () => {
    test.todo('returns void on 204 success')
    test.todo('supports AbortSignal cancellation')
    test.todo('throws ConflictError on 409 when already finished')
    test.todo('throws NotFoundError on 404 for missing conversation')
  })

  describe('recommendResponsesForInteraction', () => {
    test.todo('returns recommended responses for a conversation interaction')
    test.todo('passes headers through')
    test.todo('throws NotFoundError on 404')
  })

  describe('getInteractionInsights', () => {
    test.todo('returns insights for a conversation interaction')
    test.todo('passes headers through')
    test.todo('throws NotFoundError on 404')
  })

  describe('getMessageSource', () => {
    test.todo('returns message source details for a given message id')
    test.todo('passes headers through')
    test.todo('throws NotFoundError on 404')
  })

  describe('generateConversationStarters', () => {
    test.todo('returns generated conversation starter(s)')
    test.todo('passes body, optional query params, and headers')
    test.todo('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)')
  })
})
