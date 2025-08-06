import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
// Tests for getting a bearer token
// Test that outgoing signin_with_api_key request has correct headers and URL
// Test that non OK response throws error
// Test that response json is parsed into SignInWithApiKeyResponse type

// Tests for Auth Middleware
// Test that Authorization Bearer token is set on outgoing requests
// Test that expired token is refreshed
// Test that non OK response clears token

describe('Auth Tests', () => {
  it('should have placeholder test', () => {
    expect(true).toBe(true)
  })
})
