/**
 * Base error class for all Amigo SDK errors.
 * Provides common functionality and error identification.
 */
export class AmigoError extends Error {
  /**
   * Unique error code for programmatic error handling
   */
  readonly errorCode?: string

  /**
   * HTTP status code if applicable
   */
  readonly statusCode?: number

  /**
   * Additional context data
   */
  context?: Record<string, unknown>

  constructor(message: string, options?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    // copies status, code, etc.
    Object.assign(this, options)
  }

  /**
   * Returns a JSON-serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.errorCode,
      statusCode: this.statusCode,
      context: this.context,
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
    public field?: string
  ) {
    super(message)
    this.context = { field }
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
    super(message, { cause: originalError })
    this.context = { request }
  }
}

/* Parsing errors */
export class ParseError extends AmigoError {
  constructor(
    message: string,
    public readonly parseType: 'json' | 'response' | 'other',
    public readonly originalError?: Error
  ) {
    super(message, { cause: originalError })
    this.context = { parseType }
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

  const ErrorClass = map[response.status] ?? AmigoError
  const message =
    body && typeof body === 'object' && 'message' in body
      ? String((body as any).message)
      : response.statusText

  const options = {
    status: response.status,
    code: body && typeof body === 'object' && 'code' in body ? (body as any).code : undefined,
    response: body,
  }

  const error = new ErrorClass(message, options)

  return error
}
