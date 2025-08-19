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

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'AbortError') ||
    (typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name?: unknown }).name === 'AbortError')
  )
}

function isTransportRejection(err: unknown): boolean {
  // Fetch rejections are network-layer failures or aborts; we exclude aborts
  return !!err && !isAbortError(err)
}

async function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)
    const onAbort = () => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createRetryingFetch(
  retryOptions?: RetryOptions,
  baseFetch?: typeof fetch
): typeof fetch {
  const resolved = resolveRetryOptions(retryOptions)
  const underlying: typeof fetch = baseFetch ?? (globalThis.fetch as typeof fetch)

  const retryingFetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const inputMethod =
      typeof Request !== 'undefined' && input instanceof Request ? input.method : undefined
    const method = ((init?.method ?? inputMethod ?? 'GET') as string).toUpperCase()
    const signal = init?.signal

    const isMethodRetryableByDefault = resolved.retryOnMethods.has(method)
    const maxAttempts = Math.max(1, resolved.maxAttempts)

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let response: Response | null = null
      let error: unknown = null

      try {
        response = await underlying(input, init)
      } catch (err) {
        error = err
      }

      if (!error && response && response.ok) {
        return response
      }

      let shouldRetry = false
      let delayMs: number | null = null

      if (isTransportRejection(error)) {
        shouldRetry = isMethodRetryableByDefault
        if (shouldRetry) {
          delayMs = computeBackoffWithJitterMs(
            attempt - 1,
            resolved.backoffBaseMs,
            resolved.maxDelayMs
          )
        }
      } else if (response) {
        const status = response.status
        if (method === 'POST') {
          if (status === 429) {
            const ra = response.headers.get('Retry-After')
            const parsed = parseRetryAfterMs(ra, resolved.maxDelayMs)
            if (parsed !== null) {
              shouldRetry = true
              delayMs = parsed
            }
          }
        } else if (isMethodRetryableByDefault && resolved.retryOnStatus.has(status)) {
          const ra = response.headers.get('Retry-After')
          delayMs =
            parseRetryAfterMs(ra, resolved.maxDelayMs) ??
            computeBackoffWithJitterMs(attempt - 1, resolved.backoffBaseMs, resolved.maxDelayMs)
          shouldRetry = true
        }
      }

      const attemptsRemain = attempt < maxAttempts
      if (!shouldRetry || !attemptsRemain) {
        if (error) throw error
        return response as Response
      }

      if (signal?.aborted) {
        if (error) throw error
        return response as Response
      }

      await abortableSleep(delayMs ?? 0, signal ?? undefined)
    }

    throw new Error('Retry loop exited unexpectedly')
  }

  return retryingFetch
}

export type { RetryOptions as AmigoRetryOptions }
