import fetchRetry from 'fetch-retry'

export type RetryOptions = {
  /** Maximum number of attempts to make (default: 3) */
  maxAttempts?: number
  /** Base delay between attempts (default: 250ms) */
  backoffBaseMs?: number
  /** Maximum delay between attempts (default: 30s) */
  maxDelayMs?: number
  /** Status codes to retry on (default: 408, 429, 500, 502, 503, 504) */
  retryOnStatus?: Set<number>
  /** Methods to retry on (default: GET) */
  retryOnMethods?: Set<string>
}

const DEFAULT_RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const DEFAULT_RETRYABLE_METHODS = new Set(['GET']) as Set<string>

export function resolveRetryOptions(options?: RetryOptions): Required<RetryOptions> {
  return {
    maxAttempts: options?.maxAttempts ?? 3,
    backoffBaseMs: options?.backoffBaseMs ?? 250,
    maxDelayMs: options?.maxDelayMs ?? 30_000,
    retryOnStatus: options?.retryOnStatus ?? DEFAULT_RETRYABLE_STATUS,
    retryOnMethods: options?.retryOnMethods ?? DEFAULT_RETRYABLE_METHODS,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parseRetryAfterMs(headerValue: string | null, maxDelayMs: number): number | null {
  if (!headerValue) return null
  const seconds = Number(headerValue)
  if (Number.isFinite(seconds)) {
    return clamp(Math.max(0, seconds * 1000), 0, maxDelayMs)
  }
  const date = new Date(headerValue)
  const ms = date.getTime() - Date.now()
  if (Number.isFinite(ms)) {
    return clamp(Math.max(0, ms), 0, maxDelayMs)
  }
  return null
}

function computeBackoffWithJitterMs(
  attemptIndexZeroBased: number,
  baseMs: number,
  capMs: number
): number {
  const windowMs = Math.min(capMs, baseMs * Math.pow(2, attemptIndexZeroBased))
  return Math.random() * windowMs
}

/**
 * Create a fetch function.
 * This wraps an underlying fetch (globalThis.fetch by default) with fetch-retry, and
 * injects per-call retryOn/retryDelay computed from the HTTP method and response status.
 */
export function createRetryingFetch(
  retryOptions?: RetryOptions,
  baseFetch?: typeof fetch
): typeof fetch {
  const resolved = resolveRetryOptions(retryOptions)

  const underlying = baseFetch ?? (globalThis.fetch as typeof fetch)
  const baseWrapped = fetchRetry(underlying)

  const customFetch = (input: any, init?: any) => {
    const inputMethod =
      typeof Request !== 'undefined' && input instanceof Request ? input.method : undefined
    const method = ((init?.method ?? inputMethod ?? 'GET') as string).toUpperCase()

    const isMethodRetryableByDefault = resolved.retryOnMethods.has(method)
    const retries = Math.max(0, (resolved.maxAttempts ?? 1) - 1)

    const retryDelay = (attempt: number, error: unknown, response: Response | null): number => {
      // attempt is zero-based in fetch-retry
      const retryAfterMs = response?.headers
        ? parseRetryAfterMs(response.headers.get('Retry-After'), resolved.maxDelayMs)
        : null
      if (retryAfterMs !== null) {
        return retryAfterMs
      }
      return computeBackoffWithJitterMs(attempt, resolved.backoffBaseMs, resolved.maxDelayMs)
    }

    const retryOn = (attempt: number, error: unknown, response: Response | null): boolean => {
      // Transport errors
      if (error != null) {
        return isMethodRetryableByDefault
      }

      if (!response) return false
      const status = response.status

      // Method-specific rules
      if (method === 'POST') {
        // Only retry POST on 429 when Retry-After exists
        if (status === 429 && response.headers?.get('Retry-After')) {
          return true
        }
        return false
      }

      // Other methods: only those configured (defaults to GET)
      if (!isMethodRetryableByDefault) return false

      return resolved.retryOnStatus.has(status)
    }

    // Pass through all original init options, and add per-call retry options
    const mergedInit = {
      ...init,
      retries,
      retryDelay,
      retryOn,
    } as any

    return baseWrapped(input as any, mergedInit as any)
  }

  return customFetch as unknown as typeof fetch
}

export type { RetryOptions as AmigoRetryOptions }
