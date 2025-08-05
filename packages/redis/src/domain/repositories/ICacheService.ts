/**
 * Cache Repository Interface
 *
 * This interface defines the contract for cache implementations.
 * It provides methods for basic cache operations like get, set, delete,
 * and more advanced operations like pattern-based deletion and TTL management.
 */
export interface ICacheService {
  /**
   * Establishes a connection to the cache service
   */
  connect(): Promise<void>

  /**
   * Closes the connection to the cache service
   */
  disconnect(): Promise<void>

  /**
   * Retrieves a value from the cache
   * @param key - The key to retrieve
   * @returns The cached value or null if not found
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Stores a value in the cache
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the operation was successful
   */
  set(key: string, value: unknown, ttl?: number): Promise<boolean>

  /**
   * Stores a value in the cache only if the key doesn't exist (SET NX)
   * @param key - The key to store the value under
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   * @returns True if the value was set, false if key already exists
   */
  setNX(key: string, value: unknown, ttl?: number): Promise<boolean>

  /**
   * Checks if a key exists in the cache
   * @param key - The key to check
   * @returns True if the key exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Gets the remaining time to live for a key
   * @param key - The key to check
   * @returns The remaining TTL in seconds, -1 if the key exists but has no TTL, -2 if the key doesn't exist
   */
  getTTL(key: string): Promise<number>

  /**
   * Updates the time to live for a key
   * @param key - The key to update
   * @param ttl - New time to live in seconds
   * @returns True if the operation was successful
   */
  updateTTL(key: string, ttl: number): Promise<boolean>

  /**
   * Deletes a key from the cache
   * @param key - The key to delete
   * @returns True if the key was deleted
   */
  del(key: string): Promise<boolean>

  /**
   * Deletes all keys matching a pattern
   * @param pattern - The pattern to match keys against
   * @returns The number of keys deleted
   */
  delPattern(pattern: string): Promise<number>

  /**
   * Clears all keys from the cache
   */
  clearAll(): Promise<void>

  /**
   * Checks the health of the cache service
   * @returns Health status indicating healthy, degraded, or unhealthy state
   */
  checkHealth?(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }>
}
