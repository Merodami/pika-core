/**
 * Idempotency Configuration and Types
 */

export interface IdempotencyConfig {
  /**
   * Enable idempotency for this service
   */
  enabled: boolean

  /**
   * Default TTL for cached responses in seconds
   * @default 86400 (24 hours)
   */
  defaultTTL?: number

  /**
   * HTTP methods to apply idempotency to
   * @default ['POST', 'PUT', 'PATCH']
   */
  methods?: string[]

  /**
   * Routes to exclude from idempotency checks
   * @example ['/health', '/metrics']
   */
  excludeRoutes?: string[]

  /**
   * Custom key prefix for this service
   * @example 'voucher-service'
   */
  keyPrefix?: string

  /**
   * Whether to include user context in cache key
   * @default true
   */
  includeUserContext?: boolean

  /**
   * Maximum response size to cache (in bytes)
   * @default 1MB
   */
  maxResponseSize?: number
}

export interface IdempotentResponse {
  /**
   * The HTTP status code
   */
  statusCode: number

  /**
   * Response headers
   */
  headers: Record<string, string>

  /**
   * Response body
   */
  body: any

  /**
   * Timestamp when the response was cached
   */
  cachedAt: string

  /**
   * Original request method
   */
  method: string

  /**
   * Original request path
   */
  path: string
}

export interface IdempotencyContext {
  /**
   * The idempotency key from the request
   */
  key: string

  /**
   * User ID if available
   */
  userId?: string

  /**
   * Service name
   */
  service: string

  /**
   * Request method
   */
  method: string

  /**
   * Request path
   */
  path: string

  /**
   * Correlation ID for tracing
   */
  correlationId: string
}
