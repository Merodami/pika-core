import { REDIS_DEFAULT_TTL, REDIS_HOST, REDIS_PORT } from '@pika/environment'

interface RedisConfig {
  host: string
  port: number
  defaultTTL: number
}

export function loadConfig(): RedisConfig {
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    defaultTTL: REDIS_DEFAULT_TTL,
  }
}
