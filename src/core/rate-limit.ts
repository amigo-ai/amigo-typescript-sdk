/**
 * Rate limit metadata parsed from Amigo API response headers.
 *
 * Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the current window. */
  limit: number
  /** Requests remaining in the current window. */
  remaining: number
  /** When the current rate-limit window resets (UTC). */
  reset: Date
}

/**
 * Parse rate limit info from HTTP response headers.
 * Returns `undefined` if the rate limit headers are not present.
 */
export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get('x-ratelimit-limit')
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')

  if (limit === null || remaining === null || reset === null) {
    return undefined
  }

  const limitNum = parseInt(limit, 10)
  const remainingNum = parseInt(remaining, 10)
  const resetEpoch = parseInt(reset, 10)

  if (isNaN(limitNum) || isNaN(remainingNum) || isNaN(resetEpoch)) {
    return undefined
  }

  return {
    limit: limitNum,
    remaining: remainingNum,
    reset: new Date(resetEpoch * 1000),
  }
}

/**
 * Callback invoked after each API response with rate limit info.
 * Register via `AmigoSdkConfig.onRateLimit`.
 */
export type RateLimitCallback = (info: RateLimitInfo, path: string) => void
