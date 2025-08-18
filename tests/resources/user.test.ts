import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAmigoFetch } from '../../src/core/openapi-client'
import { UserResource } from '../../src/resources/user'
import { withMockAuth, mockConfig } from '../test-helpers'
import { NotFoundError, ValidationError } from '../../src/core/errors'
import type { components, operations } from '../../src/generated/api-types'

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

describe('UserResource', () => {
  describe('getUsers', () => {
    test('returns data on success', async () => {
      const mockResponse = { users: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/user/', () => {
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      const result = await resource.getUsers()

      expect(result).toEqual(mockResponse as unknown)
    })

    test('passes query parameters correctly', async () => {
      const mockResponse = { users: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/user/', ({ request }) => {
            const url = new URL(request.url)
            const params = url.searchParams

            expect(params.getAll('user_id')).toEqual(['u-1', 'u-2'])
            expect(params.getAll('email')).toEqual(['a@example.com'])
            expect(params.get('is_verified')).toBe('true')
            expect(params.get('limit')).toBe('10')
            expect(params.get('continuation_token')).toBe('5')
            expect(params.getAll('sort_by')).toEqual(['+created_at', '-created_at'])

            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')

      const query: operations['get-users']['parameters']['query'] = {
        user_id: ['u-1', 'u-2'],
        email: ['a@example.com'],
        is_verified: true,
        limit: 10,
        continuation_token: 5,
        sort_by: ['+created_at', '-created_at'],
      }

      await resource.getUsers(query)
    })

    test('accepts and forwards headers', async () => {
      const mockResponse = { users: [], has_more: false, continuation_token: null }

      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/test-org/user/', ({ request }) => {
            expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      const headers: operations['get-users']['parameters']['header'] = {
        'x-mongo-cluster-name': 'abc',
      }

      await resource.getUsers(undefined, headers)
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.get('https://api.example.com/v1/nonexistent-org/user/', () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'nonexistent-org')
      await expect(resource.getUsers()).rejects.toThrow(NotFoundError)
    })
  })

  describe('createUser', () => {
    test('creates and returns invited user, sending body and headers', async () => {
      const mockResponse = { user_id: 'u-100', status: 'invited' }

      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/user/invite', async ({ request }) => {
            const body =
              (await request.json()) as components['schemas']['user__create_invited_user__Request']
            expect(body.first_name).toBe('Ada')
            expect(body.last_name).toBe('Lovelace')
            expect(body.email).toBe('ada@example.com')
            expect(body.role_name).toBe('admin')
            expect(request.headers.get('x-mongo-cluster-name')).toBe('abc')
            return HttpResponse.json(mockResponse)
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')

      const body: components['schemas']['user__create_invited_user__Request'] = {
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        role_name: 'admin',
      }

      const headers: operations['create-invited-user']['parameters']['header'] = {
        'x-mongo-cluster-name': 'abc',
      }

      const result = await resource.createUser(body, headers)
      expect(result).toEqual(mockResponse as unknown)
    })

    test('throws ValidationError on 422', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/user/invite', () => {
            return HttpResponse.json(
              { detail: 'bad' },
              {
                status: 422,
                statusText: 'Unprocessable Entity',
              }
            )
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')

      const body: components['schemas']['user__create_invited_user__Request'] = {
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: 'ada@example.com',
        role_name: 'admin',
      }

      await expect(resource.createUser(body)).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteUser', () => {
    test('returns void on 204 success', async () => {
      server.use(
        ...withMockAuth(
          http.delete('https://api.example.com/v1/test-org/user/u-1', () => {
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      await expect(resource.deleteUser('u-1')).resolves.toBeUndefined()
    })

    test('throws NotFoundError on 404', async () => {
      server.use(
        ...withMockAuth(
          http.delete('https://api.example.com/v1/test-org/user/missing', () => {
            return HttpResponse.json(null, { status: 404, statusText: 'Not Found' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      await expect(resource.deleteUser('missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateUser', () => {
    test('returns void on 204 success and sends body and headers', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/user/u-1/user', async ({ request }) => {
            const body =
              (await request.json()) as components['schemas']['user__update_user_info__Request']
            expect(body.first_name).toBe('Grace')
            expect(body.last_name).toBe('Hopper')
            expect(request.headers.get('x-mongo-cluster-name')).toBe('xyz')
            return HttpResponse.text('', { status: 204, statusText: 'No Content' })
          })
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      const body: components['schemas']['user__update_user_info__Request'] = {
        first_name: 'Grace',
        last_name: 'Hopper',
        preferred_language: {},
        timezone: {},
      }
      const headers: operations['update-user-info']['parameters']['header'] = {
        'x-mongo-cluster-name': 'xyz',
      }
      await expect(resource.updateUser('u-1', body, headers)).resolves.toBeUndefined()
    })

    test('throws ValidationError on 422', async () => {
      server.use(
        ...withMockAuth(
          http.post('https://api.example.com/v1/test-org/user/u-1/user', () =>
            HttpResponse.json(
              { detail: 'bad' },
              { status: 422, statusText: 'Unprocessable Entity' }
            )
          )
        )
      )

      const client = createAmigoFetch(mockConfig)
      const resource = new UserResource(client, 'test-org')
      const body = { invalidBodyKey: 'abc' }
      await expect(resource.updateUser('u-1', body as any)).rejects.toThrow(ValidationError)
    })
  })
})
