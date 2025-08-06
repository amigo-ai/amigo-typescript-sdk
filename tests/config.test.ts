import { describe, it, expect } from 'vitest'
import { AmigoClient, AmigoSdkConfig } from '../src/index'
import { ConfigurationError } from '../src/core/errors'

describe('AmigoClient Configuration', () => {
  const validConfig: AmigoSdkConfig = {
    apiKey: 'test-api-key',
    apiKeyId: 'test-api-key-id',
    userId: 'test-user-id',
    orgId: 'test-org-id',
  }

  describe('Configuration Validation', () => {
    it('should throw ConfigurationError when apiKey is missing', () => {
      const invalidConfig = { ...validConfig }
      delete (invalidConfig as any).apiKey

      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow('API key is required')
    })

    it('should throw ConfigurationError when apiKey is empty string', () => {
      const invalidConfig = { ...validConfig, apiKey: '' }

      expect(() => new AmigoClient(invalidConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig)).toThrow('API key is required')
    })

    it('should throw ConfigurationError when apiKeyId is missing', () => {
      const invalidConfig = { ...validConfig }
      delete (invalidConfig as any).apiKeyId

      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(
        'API key ID is required'
      )
    })

    it('should throw ConfigurationError when apiKeyId is empty string', () => {
      const invalidConfig = { ...validConfig, apiKeyId: '' }

      expect(() => new AmigoClient(invalidConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig)).toThrow('API key ID is required')
    })

    it('should throw ConfigurationError when userId is missing', () => {
      const invalidConfig = { ...validConfig }
      delete (invalidConfig as any).userId

      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow('User ID is required')
    })

    it('should throw ConfigurationError when userId is empty string', () => {
      const invalidConfig = { ...validConfig, userId: '' }

      expect(() => new AmigoClient(invalidConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig)).toThrow('User ID is required')
    })

    it('should throw ConfigurationError when orgId is missing', () => {
      const invalidConfig = { ...validConfig }
      delete (invalidConfig as any).orgId

      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig as AmigoSdkConfig)).toThrow(
        'Organization ID is required'
      )
    })

    it('should throw ConfigurationError when orgId is empty string', () => {
      const invalidConfig = { ...validConfig, orgId: '' }

      expect(() => new AmigoClient(invalidConfig)).toThrow(ConfigurationError)
      expect(() => new AmigoClient(invalidConfig)).toThrow('Organization ID is required')
    })

    it('should include field name in ConfigurationError context', () => {
      try {
        const invalidConfig = { ...validConfig, apiKey: '' }
        new AmigoClient(invalidConfig)
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigurationError)
        expect((error as ConfigurationError).field).toBe('apiKey')
        expect((error as ConfigurationError).context).toEqual({ field: 'apiKey' })
      }
    })
  })

  describe('Default Values', () => {
    it('should use default baseUrl when not provided', () => {
      const client = new AmigoClient(validConfig)

      expect(client.config.baseUrl).toBe('https://api.amigo.ai')
    })

    it('should preserve custom baseUrl when provided', () => {
      const customConfig = { ...validConfig, baseUrl: 'https://custom.api.amigo.ai' }
      const client = new AmigoClient(customConfig)

      expect(client.config.baseUrl).toBe('https://custom.api.amigo.ai')
    })

    it('should not overwrite custom baseUrl with default', () => {
      const customConfig = { ...validConfig, baseUrl: 'http://localhost:3000' }
      const client = new AmigoClient(customConfig)

      expect(client.config.baseUrl).toBe('http://localhost:3000')
      expect(client.config.baseUrl).not.toBe('https://api.amigo.ai')
    })
  })

  describe('Valid Configuration', () => {
    it('should successfully create client with valid config', () => {
      expect(() => new AmigoClient(validConfig)).not.toThrow()
    })

    it('should save valid config to client class', () => {
      const client = new AmigoClient(validConfig)

      expect(client.config).toEqual({
        ...validConfig,
        baseUrl: 'https://api.amigo.ai',
      })
    })

    it('should preserve all provided config values', () => {
      const customConfig = {
        ...validConfig,
        baseUrl: 'https://staging.amigo.ai',
      }
      const client = new AmigoClient(customConfig)

      expect(client.config.apiKey).toBe(customConfig.apiKey)
      expect(client.config.apiKeyId).toBe(customConfig.apiKeyId)
      expect(client.config.userId).toBe(customConfig.userId)
      expect(client.config.orgId).toBe(customConfig.orgId)
      expect(client.config.baseUrl).toBe(customConfig.baseUrl)
    })

    it('should initialize resource objects', () => {
      const client = new AmigoClient(validConfig)

      expect(client.organizations).toBeDefined()
      expect(client.services).toBeDefined()
      expect(typeof client.organizations).toBe('object')
      expect(typeof client.services).toBe('object')
    })

    it('should make config accessible', () => {
      const client = new AmigoClient(validConfig)

      expect(client.config).toBeDefined()
      expect(client.config).toBeInstanceOf(Object)

      // Config should be accessible but the client class has readonly modifier for TypeScript
      // At runtime the config property is accessible
      expect(typeof client.config.apiKey).toBe('string')
      expect(typeof client.config.apiKeyId).toBe('string')
      expect(typeof client.config.userId).toBe('string')
      expect(typeof client.config.orgId).toBe('string')
    })
  })
})
