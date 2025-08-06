import { ParseError } from './errors'

// Type helper to extract the data type from openapi-fetch responses
export type ExtractDataType<T> = T extends { data?: infer D } ? D : never

// Helper function to extract data from openapi-fetch responses
// Since our middleware throws on errors, successful responses will have data
export async function extractData<T>(responsePromise: Promise<T>): Promise<ExtractDataType<T>> {
  const result = await responsePromise
  // openapi-fetch guarantees data exists on successful responses
  return (result as { data: ExtractDataType<T> }).data
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
