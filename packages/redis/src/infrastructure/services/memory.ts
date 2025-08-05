import { ICacheService } from '../../domain/repositories/ICacheService.js'

/**
 * Memory Cache Implementation
 *
 * This class provides an in-memory cache implementation using a Map.
 * It's useful for development and testing purposes, or when a simple
 * in-memory cache is sufficient.
 */
export class MemoryCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map()
  private defaultTTL: number

  /**
   * Creates a new MemoryCacheService instance
   * @param defaultTTL - Default time-to-live in seconds (default: 1 hour)
   */
  constructor(defaultTTL: number = 3600) {
    this.defaultTTL = defaultTTL
  }

  /**
   * No-op for memory cache as it doesn't require connection
   */
  async connect(): Promise<void> {
    // No-op for memory cache
  }

  /**
   * Clears the cache and releases memory
   */
  async disconnect(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Retrieves a value from the memory cache
   * @param key - The key to retrieve
   * @returns The cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)

    if (!item) return null

    if (item.expiresAt < Date.now()) {
      this.cache.delete(key)

      return null
    }

    return item.value as T
  }

  /**
   * Stores a value in the memory cache
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the operation was successful
   */
  async set(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    })

    return true
  }

  /**
   * Stores a value in the memory cache only if the key doesn't exist
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the value was set, false if key already exists
   */
  async setNX(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    // Check if key exists first
    const existing = await this.get(key)

    if (existing !== null) {
      return false
    }

    // Set the value since it doesn't exist
    return this.set(key, value, ttl)
  }

  /**
   * Checks if a key exists in the memory cache
   * @param key - The key to check
   * @returns True if the key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key)

    if (!item) return false

    return item.expiresAt > Date.now()
  }

  /**
   * Gets the remaining time to live for a key
   * @param key - The key to check
   * @returns The remaining TTL in seconds, -1 if the key exists but has no TTL, -2 if the key doesn't exist
   */
  async getTTL(key: string): Promise<number> {
    const item = this.cache.get(key)

    if (!item) return -2
    if (item.expiresAt < Date.now()) return -1

    return Math.floor((item.expiresAt - Date.now()) / 1000)
  }

  /**
   * Updates the time to live for a key
   * @param key - The key to update
   * @param ttl - New time to live in seconds
   * @returns True if the operation was successful
   */
  async updateTTL(key: string, ttl: number): Promise<boolean> {
    const item = this.cache.get(key)

    if (!item) return false
    item.expiresAt = Date.now() + ttl * 1000

    return true
  }

  /**
   * Deletes a key from the memory cache
   * @param key - The key to delete
   * @returns True if the key was deleted
   */
  async del(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  /**
   * Deletes all keys matching a pattern
   * @param pattern - The pattern to match keys against
   * @returns The number of keys deleted
   */
  async delPattern(pattern: string): Promise<number> {
    const wildcardPattern = pattern.replace('*', '.*')

    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (key.match(wildcardPattern)) {
        if (this.cache.delete(key)) {
          deletedCount++
        }
      }
    }

    return deletedCount
  }

  /**
   * Clears all keys from the memory cache
   */
  async clearAll(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Checks the health of the memory cache service
   * @returns Health status indicating healthy state for memory cache
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    return {
      status: 'healthy',
      details: {
        type: 'memory',
        size: this.cache.size,
      },
    }
  }
}
