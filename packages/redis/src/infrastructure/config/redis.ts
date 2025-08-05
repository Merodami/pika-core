import { RedisConfig } from '../../domain/types/cache.js'

/**
 * Redis Configuration Service
 *
 * This service provides Redis configuration based on environment variables.
 * It includes validation and default values for required settings.
 */
export class RedisConfigService {
  private static instance: RedisConfigService
  private config: RedisConfig

  private constructor() {
    this.config = this.loadConfig()
  }

  /**
   * Gets the singleton instance of RedisConfigService
   */
  public static getInstance(): RedisConfigService {
    if (!RedisConfigService.instance) {
      RedisConfigService.instance = new RedisConfigService()
    }

    return RedisConfigService.instance
  }

  /**
   * Gets the current Redis configuration
   */
  public getConfig(): RedisConfig {
    return this.config
  }

  /**
   * Loads and validates Redis configuration from environment variables
   */
  private loadConfig(): RedisConfig {
    const host = process.env.REDIS_HOST || 'localhost'
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10)
    const defaultTTL = parseInt(process.env.REDIS_DEFAULT_TTL ?? '3600', 10)
    const retryDelay = parseInt(process.env.REDIS_RETRY_DELAY ?? '50', 10)
    const maxRetryDelay = parseInt(
      process.env.REDIS_MAX_RETRY_DELAY ?? '2000',
      10,
    )
    const scanCount = 100 // Default value for SCAN operation

    return {
      host,
      port,
      defaultTTL,
      retryDelay,
      maxRetryDelay,
      scanCount,
    }
  }
}
