import type { ICacheService } from '@pika/redis'

/**
 * In-memory cache service mock for tests, based on the real MemoryCacheService implementation.
 * Use this in any test that requires an ICacheService.
 */
export class MockCacheService implements ICacheService {
  private cache = new Map<string, { value: any; expiresAt: number }>()
  private defaultTTL = 3600

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {
    this.cache.clear()
  }
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)

    if (!item) return null
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key)

      return null
    }

    return item.value as T
  }
  async set(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttl * 1000 })

    return true
  }

  async setNX(
    key: string,
    value: unknown,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    const existing = await this.get(key)

    if (existing !== null) {
      return false
    }

    return this.set(key, value, ttl)
  }
  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key)

    if (!item) return false

    return item.expiresAt > Date.now()
  }
  async getTTL(key: string): Promise<number> {
    const item = this.cache.get(key)

    if (!item) return -2
    if (item.expiresAt < Date.now()) return -1

    return Math.floor((item.expiresAt - Date.now()) / 1000)
  }
  async updateTTL(key: string, ttl: number): Promise<boolean> {
    const item = this.cache.get(key)

    if (!item) return false
    item.expiresAt = Date.now() + ttl * 1000

    return true
  }
  async del(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }
  async delPattern(pattern: string): Promise<number> {
    const wildcardPattern = pattern.replace('*', '.*')

    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (key.match(wildcardPattern)) {
        if (this.cache.delete(key)) deletedCount++
      }
    }

    return deletedCount
  }
  async clearAll(): Promise<void> {
    this.cache.clear()
  }
  async checkHealth(): Promise<{
    status: 'healthy'
    details: Record<string, any>
  }> {
    return { status: 'healthy', details: {} }
  }
}
