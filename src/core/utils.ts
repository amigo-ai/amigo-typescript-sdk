import { ParseError } from './errors'

// Type helper to extract the data type from openapi-fetch responses
export type ExtractDataType<T> = T extends { data?: infer D } ? NonNullable<D> : never

// Helper function to extract data from openapi-fetch responses
// Since our middleware throws on errors, successful responses will have data
export async function extractData<T extends { data?: unknown }>(
  responsePromise: Promise<T>
): Promise<ExtractDataType<T>> {
  const result = await responsePromise
  const data = (result as { data?: ExtractDataType<T> }).data

  if (data === undefined || data === null) {
    // Invariant: our error middleware throws for non-2xx responses.
    // If we reach here without data, treat as a parse/protocol error.
    throw new ParseError('Expected response data to be present for successful request', 'response')
  }

  return data
}

/**
 * Parse an NDJSON HTTP response body into an async generator of parsed JSON objects.
 * The generator yields one parsed object per line. Empty lines are skipped.
 */
export async function* parseNdjsonStream<T = unknown>(response: Response): AsyncGenerator<T> {
  const body = response.body
  if (!body) return

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let bufferedText = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bufferedText += decoder.decode(value, { stream: true })

      let newlineIndex: number
      // Process all complete lines in the buffer
      while ((newlineIndex = bufferedText.indexOf('\n')) !== -1) {
        const line = bufferedText.slice(0, newlineIndex).trim()
        bufferedText = bufferedText.slice(newlineIndex + 1)
        if (!line) continue
        try {
          yield JSON.parse(line) as T
        } catch (err) {
          throw new ParseError('Failed to parse NDJSON line', 'json', err as Error)
        }
      }
    }

    // Flush any trailing line without a newline
    const trailing = bufferedText.trim()
    if (trailing) {
      try {
        yield JSON.parse(trailing) as T
      } catch (err) {
        throw new ParseError('Failed to parse trailing NDJSON line', 'json', err as Error)
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// Utility function to safely parse response bodies without throwing errors
export async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text()
    if (!text) return undefined
    try {
      return JSON.parse(text)
    } catch {
      return text // Return as string if not valid JSON
    }
  } catch {
    return undefined // Return undefined if any error occurs
  }
}

// Helper to detect network-related errors
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return (
    error instanceof TypeError ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('network')
  )
}
