import {
  NODE_ENV,
  STORAGE_PROVIDER_FALLBACK,
  STORAGE_PROVIDER_PRIMARY,
} from '@pika/environment'
import { logger } from '@pika/shared'

import { AwsS3Provider } from './AwsS3Provider.js'
import { ConsoleStorageProvider } from './ConsoleStorageProvider.js'
import type { StorageProvider } from './StorageProvider.js'

export interface ProviderConfig {
  environment: 'development' | 'staging' | 'production' | 'test'
  storage?: {
    primary?: 'aws-s3' | 's3' | 'console'
    fallback?: 'aws-s3' | 's3' | 'console'
    aws?: {
      region?: string
      accessKeyId?: string
      secretAccessKey?: string
      bucketName?: string
      endpoint?: string // For MinIO/LocalStack
    }
  }
}

export class ProviderFactory {
  private storageProviders: Map<string, StorageProvider> = new Map()
  private config: ProviderConfig
  private cachedProvider: StorageProvider | null = null

  constructor(config: ProviderConfig) {
    this.config = config
    this.initializeProviders()
  }

  private initializeProviders(): void {
    // Initialize storage providers based on environment
    if (NODE_ENV === 'development' || NODE_ENV === 'test') {
      // In development/test, use local/console providers by default
      this.storageProviders.set('console', new ConsoleStorageProvider())
    }

    // Initialize S3 provider if configured
    if (this.config.storage?.aws) {
      const s3Config = {
        ...this.config.storage.aws,
        endpoint: this.config.storage.aws.endpoint,
      }

      // Add providerName for dev/test environments
      if (this.config.environment !== 'production') {
        Object.assign(s3Config, { providerName: 'aws_s3' })
      }

      this.storageProviders.set('aws-s3', new AwsS3Provider(s3Config))

      if (this.config.environment !== 'production') {
        logger.debug('Initialized AWS S3 provider for test/dev', {
          endpoint: this.config.storage.aws.endpoint,
          bucket: this.config.storage.aws.bucketName,
        })
      }

      // Always have console as ultimate fallback
      this.storageProviders.set('console', new ConsoleStorageProvider())
    }
  }

  async getStorageProvider(): Promise<StorageProvider> {
    // Return cached provider if available and still working
    if (this.cachedProvider) {
      try {
        // Quick check if cached provider is still available
        if (await this.cachedProvider.isAvailable()) {
          return this.cachedProvider
        }
      } catch {
        // If check fails, clear cache and continue with normal selection
        this.cachedProvider = null
      }
    }

    // Use environment constants for provider selection
    const primaryName = STORAGE_PROVIDER_PRIMARY
    const fallbackName = STORAGE_PROVIDER_FALLBACK

    // Try primary provider (handle minio as alias for aws-s3)
    const primaryProviderName = primaryName === 'minio' ? 'aws-s3' : primaryName

    let primary = this.storageProviders.get(primaryProviderName)

    // If using minio and we have AWS config, create a minio-specific provider
    if (primaryName === 'minio' && this.config.storage?.aws && !primary) {
      primary = new AwsS3Provider({
        ...this.config.storage.aws,
        endpoint: this.config.storage.aws.endpoint,
        providerName: 'minio',
      })
      this.storageProviders.set('minio-instance', primary)
    }

    if (primary && (await primary.isAvailable())) {
      logger.info('Using primary storage provider', { provider: primaryName })
      this.cachedProvider = primary

      return primary
    }

    // Try fallback provider (handle local as alias for console)
    const fallbackProviderName =
      fallbackName === 'local'
        ? 'console'
        : fallbackName === 'minio'
          ? 'aws-s3'
          : fallbackName
    const fallback = this.storageProviders.get(fallbackProviderName)

    if (fallback && (await fallback.isAvailable())) {
      logger.warn('Primary storage provider unavailable, using fallback', {
        primary: primaryName,
        fallback: fallbackName,
      })
      this.cachedProvider = fallback

      return fallback
    }

    // Ultimate fallback - console provider
    const console = this.storageProviders.get('console')

    if (console) {
      logger.warn('All storage providers unavailable, using console', {
        attempted: [primaryName, fallbackName],
      })
      this.cachedProvider = console

      return console
    }

    throw new Error('No storage providers available')
  }

  private getDefaultStorageProvider(): string {
    switch (NODE_ENV) {
      case 'development':
      case 'test':
        return 's3'
      case 'staging':
      case 'production':
        return 's3'
      default:
        return 'console'
    }
  }

  // Test helper methods
  async testStorageProvider(providerName: string): Promise<boolean> {
    const provider = this.storageProviders.get(providerName)

    if (!provider) {
      return false
    }

    return provider.isAvailable()
  }

  getAvailableProviders(): {
    storage: string[]
  } {
    return {
      storage: Array.from(this.storageProviders.keys()),
    }
  }

  // Clear cached provider - useful for testing
  clearCache(): void {
    this.cachedProvider = null
  }

  // Get the primary provider synchronously (for legacy compatibility)
  getPrimaryProvider(): StorageProvider {
    const primaryName = STORAGE_PROVIDER_PRIMARY
    const primaryProviderName = primaryName === 'minio' ? 'aws-s3' : primaryName
    const provider = this.storageProviders.get(primaryProviderName)

    if (!provider) {
      const fallbackName = STORAGE_PROVIDER_FALLBACK
      const fallbackProviderName =
        fallbackName === 'local'
          ? 'console'
          : fallbackName === 'minio'
            ? 'aws-s3'
            : fallbackName
      const fallback = this.storageProviders.get(fallbackProviderName)

      if (fallback) {
        return fallback
      }

      // Ultimate fallback
      const console = this.storageProviders.get('console')

      if (console) {
        return console
      }

      throw new Error('No storage providers available')
    }

    return provider
  }

  // Get the current config
  getConfig(): ProviderConfig {
    return this.config
  }
}
