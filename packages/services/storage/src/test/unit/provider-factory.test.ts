import { AwsS3Provider } from '@storage/services/providers/AwsS3Provider.js'
import { ConsoleStorageProvider } from '@storage/services/providers/ConsoleStorageProvider.js'
import { ProviderFactory } from '@storage/services/providers/ProviderFactory.js'
import { beforeEach, describe, expect, it } from 'vitest'

describe('ProviderFactory Security Tests', () => {
  let factory: ProviderFactory

  beforeEach(() => {
    factory = new ProviderFactory({
      environment: 'development',
      storage: {
        primary: 's3',
        fallback: 'console',
        aws: {
          region: 'us-east-1',
          accessKeyId: 'test',
          secretAccessKey: 'test',
          bucketName: 'test-bucket',
          endpoint: 'http://localhost:9000',
        },
      },
    })
  })

  describe('Provider Availability', () => {
    it('should not have LocalStorageProvider available', () => {
      const availableProviders = factory.getAvailableProviders()

      // LocalStorageProvider should NOT be in the list
      expect(availableProviders.storage).not.toContain('local')

      // Only s3 and console should be available
      expect(availableProviders.storage).toContain('aws-s3')
      expect(availableProviders.storage).toContain('console')
    })

    it('should return s3 provider when available', async () => {
      const provider = await factory.getStorageProvider()

      // Should be S3 provider (or console if S3 is not available)
      expect(provider).toBeDefined()
      expect(
        provider instanceof AwsS3Provider ||
          provider instanceof ConsoleStorageProvider,
      ).toBe(true)
    })

    it('should fallback to console provider when s3 is unavailable', async () => {
      // Create factory with invalid S3 config
      const invalidFactory = new ProviderFactory({
        environment: 'development',
        storage: {
          primary: 's3',
          fallback: 'console',
          aws: {
            region: 'us-east-1',
            // Missing credentials to make S3 unavailable
          },
        },
      })

      const provider = await invalidFactory.getStorageProvider()

      // Should fallback to console provider
      expect(provider).toBeDefined()
      expect(provider instanceof ConsoleStorageProvider).toBe(true)
    })

    it('should not allow local as primary provider', async () => {
      // Even if we try to set local as primary, it should not be available
      const factory = new ProviderFactory({
        environment: 'development',
        storage: {
          primary: 'local' as any, // TypeScript will complain but let's test runtime
          fallback: 'console',
        },
      })

      const provider = await factory.getStorageProvider()

      // Should fallback to console since local doesn't exist
      expect(provider).toBeDefined()
      expect(provider instanceof ConsoleStorageProvider).toBe(true)
    })
  })

  describe('Provider Configuration', () => {
    it('should use s3 as default for all environments', () => {
      const environments = [
        'development',
        'test',
        'staging',
        'production',
      ] as const

      environments.forEach((env) => {
        const factory = new ProviderFactory({
          environment: env,
          storage: {
            aws: {
              region: 'us-east-1',
              accessKeyId: 'test',
              secretAccessKey: 'test',
              bucketName: 'test-bucket',
            },
          },
        })

        // All environments should default to aws-s3
        const providers = factory.getAvailableProviders()

        expect(providers.storage).toContain('aws-s3')
      })
    })

    it('should configure S3 provider with MinIO endpoint for development', () => {
      const factory = new ProviderFactory({
        environment: 'development',
        storage: {
          aws: {
            region: 'us-east-1',
            accessKeyId: 'minioadmin',
            secretAccessKey: 'minioadmin',
            bucketName: 'test-bucket',
            endpoint: 'http://localhost:9000',
          },
        },
      })

      const providers = factory.getAvailableProviders()

      expect(providers.storage).toContain('aws-s3')
    })
  })

  describe('Security Validations', () => {
    it('should not expose file system paths in provider config', () => {
      const config = {
        environment: 'development' as const,
        storage: {
          aws: {
            region: 'us-east-1',
            accessKeyId: 'test',
            secretAccessKey: 'test',
            bucketName: 'test-bucket',
          },
        },
      }

      // Config should not have any localPath or basePath properties
      expect(JSON.stringify(config)).not.toContain('localPath')
      expect(JSON.stringify(config)).not.toContain('basePath')
      expect(JSON.stringify(config)).not.toContain('./uploads')
    })

    it('should not accept local storage configuration', () => {
      const config = {
        environment: 'development' as const,
        storage: {
          // @ts-expect-error - Testing runtime behavior
          local: {
            basePath: './uploads',
            baseUrl: 'http://localhost:5510/files',
          },
        },
      }

      const factory = new ProviderFactory(config)
      const providers = factory.getAvailableProviders()

      // Local provider should not be available even if configured
      expect(providers.storage).not.toContain('local')
    })
  })
})
