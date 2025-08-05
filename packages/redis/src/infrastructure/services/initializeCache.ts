import {
  CACHE_DISABLED,
  REDIS_DEFAULT_TTL,
  REDIS_HOST,
  REDIS_PORT,
} from '@pika/environment'

import { setCacheService } from '../../application/decorators/cache.js'
import { ICacheService } from '../../domain/repositories/ICacheService.js'
import { logger } from '../logger.js'
import { MemoryCacheService } from './memory.js'
import { RedisService } from './redis.js'

/**
 * Initialize cache service with proper CACHE_DISABLED checking
 * This is a shared utility to ensure all services handle cache initialization consistently
 */
export async function initializeCache(): Promise<ICacheService> {
  // Re-check the environment variable at runtime to ensure it's properly loaded
  const cacheDisabled =
    process.env.CACHE_DISABLED?.toLowerCase() === 'true' || CACHE_DISABLED

  // Check if cache is disabled
  if (cacheDisabled) {
    logger.info('Cache is disabled via CACHE_DISABLED flag, using memory cache')

    const memoryCache = new MemoryCacheService(REDIS_DEFAULT_TTL)

    await memoryCache.connect()
    setCacheService(memoryCache)

    return memoryCache
  }

  // Try to connect to Redis
  const redisService = new RedisService({
    host: REDIS_HOST,
    port: REDIS_PORT,
    defaultTTL: REDIS_DEFAULT_TTL,
  })

  try {
    await redisService.connect()
    setCacheService(redisService)
    logger.info('Successfully connected to Redis cache')

    return redisService
  } catch (error) {
    logger.warn(
      'Failed to connect to Redis cache, falling back to memory cache:',
      error,
    )

    // Use memory cache as fallback
    const memoryCache = new MemoryCacheService(REDIS_DEFAULT_TTL)

    await memoryCache.connect()
    setCacheService(memoryCache)
    logger.info('Using in-memory cache as fallback')

    return memoryCache
  }
}
