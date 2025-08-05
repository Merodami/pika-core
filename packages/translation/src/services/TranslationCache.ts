import type { Redis } from 'ioredis'

export interface ITranslationCache {
  get(key: string, language: string): Promise<string | null>
  set(key: string, language: string, value: string): Promise<void>
  invalidate(key: string, language?: string): Promise<void>
  warmup(language: string): Promise<void>
}

export class TranslationCache implements ITranslationCache {
  private readonly prefix = 'trans:'
  private readonly ttl = 86400 // 24 hours

  constructor(private readonly redis: Redis) {}

  async get(key: string, language: string): Promise<string | null> {
    const cacheKey = `${this.prefix}${language}:${key}`

    return this.redis.get(cacheKey)
  }

  async set(key: string, language: string, value: string): Promise<void> {
    const cacheKey = `${this.prefix}${language}:${key}`

    await this.redis.set(cacheKey, value, 'EX', this.ttl)
  }

  async invalidate(key: string, language?: string): Promise<void> {
    if (language) {
      await this.redis.del(`${this.prefix}${language}:${key}`)
    } else {
      // Invalidate all languages for this key
      const pattern = `${this.prefix}*:${key}`
      const keys = await this.redis.keys(pattern)

      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    }
  }

  async warmup(language: string): Promise<void> {
    // Pre-load common translations
    await this.redis.smembers(`${this.prefix}common:${language}`)
    // Implementation depends on your needs
  }
}
