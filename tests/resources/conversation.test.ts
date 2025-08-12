import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { ConversationResource } from '../../src/resources/conversation'
import { withMockAuth, mockConfig } from '../test-helpers'
import { NotFoundError, ConflictError } from '../../src/core/errors'

// Helpers
function createNdjsonStream(objects: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const obj of objects) {
        const line = JSON.stringify(obj) + '\n'
        controller.enqueue(encoder.encode(line))
      }
      controller.close()
    },
  })
}

const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('ConversationResource', () => {
  describe('createConversation', () => {
    test('streams NDJSON events and yields conversation and interaction ids', async () => {
      const stream = createNdjsonStream([
        { type: 'conversation-created', conversation_id: 'c-1' },
        { type: 'new-message', message: 'hello' },
        { type: 'interaction-complete', interaction_id: 'i-1' },
      ])

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/', () => {
            return new Response(stream, {
              status: 201,
              headers: { 'Content-Type': 'application/x-ndjson' },
            })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      const events = await resource.createConversation(
        { service_id: 'svc', service_version_set_name: 'release' } as any,
        { response_format: 'text' } as any
      )

      let conversationId: string | undefined
      let interactionId: string | undefined
      let sawNewMessage = false

      for await (const evt of events) {
        if ((evt as any)?.type === 'conversation-created') {
          conversationId = (evt as any).conversation_id
        } else if ((evt as any)?.type === 'new-message') {
          sawNewMessage = true
        } else if ((evt as any)?.type === 'interaction-complete') {
          interactionId = (evt as any).interaction_id
        }
      }

      expect(conversationId).toBe('c-1')
      expect(interactionId).toBe('i-1')
      expect(sawNewMessage).toBe(true)
    })

    test('sends body, query params, and headers', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/', async ({ request }) => {
            const url = new URL(request.url)
            const params = url.searchParams
            const body = (await request.json()) as any

            expect(body.service_id).toBe('svc')
            expect(body.service_version_set_name).toBe('release')
            expect(params.get('response_format')).toBe('text')
            expect(request.headers.get('x-test-header')).toBe('abc')

            // Return minimal NDJSON stream
            const stream = createNdjsonStream([{ type: 'ok' }])
            return new Response(stream, {
              status: 201,
              headers: { 'Content-Type': 'application/x-ndjson' },
            })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      const events = await resource.createConversation(
        { service_id: 'svc', service_version_set_name: 'release' } as any,
        { response_format: 'text' } as any,
        { 'x-test-header': 'abc' } as any
      )

      // Drain iterator to ensure handler runs fully
      for await (const _ of events) {
        break
      }
    })

    test('supports AbortSignal cancellation', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/', () => {
            // Never-ending stream; abort should cancel fetch
            const never = new ReadableStream<Uint8Array>({ start() {} })
            return new Response(never, { status: 201 })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      const controller = new AbortController()
      controller.abort()

      await expect(
        (async () => {
          const events = await resource.createConversation(
            { service_id: 'svc', service_version_set_name: 'release' } as any,
            { response_format: 'text' } as any,
            undefined,
            { signal: controller.signal }
          )
          // Attempt to read (should reject due to abort)
          for await (const _ of events) {
            // no-op
          }
        })()
      ).rejects.toThrow()
    })

    test('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/', () => {
            return HttpResponse.json(
              { detail: 'bad request' },
              { status: 400, statusText: 'Bad Request' }
            )
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      await expect(
        (async () => {
          const events = await resource.createConversation(
            { service_id: 'svc', service_version_set_name: 'release' } as any,
            { response_format: 'text' } as any
          )
          for await (const _ of events) {
            // no-op
          }
        })()
      ).rejects.toThrow()
    })
  })

  describe('interactWithConversation', () => {
    test('streams NDJSON events for text FormData with recorded_message', async () => {
      const stream = createNdjsonStream([
        { type: 'new-message', message: 'hi' },
        { type: 'interaction-complete', interaction_id: 'i-2' },
      ])

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/conversation/conv-1/interact',
            async ({ request }) => {
              // Validate multipart content type (do not parse full form for simplicity)
              expect(request.headers.get('content-type')).toContain('multipart/form-data')
              const url = new URL(request.url)
              expect(url.searchParams.get('request_format')).toBe('text')
              expect(url.searchParams.get('response_format')).toBe('text')
              return new Response(stream, {
                status: 200,
                headers: { 'Content-Type': 'application/x-ndjson' },
              })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      const form = new FormData()
      const blob = new Blob(['hello'], { type: 'text/plain; charset=utf-8' })
      form.append('recorded_message', blob, 'message.txt')

      const events = await resource.interactWithConversation('conv-1', form, {
        request_format: 'text',
        response_format: 'text',
      } as any)

      let sawNewMessage = false
      let interactionId: string | undefined
      for await (const evt of events) {
        if ((evt as any)?.type === 'new-message') sawNewMessage = true
        if ((evt as any)?.type === 'interaction-complete')
          interactionId = (evt as any).interaction_id
      }

      expect(sawNewMessage).toBe(true)
      expect(interactionId).toBe('i-2')
    })

    test('accepts ReadableStream<Uint8Array> input (streaming) and passes headers/query', async () => {
      const responseStream = createNdjsonStream([
        { type: 'interaction-complete', interaction_id: 'i-3' },
      ])

      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/conversation/conv-2/interact',
            async ({ request }) => {
              const url = new URL(request.url)
              expect(url.searchParams.get('request_format')).toBe('voice')
              expect(url.searchParams.get('response_format')).toBe('text')
              expect(request.headers.get('x-audio-format')).toBe('pcm16')
              return new Response(responseStream, {
                status: 200,
                headers: { 'Content-Type': 'application/x-ndjson' },
              })
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      const audioStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]))
          controller.close()
        },
      })

      const events = await resource.interactWithConversation(
        'conv-2',
        audioStream,
        { request_format: 'voice', response_format: 'text' } as any,
        { 'x-audio-format': 'pcm16' } as any
      )

      let interactionId: string | undefined
      for await (const evt of events) {
        if ((evt as any)?.type === 'interaction-complete')
          interactionId = (evt as any).interaction_id
      }
      expect(interactionId).toBe('i-3')
    })

    test('supports AbortSignal cancellation', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conv-abort/interact', () => {
            const never = new ReadableStream<Uint8Array>({ start() {} })
            return new Response(never, { status: 200 })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const controller = new AbortController()
      controller.abort()

      await expect(
        (async () => {
          const events = await resource.interactWithConversation(
            'conv-abort',
            new ReadableStream<Uint8Array>({ start() {} }),
            { request_format: 'voice', response_format: 'text' } as any,
            undefined,
            { signal: controller.signal }
          )
          for await (const _ of events) {
            // no-op
          }
        })()
      ).rejects.toThrow()
    })

    test('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conv-err/interact', () =>
            HttpResponse.json(
              { detail: 'unprocessable' },
              { status: 422, statusText: 'Unprocessable Entity' }
            )
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')

      await expect(
        (async () => {
          const events = await resource.interactWithConversation(
            'conv-err',
            new ReadableStream<Uint8Array>({ start() {} }),
            { request_format: 'voice', response_format: 'text' } as any
          )
          for await (const _ of events) {
            // no-op
          }
        })()
      ).rejects.toThrow()
    })
  })

  describe('getConversations', () => {
    test('returns data on success and passes query params', async () => {
      const mockResponse = { conversations: [], has_more: false, continuation_token: null }
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/conversation/', ({ request }) => {
            const url = new URL(request.url)
            const params = url.searchParams
            expect(params.getAll('service_id')).toEqual(['svc-1', 'svc-2'])
            expect(params.get('is_finished')).toBe('false')
            expect(params.get('limit')).toBe('10')
            expect(params.get('continuation_token')).toBe('5')
            expect(params.getAll('sort_by')).toEqual(['-created_at'])
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.getConversations({
        service_id: ['svc-1', 'svc-2'],
        is_finished: false,
        limit: 10,
        continuation_token: 5,
        sort_by: ['-created_at'],
      } as any)
      expect(data).toEqual(mockResponse as any)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/conversation/', () =>
            HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.getConversations()).rejects.toThrow(NotFoundError)
    })
  })

  describe('getConversationMessages', () => {
    test('returns messages and supports pagination params', async () => {
      const mockResponse = { messages: [{ id: 'm1' }], has_more: false, continuation_token: null }
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-3/messages/',
            ({ request }) => {
              const url = new URL(request.url)
              const params = url.searchParams
              expect(params.get('limit')).toBe('1')
              expect(params.get('continuation_token')).toBe('7')
              expect(params.getAll('sort_by')).toEqual(['+created_at'])
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.getConversationMessages('conv-3', {
        limit: 1,
        continuation_token: 7,
        sort_by: ['+created_at'],
      } as any)
      expect(data).toEqual(mockResponse as any)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/conversation/missing/messages/', () =>
            HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.getConversationMessages('missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('finishConversation', () => {
    test('returns void on 204 success', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conv-4/finish/', () =>
            HttpResponse.text('', { status: 204, statusText: 'No Content' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.finishConversation('conv-4')).resolves.toBeUndefined()
    })

    test('supports AbortSignal cancellation', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conv-5/finish/', () => {
            const never = new ReadableStream<Uint8Array>({ start() {} })
            return new Response(never, { status: 204 })
          })
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const controller = new AbortController()
      controller.abort()
      await expect(
        resource.finishConversation('conv-5', undefined, { signal: controller.signal })
      ).rejects.toThrow()
    })

    test('throws ConflictError on 409 when already finished', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conv-6/finish/', () =>
            HttpResponse.json(
              { detail: 'already finished' },
              { status: 409, statusText: 'Conflict' }
            )
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.finishConversation('conv-6')).rejects.toThrow(ConflictError)
    })

    test('throws NotFoundError on 404 for missing conversation', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/missing/finish/', () =>
            HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.finishConversation('missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('recommendResponsesForInteraction', () => {
    test('returns recommended responses for a conversation interaction', async () => {
      const mockResponse = { recommended_responses: [{ text: 'hello' }] }
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-7/interaction/int-1/recommend_responses',
            () => HttpResponse.json(mockResponse)
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.recommendResponsesForInteraction('conv-7', 'int-1')
      expect(data).toEqual(mockResponse as any)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-7/interaction/missing/recommend_responses',
            () => HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.recommendResponsesForInteraction('conv-7', 'missing')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('getInteractionInsights', () => {
    test('returns insights for a conversation interaction', async () => {
      const mockResponse = { current_state_name: 'Talking' }
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-8/interaction/int-2/insights',
            () => HttpResponse.json(mockResponse)
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.getInteractionInsights('conv-8', 'int-2')
      expect(data).toEqual(mockResponse as any)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-8/interaction/missing/insights',
            () => HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.getInteractionInsights('conv-8', 'missing')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('getMessageSource', () => {
    test('returns message source details for a given message id', async () => {
      const mockResponse = { source: { type: 'tool' } }
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-9/messages/msg-1/source',
            () => HttpResponse.json(mockResponse)
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.getMessageSource('conv-9', 'msg-1')
      expect(data).toEqual(mockResponse as any)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get(
            'https://api.example.com/v1/test-org/conversation/conv-9/messages/missing/source',
            () => HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.getMessageSource('conv-9', 'missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('generateConversationStarters', () => {
    test('returns generated conversation starter(s) and passes query/headers', async () => {
      const mockResponse = { starters: ['Hi there!'] }
      server.use(
        ...withMockAuth(
          http.post(
            'https://api.example.com/v1/test-org/conversation/conversation_starter',
            async ({ request }) => {
              const url = new URL(request.url)
              const body = (await request.json()) as any
              expect(body).toEqual({ topic: 'greeting' })
              expect(url.searchParams.get('limit')).toBe('2')
              expect(request.headers.get('x-extra')).toBe('1')
              return HttpResponse.json(mockResponse)
            }
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      const data = await resource.generateConversationStarters(
        { topic: 'greeting' } as any,
        { limit: 2 } as any,
        { 'x-extra': '1' } as any
      )
      expect(data).toEqual(mockResponse as any)
    })

    test('throws appropriate error on non-2xx responses (e.g., 4xx/5xx)', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/conversation/conversation_starter', () =>
            HttpResponse.json(
              { detail: 'bad' },
              { status: 500, statusText: 'Internal Server Error' }
            )
          )
        )
      )
      const client = createAmigoFetch(mockConfig)
      const resource = new ConversationResource(client, 'test-org')
      await expect(resource.generateConversationStarters({ topic: 'x' } as any)).rejects.toThrow()
    })
  })
})
