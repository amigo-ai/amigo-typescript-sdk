import { describe, test, expect } from 'vitest'
import {
  AmigoError,
  createApiError,
  AuthenticationError,
  BadRequestError,
  ValidationError,
  ServerError,
  ServiceUnavailableError,
  ConfigurationError,
  NetworkError,
  ParseError,
  isAmigoError,
} from '../src/core/errors'

describe('SDK Error Tests', () => {
  test('createApiError maps status codes to correct error types', () => {
    const testCases = [
      { status: 401, statusText: 'Unauthorized', expectedType: AuthenticationError },
      { status: 400, statusText: 'Bad Request', expectedType: BadRequestError },
      { status: 422, statusText: 'Unprocessable Entity', expectedType: ValidationError },
      { status: 500, statusText: 'Internal Server Error', expectedType: ServerError },
      { status: 418, statusText: "I'm a teapot", expectedType: AmigoError }, // unknown status
    ]

    testCases.forEach(({ status, statusText, expectedType }) => {
      const response = new Response(null, { status, statusText })
      const error = createApiError(response)
      expect(error).toBeInstanceOf(expectedType)
      expect(error.message).toBe(statusText)
    })

    // Test with JSON body
    const responseWithBody = new Response(null, { status: 500 })
    const bodyWithMessage = { message: 'Custom error', code: 'ERR_CUSTOM' }
    const errorWithBody = createApiError(responseWithBody, bodyWithMessage)
    expect(errorWithBody.message).toBe('Custom error')
    expect((errorWithBody as any).code).toBe('ERR_CUSTOM')
  })

  test('AmigoError serializes to JSON correctly', () => {
    const error = new AmigoError('Test error', { errorCode: 'TEST_CODE', statusCode: 400 })
    error.context = { userId: '123' }

    const json = error.toJSON()
    expect(json).toEqual({
      name: 'AmigoError',
      message: 'Test error',
      code: 'TEST_CODE',
      statusCode: 400,
      context: { userId: '123' },
      stack: expect.any(String),
    })
  })

  test('isAmigoError type guard works correctly', () => {
    // Should return true for AmigoError instances
    expect(isAmigoError(new AmigoError('test'))).toBe(true)
    expect(isAmigoError(new AuthenticationError('test'))).toBe(true)
    expect(isAmigoError(new ConfigurationError('test', 'field'))).toBe(true)

    // Should return false for other types
    expect(isAmigoError(new Error('test'))).toBe(false)
    expect(isAmigoError(null)).toBe(false)
    expect(isAmigoError('string')).toBe(false)
  })

  test('error inheritance chain works correctly', () => {
    const validationError = new ValidationError('Validation failed')
    expect(validationError instanceof ValidationError).toBe(true)
    expect(validationError instanceof BadRequestError).toBe(true)
    expect(validationError instanceof AmigoError).toBe(true)

    const serviceError = new ServiceUnavailableError('Service down')
    expect(serviceError instanceof ServiceUnavailableError).toBe(true)
    expect(serviceError instanceof ServerError).toBe(true)
    expect(serviceError instanceof AmigoError).toBe(true)
  })

  test('specialized error constructors work correctly', () => {
    // ConfigurationError
    const configError = new ConfigurationError('Missing API key', 'apiKey')
    expect(configError.field).toBe('apiKey')
    expect(configError.context).toEqual({ field: 'apiKey' })

    // NetworkError
    const originalError = new Error('Connection failed')
    const networkError = new NetworkError('Network error', originalError, {
      url: 'https://api.com',
    })
    expect(networkError.originalError).toBe(originalError)
    expect(networkError.context).toEqual({ request: { url: 'https://api.com' } })

    // ParseError
    const parseError = new ParseError('Parse failed', 'json', originalError)
    expect(parseError.parseType).toBe('json')
    expect(parseError.context).toEqual({ parseType: 'json' })

    // ValidationError
    const validationError = new ValidationError('Invalid data', { email: 'Invalid format' })
    expect(validationError.fieldErrors).toEqual({ email: 'Invalid format' })
  })
})
