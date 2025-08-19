declare module 'fetch-retry' {
  export default function fetchRetry(
    origFetch: typeof fetch,
    defaults?: Record<string, unknown>
  ): typeof fetch
}
