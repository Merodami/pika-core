import { CACHE_DISABLED } from '@pika/environment'

import { ICacheService } from '../../domain/repositories/ICacheService.js'
import { CacheOptions } from '../../domain/types/cache.js'
import { defaultKeyGenerator } from '../../infrastructure/cache/keygen.js'
import { logger } from '../../infrastructure/logger.js'

// Global cache service reference that will be set during app initialization
let globalCacheService: ICacheService | null = null

/**
 * Sets the global cache service instance for decorators to use
 * @param cacheService - The cache service implementation to use
 */
export function setCacheService(cacheService: ICacheService): void {
  globalCacheService = cacheService

  if (CACHE_DISABLED) {
    logger.info(
      'Cache service configured but caching is DISABLED via CACHE_DISABLED flag',
    )
  } else {
    logger.info('Cache service configured for decorators')
  }
}

/**
 * Check if the cache service is available and not disabled
 * @param className - The name of the class for logging
 * @param methodName - The name of the method for logging
 * @returns true if cache service is available and not disabled, false otherwise
 */
function isCacheServiceAvailable(
  className: string,
  methodName: string,
): boolean {
  // Check if cache is explicitly disabled via environment variable
  if (CACHE_DISABLED) {
    logger.debug(
      `Cache is disabled via CACHE_DISABLED for ${className}.${methodName}, bypassing cache`,
    )

    return false
  }

  // Check if cache service is available
  if (!globalCacheService) {
    logger.warn(
      `Cache service not available for ${className}.${methodName}, bypassing cache`,
    )

    return false
  }

  return true
}

/**
 * Generates a cache key based on method arguments
 * @param options - Cache options
 * @param methodName - The method name
 * @param args - The method arguments
 * @returns The generated cache key
 */
function generateCacheKey(
  options: CacheOptions,
  methodName: string,
  args: any[],
): string {
  const generator = options.keyGenerator ?? defaultKeyGenerator

  return generator(options.prefix, methodName, args)
}

/**
 * Handles a cache hit scenario
 * @param cacheKey - The cache key
 * @param startTime - The start time of the operation
 * @param options - Cache options
 * @param className - The class name for logging
 * @param methodName - The method name for logging
 * @param instance - The class instance
 * @param originalMethod - The original method
 * @param args - Method arguments
 * @returns The cached result
 */
async function handleCacheHit<T>(
  cacheKey: string,
  startTime: number,
  options: CacheOptions,
  className: string,
  methodName: string,
  instance: any,
  originalMethod: (...methodArgs: any[]) => Promise<T>,
  args: any[],
  cachedResult: T,
): Promise<T> {
  const execTime = Date.now() - startTime

  // Call onCacheHit callback if provided
  if (options.onCacheHit) {
    options.onCacheHit(cacheKey, execTime)
  }

  logger.debug(
    `Cache hit for ${className}.${methodName} [${cacheKey}] in ${execTime}ms`,
  )

  // If using stale-while-revalidate, refresh the cache in the background
  if (options.staleWhileRevalidate) {
    refreshCacheInBackground(
      instance,
      originalMethod,
      args,
      cacheKey,
      options,
    ).catch((err) => logger.error(`Background cache refresh failed: ${err}`))
  }

  return cachedResult
}

/**
 * Handles a cache miss scenario
 * @param cacheKey - The cache key
 * @param startTime - The start time of the operation
 * @param options - Cache options
 * @param className - The class name for logging
 * @param methodName - The method name for logging
 * @param instance - The class instance
 * @param originalMethod - The original method
 * @param args - Method arguments
 * @returns The result from executing the original method
 */
async function handleCacheMiss<T>(
  cacheKey: string,
  startTime: number,
  options: CacheOptions,
  className: string,
  methodName: string,
  instance: any,
  originalMethod: (...methodArgs: any[]) => Promise<T>,
  args: any[],
): Promise<T> {
  // Execute the original method
  const result = await originalMethod.apply(instance, args)
  const execTime = Date.now() - startTime

  // Call onCacheMiss callback if provided
  if (options.onCacheMiss) {
    options.onCacheMiss(cacheKey, execTime)
  }

  logger.debug(
    `Cache miss for ${className}.${methodName} [${cacheKey}] in ${execTime}ms`,
  )

  // Cache the result if it matches the condition (or if no condition specified)
  if (!options.condition || options.condition(result)) {
    await globalCacheService?.set(cacheKey, result, options.ttl)

    logger.debug(`Cached result for ${cacheKey} with TTL ${options.ttl}s`)
  }

  return result
}

/**
 * Refreshes the cache in the background (for stale-while-revalidate pattern)
 * @param instance - The class instance
 * @param method - The original method
 * @param args - Method arguments
 * @param key - The cache key
 * @param options - Cache options
 */
async function refreshCacheInBackground<T>(
  instance: any,
  method: (...methodArgs: any[]) => Promise<T>,
  args: any[],
  key: string,
  options: CacheOptions,
): Promise<void> {
  try {
    const freshResult = await method.apply(instance, args)

    if (!options.condition || options.condition(freshResult)) {
      await globalCacheService?.set(key, freshResult, options.ttl)

      logger.debug(`Background refresh of ${key} complete`)
    }
  } catch (error) {
    logger.error(`Failed to refresh cache for ${key}: ${error}`)
  }
}

/**
 * Handles cache operation errors
 * @param error - The error that occurred
 * @param cacheKey - The cache key
 * @param className - The class name for logging
 * @param methodName - The method name for logging
 * @param instance - The class instance
 * @param originalMethod - The original method
 * @param args - Method arguments
 * @returns The result from executing the original method
 */
async function handleCacheError<T>(
  error: unknown,
  cacheKey: string,
  className: string,
  methodName: string,
  instance: any,
  originalMethod: (...methodArgs: any[]) => Promise<T>,
  args: any[],
): Promise<T> {
  const errorMessage = error instanceof Error ? error.message : String(error)

  logger.error(
    `Cache error for ${className}.${methodName} [${cacheKey}]: ${errorMessage}`,
    error instanceof Error ? error.stack : undefined,
  )

  // On cache error, fallback to original method
  return originalMethod.apply(instance, args)
}

/**
 * Cache decorator for method results
 * Caches the result of the decorated method using the configured cache service
 *
 * @param options - Configuration options for caching
 */
export function Cache<T = any>(options: CacheOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...methodArgs: any[]
    ) => Promise<T>

    const className = target.constructor.name

    descriptor.value = async function (...args: any[]): Promise<T> {
      const startTime = Date.now()

      // Check if cache service is available
      if (!isCacheServiceAvailable(className, propertyKey)) {
        return originalMethod.apply(this, args)
      }

      // Generate cache key
      const cacheKey = generateCacheKey(options, propertyKey, args)

      try {
        // Try to get from cache first
        // Using non-null assertion since we already checked in isCacheServiceAvailable
        const cachedResult = await globalCacheService!.get<T>(cacheKey)

        if (cachedResult !== null) {
          return handleCacheHit(
            cacheKey,
            startTime,
            options,
            className,
            propertyKey,
            this,
            originalMethod,
            args,
            cachedResult,
          )
        }

        // Handle cache miss
        return handleCacheMiss(
          cacheKey,
          startTime,
          options,
          className,
          propertyKey,
          this,
          originalMethod,
          args,
        )
      } catch (error) {
        // Handle any errors during cache operations
        return handleCacheError(
          error,
          cacheKey,
          className,
          propertyKey,
          this,
          originalMethod,
          args,
        )
      }
    }

    return descriptor
  }
}
