import { requestContextMiddleware } from '@http/infrastructure/express/middleware/requestContext.js'
import {
  NODE_ENV,
  RATE_LIMIT_ENABLE,
  RATE_LIMIT_MAX,
  SERVICE_HOST,
} from '@pika/environment'
import { logger } from '@pika/shared'
import compression from 'compression'
import cors from 'cors'
import express, { Express } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import GracefulShutdownManager from 'http-graceful-shutdown'

import { ServerOptions } from '../../domain/types/server.js'
import { authMiddleware } from '../../infrastructure/express/middleware/auth.js'
import { idempotencyMiddleware } from '../../infrastructure/express/middleware/idempotency.js'
import { setupServiceHealthCheck } from './healthCheck.js'

/**
 * Parse time window string to milliseconds
 */
function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(
    /^(\d+)\s*(minute|minutes|min|mins|second|seconds|sec|secs|hour|hours|hr|hrs)$/i,
  )

  if (!match) {
    return 60 * 1000 // Default to 1 minute
  }

  const value = parseInt(match[1])
  const unit = match[2].toLowerCase()

  if (unit.startsWith('sec')) return value * 1000
  if (unit.startsWith('min')) return value * 60 * 1000
  if (unit.startsWith('hour') || unit.startsWith('hr'))
    return value * 60 * 60 * 1000

  return 60 * 1000 // Default to 1 minute
}

/**
 * Creates and configures an Express server with standard middleware and configuration.
 *
 * @param options - Server configuration options
 * @returns Configured Express instance
 */
export async function createExpressServer(
  options: ServerOptions,
): Promise<Express> {
  // Initialize the Express application
  const app = express()

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', true)

  // Modern industry standard: Conditional body parsing to support webhooks
  app.use((req, res, next) => {
    // Skip JSON parsing for webhook routes (they need raw body for signature verification)
    if (req.path.includes('/webhooks/') || req.path.includes('/webhook/')) {
      return next()
    }
    express.json()(req, res, next)
  })

  app.use((req, res, next) => {
    // Skip URL-encoded parsing for webhook routes
    if (req.path.includes('/webhooks/') || req.path.includes('/webhook/')) {
      return next()
    }
    express.urlencoded({ extended: true })(req, res, next)
  })

  // Add compression
  app.use(compression())

  // Add cache service to the app instance if provided
  if (options.cacheService) {
    app.locals.cacheService = options.cacheService
  }

  // Apply security headers
  app.use(
    helmet({
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
    }),
  )

  // Enable CORS
  app.use(
    cors({
      exposedHeaders: ['Date', 'Content-Disposition'],
    }),
  )

  // Apply rate limiting if enabled
  if (RATE_LIMIT_ENABLE) {
    const limiter = rateLimit({
      windowMs: options.rateLimit?.timeWindow
        ? parseTimeWindow(options.rateLimit.timeWindow)
        : 60 * 1000,
      max: options.rateLimit?.max || RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      // Custom key generator for use behind proxies (required when trust proxy is true)
      keyGenerator: (req) => {
        // Use x-forwarded-for header if available (set by proxies like Vercel)
        // Fall back to socket address if not behind proxy
        return (
          req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
          req.socket.remoteAddress ||
          'unknown'
        )
      },
      // Skip successful requests from rate limiting
      skipSuccessfulRequests: false,
      // Skip failed requests from rate limiting
      skipFailedRequests: false,
    })

    app.use(limiter)
  }

  // Register authentication middleware (unless explicitly skipped)
  if (!options.skipAuthRegistration) {
    // Default paths that should always be excluded from authentication
    const defaultExcludePaths = [
      '/health',
      '/health/details',
      '/api/v1/health',
      '/api/v1/health/*',
      '/auth/*', // All auth endpoints should be public
    ]

    // Combine default exclude paths with any additional ones from options
    const excludePaths = [
      ...defaultExcludePaths,
      ...(options.authOptions?.excludePaths || []),
    ]

    app.use(
      authMiddleware({
        excludePaths,
        cacheService: options.cacheService,
      }),
    )
  }

  // Register request context middleware with user context
  app.use(
    requestContextMiddleware({
      getUserContext: (req) => {
        // Get user from auth middleware
        if (req.user) {
          return {
            authenticatedUser: {
              id: req.user.id,
              email: req.user.email,
              fullName: null, // Not available from JWT
              permissions: req.user.permissions || [],
              roles: [req.user.role], // Convert single role to array
              type: req.user.type || req.user.role?.toUpperCase() || null,
            },
          }
        }

        return undefined
      },
    }),
  )

  // Setup health check endpoints (only if health checks are provided)
  if (options.healthChecks && options.healthChecks.length > 0) {
    setupServiceHealthCheck(app, options.healthChecks, {
      serviceName: options.serviceName,
    })
  }

  // Register idempotency middleware (after auth but before routes)
  if (options.idempotencyOptions && options.cacheService) {
    app.use(
      idempotencyMiddleware({
        enabled: true, // Default to enabled if idempotencyOptions is provided
        ...options.idempotencyOptions,
        cacheService: options.cacheService,
        keyPrefix: options.idempotencyOptions.keyPrefix || options.serviceName,
      }),
    )
  }

  // Store error middleware configuration for later registration
  app.locals.errorMiddlewareConfig = {
    enableStackTrace: NODE_ENV !== 'production',
  }

  return app
}

/**
 * Starts the server and sets up graceful shutdown
 *
 * @param app - Configured Express instance
 * @param port - Port to listen on
 * @param shutdownHandlers - Custom shutdown handlers
 */
export async function startServer(
  app: Express,
  port: number,
  shutdownHandlers?: {
    onShutdown?: () => Promise<void>
    onUnhandledRejection?: (reason: any) => void
  },
): Promise<void> {
  const server = app.listen(port, SERVICE_HOST, () => {
    logger.info(`App listening on ${SERVICE_HOST}:${port}`)
    logger.info(
      `Health check available at http://${SERVICE_HOST === '0.0.0.0' ? 'localhost' : SERVICE_HOST}:${port}/health`,
    )
  })

  server.on('error', (err) => {
    logger.error('Error starting server:', err)
    process.exit(1)
  })

  // Configure graceful shutdown
  GracefulShutdownManager(server, {
    timeout: 10000,
    onShutdown: async (signal?: string) => {
      logger.info(`Received ${signal || 'SIGTERM'}, shutting down gracefully`)

      // Execute custom shutdown logic if provided
      if (shutdownHandlers?.onShutdown) {
        await shutdownHandlers.onShutdown()
      }

      logger.info('Server gracefully shut down.')
    },
    finally: () => {
      logger.info('Server closed')
    },
  })

  // Set up unhandled rejection handler
  process.on('unhandledRejection', (reason) => {
    if (shutdownHandlers?.onUnhandledRejection) {
      shutdownHandlers.onUnhandledRejection(reason)
    } else {
      logger.error(`Unhandled Promise Rejection: ${reason}`)
    }
  })
}

// Export the old names for backward compatibility during migration
