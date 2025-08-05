import { REDIS_PASSWORD } from '@pika/environment'
import { Redis } from 'ioredis'

import { ICacheService } from '../../domain/repositories/ICacheService.js'
import { HealthStatus } from '../../domain/types/cache.js'
import { RedisConfigService } from '../config/redis.js'
import { logger } from '../logger.js'

interface RedisMetrics {
  operations: {
    get: number
    set: number
    delete: number
  }
  errors: number
  latency: {
    avg: number
    p95: number
  }
}

/**
 * Redis Cache Implementation
 *
 * This class provides a Redis-based cache implementation using ioredis.
 * It supports all standard cache operations and includes additional Redis-specific
 * features like pattern-based deletion and TTL management.
 */
export class RedisService implements ICacheService {
  private client: Redis
  private defaultTTL: number
  private config: RedisConfigService
  private metrics: RedisMetrics
  private errorCount: number
  private latencyHistory: number[]

  /**
   * Creates a new RedisService instance
   * @param config - Optional Redis configuration (if not provided, uses environment variables)
   */
  constructor(config?: {
    host: string
    port: number
    defaultTTL?: number
    password?: string
  }) {
    this.config = RedisConfigService.getInstance()

    const redisConfig = this.config.getConfig()

    this.client = new Redis({
      host: config?.host || redisConfig.host,
      port: config?.port || redisConfig.port,
      password: config?.password || REDIS_PASSWORD || undefined,
      lazyConnect: false,
      retryStrategy: (times: number) => {
        const delay = Math.min(
          times * redisConfig.retryDelay,
          redisConfig.maxRetryDelay,
        )

        return delay
      },
    })

    this.defaultTTL = config?.defaultTTL || redisConfig.defaultTTL
    this.metrics = {
      operations: {
        get: 0,
        set: 0,
        delete: 0,
      },
      errors: 0,
      latency: {
        avg: 0,
        p95: 0,
      },
    }
    this.errorCount = 0
    this.latencyHistory = []

    this.client.on('error', (error: Error) => {
      this.errorCount++
      logger.error('Redis Client Error:', error)
    })

    this.client.on('connect', () => {
      logger.info('Redis Client Connected')
    })
  }

  private updateLatency(latency: number): void {
    this.latencyHistory.push(latency)

    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift()
    }

    this.metrics.latency.avg =
      this.latencyHistory.reduce((a, b) => a + b, 0) /
      this.latencyHistory.length

    this.metrics.latency.p95 = this.calculatePercentile(95)
  }

  private calculatePercentile(percentile: number): number {
    if (this.latencyHistory.length === 0) return 0

    const sorted = [...this.latencyHistory].sort((a, b) => a - b)
    const index = Math.min(
      Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1),
      sorted.length - 1,
    )

    return sorted.at(index) ?? 0
  }

  public async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now()

    try {
      await this.client.ping()

      const latency = Date.now() - startTime

      this.updateLatency(latency)

      return {
        status: this.errorCount > 0 ? 'degraded' : 'healthy',
        details: {
          connection: true,
          latency,
          errors: this.errorCount,
        },
      }
    } catch {
      return {
        status: 'unhealthy',
        details: {
          connection: false,
          latency: Date.now() - startTime,
          errors: this.errorCount,
        },
      }
    }
  }

  /**
   * Establishes a connection to Redis
   */
  public async connect(): Promise<void> {
    try {
      logger.info('Attempting to connect to Redis...')

      await this.client.ping()

      logger.info('Redis connection initialized successfully')
      logger.info(
        `Redis configuration: host=${this.client.options.host}, port=${this.client.options.port}`,
      )
    } catch (error) {
      logger.error('Failed to initialize Redis connection:', error)
      throw error
    }
  }

  /**
   * Closes the connection to Redis
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit()

      logger.info('Redis connection closed')
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error)
      throw error
    }
  }

  /**
   * Retrieves a value from Redis
   * @param key - The key to retrieve
   * @returns The cached value or null if not found
   */
  public async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now()

    try {
      logger.debug(`Attempting to get value for key: ${key}`)

      const value = await this.client.get(key)

      this.metrics.operations.get++

      this.updateLatency(Date.now() - startTime)

      if (!value) {
        logger.debug(`No value found for key: ${key}`)

        return null
      }

      try {
        const parsed = JSON.parse(value)

        logger.debug(`Successfully retrieved and parsed value for key: ${key}`)

        return parsed as T
      } catch (parseError) {
        logger.error(`Error parsing cached value for key "${key}":`, parseError)
        logger.error(`Raw value that failed to parse: ${value}`)

        return null
      }
    } catch (error) {
      this.metrics.errors++

      logger.error(`Error retrieving cached value for key "${key}":`, error)

      return null
    }
  }

  /**
   * Stores a value in Redis
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the operation was successful
   */
  public async set(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      logger.debug(`Attempting to set value for key: ${key} with TTL: ${ttl}s`)

      const serializedValue = JSON.stringify(value)
      const result = await this.client.setex(key, ttl, serializedValue)

      this.metrics.operations.set++
      this.updateLatency(Date.now() - startTime)

      logger.debug(`Successfully set value for key: ${key}`)

      return result === 'OK'
    } catch (error) {
      this.metrics.errors++

      logger.error(`Error setting cached value for key "${key}":`, error)

      return false
    }
  }

  /**
   * Stores a value in Redis only if the key doesn't exist
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the value was set, false if key already exists
   */
  public async setNX(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    const startTime = Date.now()

    try {
      logger.debug(
        `Attempting to set value for key (NX): ${key} with TTL: ${ttl}s`,
      )

      const serializedValue = JSON.stringify(value)

      // Use SET with NX option and EX for TTL
      const result = await this.client.set(
        key,
        serializedValue,
        'EX',
        ttl,
        'NX',
      )

      this.metrics.operations.set++
      this.updateLatency(Date.now() - startTime)

      const success = result === 'OK'

      logger.debug(
        `SetNX result for key ${key}: ${success ? 'set' : 'key exists'}`,
      )

      return success
    } catch (error) {
      this.metrics.errors++

      logger.error(`Error setting cached value (NX) for key "${key}":`, error)

      return false
    }
  }

  /**
   * Checks if a key exists in Redis
   * @param key - The key to check
   * @returns True if the key exists
   */
  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)

    return result === 1
  }

  /**
   * Gets the remaining time to live for a key
   * @param key - The key to check
   * @returns The remaining TTL in seconds, -1 if the key exists but has no TTL, -2 if the key doesn't exist
   */
  public async getTTL(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  /**
   * Updates the time to live for a key
   * @param key - The key to update
   * @param ttl - New time to live in seconds
   * @returns True if the operation was successful
   */
  public async updateTTL(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl)

      return result === 1
    } catch (error) {
      logger.error(`Error updating TTL for key "${key}":`, error)

      return false
    }
  }

  /**
   * Deletes a key from Redis
   * @param key - The key to delete
   * @returns True if the key was deleted
   */
  public async del(key: string): Promise<boolean> {
    const startTime = Date.now()

    try {
      const result = await this.client.del(key)

      this.metrics.operations.delete++
      this.updateLatency(Date.now() - startTime)

      return result === 1
    } catch (error) {
      this.metrics.errors++
      logger.error(`Error deleting key "${key}":`, error)

      return false
    }
  }

  /**
   * Deletes all keys matching a pattern using Redis SCAN
   * @param pattern - The pattern to match keys against
   * @returns The number of keys deleted
   */
  public async delPattern(pattern: string): Promise<number> {
    try {
      let cursor = '0'
      let deletedCount = 0

      const redisConfig = this.config.getConfig()

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          redisConfig.scanCount,
        )

        cursor = nextCursor

        if (keys.length > 0) {
          const result = await this.client.del(...keys)

          deletedCount += result
        }
      } while (cursor !== '0')

      return deletedCount
    } catch (error) {
      logger.error(`Error deleting keys matching pattern "${pattern}":`, error)

      return 0
    }
  }

  /**
   * Clears all keys from Redis
   */
  public async clearAll(): Promise<void> {
    try {
      await this.client.flushall()

      logger.info('Redis cache cleared')
    } catch (error) {
      logger.error('Error clearing Redis cache:', error)

      throw error
    }
  }

  /**
   * Lists all keys matching a pattern
   * @param pattern - The pattern to match keys against (default: '*')
   * @returns An array of keys matching the pattern
   */
  public async listKeys(pattern: string = '*'): Promise<string[]> {
    return this.client.keys(pattern)
  }
}
