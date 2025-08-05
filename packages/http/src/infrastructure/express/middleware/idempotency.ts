import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

import type {
  IdempotencyConfig,
  IdempotencyContext,
  IdempotentResponse,
} from '../../../domain/types/idempotency.js'

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string
      idempotencyContext?: IdempotencyContext
    }
  }
}

/**
 * Convert Express route pattern to regex for matching
 * Handles patterns like /admin/businesses/:id/deactivate
 */
function routePatternToRegex(pattern: string): RegExp {
  // Escape special regex characters except for :
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Replace :param with regex to match any non-slash characters
  const regexPattern = escaped.replace(/:([^/]+)/g, '([^/]+)')

  // Add anchors to match the full path
  return new RegExp(`^${regexPattern}$`)
}

/**
 * Check if a URL matches any of the excluded route patterns
 */
function isExcludedRoute(url: string, excludeRoutes: string[]): boolean {
  return excludeRoutes.some((route) => {
    // If route contains : it's a pattern, otherwise do simple prefix match
    if (route.includes(':')) {
      const regex = routePatternToRegex(route)

      return regex.test(url)
    }

    return url.startsWith(route)
  })
}

/**
 * Express middleware for handling idempotent requests
 *
 * This middleware provides system-wide idempotency support by:
 * - Checking for duplicate requests based on idempotency keys
 * - Returning cached responses for duplicate requests
 * - Storing responses after successful processing
 *
 * Usage:
 * - Clients send requests with X-Idempotency-Key header
 * - Middleware checks cache for existing response
 * - If found, returns cached response
 * - If not found, processes request and caches response
 */
export function idempotencyMiddleware(
  options: IdempotencyConfig & { cacheService: ICacheService },
): RequestHandler {
  const {
    enabled = true,
    defaultTTL = 86400, // 24 hours
    methods = ['POST', 'PUT', 'PATCH'],
    excludeRoutes = ['/health', '/metrics', '/docs'],
    keyPrefix = 'default',
    includeUserContext = true,
    cacheService,
  } = options

  if (!enabled) {
    logger.info('Idempotency middleware is disabled')

    return (req: Request, res: Response, next: NextFunction) => next()
  }

  if (!cacheService) {
    throw new Error('Cache service is required for idempotency middleware')
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if method not configured for idempotency
    if (!methods.includes(req.method)) {
      return next()
    }

    // Debug logging for path investigation
    if (req.path.includes('deactivate')) {
      logger.debug('Idempotency: Processing deactivate request', {
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        method: req.method,
        excludeRoutes,
      })
    }

    // Skip excluded routes (now handles parameterized routes)
    if (isExcludedRoute(req.path, excludeRoutes)) {
      logger.debug('Idempotency: Skipping excluded route', {
        path: req.path,
        method: req.method,
      })

      return next()
    }

    // Check for idempotency key
    const idempotencyKey = req.headers['x-idempotency-key'] as string

    if (!idempotencyKey) {
      return next()
    }

    // Validate idempotency key format (alphanumeric + hyphens, 16-128 chars)
    if (!/^[a-zA-Z0-9-]{16,128}$/.test(idempotencyKey)) {
      logger.warn('Invalid idempotency key format', { idempotencyKey })

      res.status(400).json({
        error: 'Invalid idempotency key format',
        message:
          'Idempotency key must be 16-128 characters, alphanumeric and hyphens only',
      })

      return
    }

    // Build context
    const context: IdempotencyContext = {
      key: idempotencyKey,
      userId: includeUserContext
        ? (req.headers['x-user-id'] as string)
        : undefined,
      service: keyPrefix,
      method: req.method,
      path: req.route?.path || req.path,
      correlationId:
        (req.headers['x-correlation-id'] as string) || req.correlationId || '',
    }

    // Build cache key
    const cacheKey = buildCacheKey(context)

    try {
      // Check for existing response
      const cached = await cacheService.get<IdempotentResponse>(cacheKey)

      if (cached) {
        logger.info('Returning cached idempotent response', {
          idempotencyKey,
          cachedAt: cached.cachedAt,
          path: req.url,
        })

        // Set idempotency headers (industry standard)
        res.setHeader('X-Idempotency-Key', idempotencyKey)
        res.setHeader('X-Idempotent-Replayed', 'true')
        res.setHeader('Content-Type', 'application/json')

        // Industry standard: return 200 with cached status info instead of original body
        const cacheResponse = {
          success: true,
          cached: true,
          originalStatus: cached.statusCode,
          cachedAt: cached.cachedAt,
          message: 'Request processed successfully (cached response)',
        }

        // Return cache confirmation response
        res.status(200).json(cacheResponse)

        return
      }

      // No cached response, attach context for response hook
      req.idempotencyKey = idempotencyKey
      req.idempotencyContext = context

      // Intercept response to cache it
      const originalSend = res.json

      res.json = function (data: any) {
        // Only cache successful responses (2xx) and client errors (4xx)
        const statusCode = res.statusCode

        if (statusCode >= 200 && statusCode < 500) {
          // Build response object for caching (without body - will be reconstructed on cache hit)
          const response: IdempotentResponse = {
            statusCode,
            headers: {
              'X-Idempotency-Key': idempotencyKey,
              'Content-Type': 'application/json',
            },
            body: null, // Industry standard: store minimal response data
            cachedAt: new Date().toISOString(),
            method: req.method,
            path: req.url,
          }

          // Cache the response asynchronously (industry standard: background caching)
          cacheService
            .set(cacheKey, response, defaultTTL)
            .then(() => {
              logger.debug('Cached idempotent response', {
                idempotencyKey,
                ttl: defaultTTL,
                statusCode,
              })
            })
            .catch((error) => {
              logger.error('Error caching idempotent response', {
                error,
                idempotencyKey,
              })
            })
        }

        // Call original send
        return originalSend.call(this, data)
      }

      next()
    } catch (error) {
      logger.error('Error checking idempotency cache', {
        error,
        idempotencyKey,
        cacheKey,
      })
      // Continue processing on cache error
      next()
    }
  }
}

/**
 * Build cache key from idempotency context
 */
function buildCacheKey(context: IdempotencyContext): string {
  const parts = ['idempotency', context.service, context.method]

  // Include user context if configured
  if (context.userId) {
    parts.push(`user:${context.userId}`)
  }

  // Include path to prevent key collisions across endpoints
  const sanitizedPath = context.path.replace(/\//g, ':')

  parts.push(sanitizedPath)

  parts.push(context.key)

  return parts.join(':')
}

// Export for backward compatibility
export const idempotencyPlugin = idempotencyMiddleware
