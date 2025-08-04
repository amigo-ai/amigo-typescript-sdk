/**
 * Base error class for all Amigo SDK errors.
 * Provides common functionality and error identification.
 */
export abstract class AmigoError extends Error {
  /**
   * Unique error code for programmatic error handling
   */
  abstract code: string

  /**
   * HTTP status code if applicable
   */
  statusCode?: number

  /**
   * Additional context data
   */
  context?: Record<string, unknown>

  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = this.constructor.name

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Returns a JSON-serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    }
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends AmigoError {
  code = 'CONFIGURATION_ERROR'

  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.context = { field }
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends AmigoError {
  code = 'AUTHENTICATION_ERROR'
  statusCode = 401

  constructor(
    message: string,
    public readonly reason?: 'invalid_token' | 'expired_token' | 'missing_credentials'
  ) {
    super(message)
    this.context = { reason }
  }
}

export class AuthorizationError extends AmigoError {
  code = 'AUTHORIZATION_ERROR'
  statusCode = 403

  constructor(
    message: string,
    public readonly permission?: string
  ) {
    super(message)
    this.context = { permission }
  }
}

/**
 * API request/response errors
 */
export class ApiError extends AmigoError {
  code = 'API_ERROR'

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: {
      body?: unknown
      headers?: Record<string, string>
    }
  ) {
    super(message)
    this.context = { response }
  }
}

/**
 * Specific API error types
 */
export class BadRequestError extends ApiError {
  code = 'BAD_REQUEST'

  constructor(
    message: string,
    public readonly errors?: Array<{
      field?: string
      message: string
      code?: string
    }>,
    response?: ApiError['response']
  ) {
    super(message, 400, response)
    this.context = { ...this.context, errors }
  }
}

export class NotFoundError extends ApiError {
  code = 'NOT_FOUND'

  constructor(
    message: string,
    public readonly resource?: string,
    public readonly id?: string,
    response?: ApiError['response']
  ) {
    super(message, 404, response)
    this.context = { ...this.context, resource, id }
  }
}

export class ConflictError extends ApiError {
  code = 'CONFLICT'

  constructor(
    message: string,
    public readonly conflictType?: string,
    response?: ApiError['response']
  ) {
    super(message, 409, response)
    this.context = { ...this.context, conflictType }
  }
}

export class RateLimitError extends ApiError {
  code = 'RATE_LIMIT'

  constructor(message: string, response?: ApiError['response']) {
    super(message, 429, response)
  }
}

export class InternalServerError extends ApiError {
  code = 'INTERNAL_SERVER_ERROR'

  constructor(message: string, response?: ApiError['response']) {
    super(message, 500, response)
  }
}

export class ServiceUnavailableError extends ApiError {
  code = 'SERVICE_UNAVAILABLE'

  constructor(message: string, response?: ApiError['response']) {
    super(message, 503, response)
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AmigoError {
  code = 'NETWORK_ERROR'

  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly request?: {
      url?: string
      method?: string
    }
  ) {
    super(message, { cause: originalError })
    this.context = { request }
  }
}

export class TimeoutError extends NetworkError {
  code = 'TIMEOUT'

  constructor(
    message: string,
    public readonly timeout: number,
    originalError?: Error,
    request?: NetworkError['request']
  ) {
    super(message, originalError, request)
    this.context = { ...this.context, timeout }
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AmigoError {
  code = 'VALIDATION_ERROR'

  constructor(
    message: string,
    public readonly errors: Array<{
      field: string
      message: string
      value?: unknown
    }>
  ) {
    super(message)
    this.context = { errors }
  }
}

/**
 * Parsing errors
 */
export class ParseError extends AmigoError {
  code = 'PARSE_ERROR'

  constructor(
    message: string,
    public readonly parseType: 'json' | 'response' | 'other',
    public readonly originalError?: Error
  ) {
    super(message, { cause: originalError })
    this.context = { parseType }
  }
}

/**
 * Type guard functions
 */
export function isAmigoError(error: unknown): error is AmigoError {
  return error instanceof AmigoError
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}

/**
 * Error factory to create appropriate error instances from API responses
 */
export function createApiError(response: Response, body?: unknown): ApiError {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })

  const responseData = { body, headers }

  switch (response.status) {
    case 400:
      return new BadRequestError('Bad request', parseValidationErrors(body), responseData)

    case 401:
      return new AuthenticationError('Authentication failed')

    case 403:
      return new AuthorizationError('Access forbidden')

    case 404:
      return new NotFoundError('Resource not found', undefined, undefined, responseData)

    case 409:
      return new ConflictError('Resource conflict', undefined, responseData)

    case 429:
      return new RateLimitError(
        'Rate limit exceeded. Please reduce request frequency and try again later.',
        responseData
      )

    case 500:
      return new InternalServerError('Internal server error', responseData)

    case 503:
      return new ServiceUnavailableError(
        'The service is temporarily unavailable. Please try again later.',
        responseData
      )

    default:
      return new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData
      )
  }
}

/**
 * Helper to parse validation errors from API response
 */
function parseValidationErrors(body: unknown): BadRequestError['errors'] | undefined {
  if (!body || typeof body !== 'object') return undefined

  const obj = body as Record<string, unknown>

  // Handle common error response formats
  if (Array.isArray(obj.errors)) {
    return obj.errors.map(err => ({
      field: err.field || err.path,
      message: err.message || err.detail,
      code: err.code,
    }))
  }

  if (obj.detail && typeof obj.detail === 'string') {
    return [{ message: obj.detail }]
  }

  return undefined
}
