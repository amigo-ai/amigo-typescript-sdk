import type { Middleware } from 'openapi-fetch'
import { isNetworkError, parseResponseBody } from './utils'

/** Fields that may contain sensitive tokens or credentials. */
const SENSITIVE_FIELDS = new Set([
  'id_token',
  'access_token',
  'refresh_token',
  'authorization',
  'api_key',
  'apikey',
  'token',
  'secret',
  'password',
  'x-api-key',
])

/**
 * Recursively strips sensitive fields from an object to prevent token leakage in error contexts.
 * Returns a shallow copy with sensitive keys replaced by '[REDACTED]'.
 */
export function sanitizeErrorContext(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeErrorContext)

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeErrorContext(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Base error class for all Amigo SDK errors.
 * Provides common functionality and error identification.
 */
export class AmigoError extends Error {
  /** Unique error code for programmatic error handling */
  readonly errorCode?: string

  /** HTTP status code if applicable */
  readonly statusCode?: number

  /** Additional context data */
  readonly context?: Record<string, unknown>

  constructor(
    message: string,
    options?: { statusCode?: number; errorCode?: string; context?: Record<string, unknown> }
  ) {
    super(message)
    this.name = this.constructor.name

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    this.statusCode = options?.statusCode
    this.errorCode = options?.errorCode
    this.context = options?.context
  }

  /**
   * Returns a JSON-serializable representation of the error.
   * Sensitive fields (tokens, keys) are redacted to prevent leakage.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.errorCode,
      statusCode: this.statusCode,
      context: sanitizeErrorContext(this.context) as Record<string, unknown> | undefined,
      stack: this.stack,
    }
  }
}

/* 4xx client errors */
export class BadRequestError extends AmigoError {}
export class AuthenticationError extends AmigoError {}
export class PermissionError extends AmigoError {}
export class NotFoundError extends AmigoError {}
export class ConflictError extends AmigoError {}
export class RateLimitError extends AmigoError {}

/* 5xx server errors */
export class ServerError extends AmigoError {}
export class ServiceUnavailableError extends ServerError {}

/* Internal SDK errors */
export class ConfigurationError extends AmigoError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, { context: { field } })
  }
}

/* Validation errors */
export class ValidationError extends BadRequestError {
  constructor(
    msg: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(msg)
  }
}

/* Network-related errors */
export class NetworkError extends AmigoError {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly request?: {
      url?: string
      method?: string
    }
  ) {
    super(message, { context: { request } })
  }
}

/* Parsing errors */
export class ParseError extends AmigoError {
  constructor(
    message: string,
    public readonly parseType: 'json' | 'response' | 'other',
    public readonly originalError?: Error
  ) {
    super(message, { context: { parseType } })
  }
}

/* Type guard functions */
export function isAmigoError(error: unknown): error is AmigoError {
  return error instanceof AmigoError
}

/* Error factory to create appropriate error instances from API responses */
export function createApiError(response: Response, body?: unknown): AmigoError {
  const map: Record<number, typeof AmigoError> = {
    400: BadRequestError,
    401: AuthenticationError,
    403: PermissionError,
    404: NotFoundError,
    409: ConflictError,
    422: ValidationError,
    429: RateLimitError,
    500: ServerError,
    503: ServiceUnavailableError,
  }

  const errorMessageKeys = ['message', 'error', 'detail']

  const ErrorClass = map[response.status] ?? AmigoError
  let message = `HTTP ${response.status} ${response.statusText}`

  if (body && typeof body === 'object') {
    for (const key of errorMessageKeys) {
      if (key in body) {
        message = String((body as Record<string, unknown>)[key])
        break
      }
    }
  }

  const error = new ErrorClass(message, {
    statusCode: response.status,
    errorCode:
      body && typeof body === 'object' && 'code' in body
        ? String((body as Record<string, unknown>).code)
        : undefined,
    context: { response: sanitizeErrorContext(body) },
  })

  return error
}

export function createErrorMiddleware(): Middleware {
  return {
    onResponse: async ({ response }) => {
      if (!response.ok) {
        const body = await parseResponseBody(response)
        throw createApiError(response, body)
      }
    },
    onError: async ({ error, request }) => {
      // Handle network-related errors consistently
      if (isNetworkError(error)) {
        throw new NetworkError(
          `Network error: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            url: request?.url,
            method: request?.method,
          }
        )
      }
      throw error
    },
  }
}
