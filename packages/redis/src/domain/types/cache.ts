/**
 * Configuration options for cache setup and behavior
 */
export interface CacheConfig {
  /** Redis server hostname or IP address */
  host?: string
  /** Redis server port number */
  port?: number
  /** Default time-to-live in seconds for cached items */
  defaultTTL?: number
  /** Initial delay in milliseconds between retry attempts */
  retryDelay?: number
  /** Maximum delay in milliseconds between retry attempts */
  maxRetryDelay?: number
}

/**
 * Represents the health status of the cache system
 */
export interface HealthStatus {
  /** Overall health status of the cache system */
  status: 'healthy' | 'degraded' | 'unhealthy'
  /** Detailed health metrics */
  details: {
    /** Whether the connection to Redis is active */
    connection: boolean
    /** Current latency in milliseconds */
    latency: number
    /** Number of errors encountered */
    errors: number
  }
}

/**
 * Redis configuration interface for establishing and managing Redis connections
 */
export interface RedisConfig {
  /** Redis server hostname or IP address */
  host: string
  /** Redis server port number */
  port: number
  /** Default time-to-live in seconds for cached items */
  defaultTTL: number
  /** Initial delay in milliseconds between retry attempts */
  retryDelay: number
  /** Maximum delay in milliseconds between retry attempts */
  maxRetryDelay: number
  /** Number of items to scan per iteration in SCAN operations */
  scanCount: number
}

/**
 * Configuration options for the cache decorator
 */
export interface CacheOptions {
  /** Time to live in seconds */
  ttl: number
  /** Cache key prefix */
  prefix: string
  /** Optional condition to determine if result should be cached */
  condition?: (result: any) => boolean
  /** Callback for cache hits (useful for monitoring) */
  onCacheHit?: (key: string, execTime: number) => void
  /** Callback for cache misses (useful for monitoring) */
  onCacheMiss?: (key: string, execTime: number) => void
  /** Custom key generator function */
  keyGenerator?: (prefix: string, methodName: string, args: any[]) => string
  /** Whether to use stale data while refreshing (defaults to false) */
  staleWhileRevalidate?: boolean
}

/**
 * Cache statistics tracking interface for monitoring cache performance
 */
export interface CacheStats {
  /** Number of successful cache hits */
  hits: number
  /** Number of cache misses */
  misses: number
  /** Number of errors encountered during cache operations */
  errors: number
  /** Average time in milliseconds for successful cache hits */
  avgHitTime: number
  /** Average time in milliseconds for cache misses */
  avgMissTime: number
}
