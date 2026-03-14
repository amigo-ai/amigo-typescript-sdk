import { describe, it, expect } from 'vitest'
import { parseRateLimitHeaders } from '../src/core/rate-limit'

describe('parseRateLimitHeaders', () => {
  it('parses valid rate limit headers', () => {
    const headers = new Headers({
      'x-ratelimit-limit': '100',
      'x-ratelimit-remaining': '42',
      'x-ratelimit-reset': '1700000000',
    })
    const info = parseRateLimitHeaders(headers)
    expect(info).toBeDefined()
    expect(info!.limit).toBe(100)
    expect(info!.remaining).toBe(42)
    expect(info!.reset).toEqual(new Date(1700000000 * 1000))
  })

  it('returns undefined when headers are missing', () => {
    const headers = new Headers({})
    expect(parseRateLimitHeaders(headers)).toBeUndefined()
  })

  it('returns undefined when only some headers present', () => {
    const headers = new Headers({
      'x-ratelimit-limit': '100',
    })
    expect(parseRateLimitHeaders(headers)).toBeUndefined()
  })

  it('returns undefined for non-numeric values', () => {
    const headers = new Headers({
      'x-ratelimit-limit': 'abc',
      'x-ratelimit-remaining': '42',
      'x-ratelimit-reset': '1700000000',
    })
    expect(parseRateLimitHeaders(headers)).toBeUndefined()
  })
})
