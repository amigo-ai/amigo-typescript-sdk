import { ConfigurationError } from '../../core/errors'

export interface PlatformWebSocketLike {
  close(code?: number, reason?: string): void
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void
  readonly readyState: number
}

export type PlatformWebSocketConstructor = new (
  url: string,
  protocols?: string | string[]
) => PlatformWebSocketLike

export function webSocketBaseFromHttpBase(baseUrl: string): string {
  const url = new URL(baseUrl)
  if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  } else if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  } else if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new ConfigurationError(`Unsupported Platform API protocol: ${url.protocol}`, 'baseUrl')
  }
  return url.toString().replace(/\/$/, '')
}

export function getWebSocketConstructor(
  override?: PlatformWebSocketConstructor
): PlatformWebSocketConstructor {
  if (override) return override
  if (typeof globalThis.WebSocket === 'function') {
    return globalThis.WebSocket as unknown as PlatformWebSocketConstructor
  }
  throw new ConfigurationError(
    'WebSocket is not available in this runtime; pass WebSocket in the PlatformClient config',
    'WebSocket'
  )
}
