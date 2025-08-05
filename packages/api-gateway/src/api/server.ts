// Load environment variables first
import '@pika/environment'

import {
  API_GATEWAY_PORT,
  CACHE_DISABLED,
  JWT_SECRET,
  NODE_ENV,
} from '@pika/environment'
import {
  authMiddleware,
  createExpressServer,
  errorMiddleware,
  startServer,
} from '@pika/http'
import { RedisService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { Application, Express } from 'express'

import { loadConfig } from '../config/gateway.js'
import { handleHealthCheck } from '../health/healthCheckHandler.js'
import { createValidationRouter } from '../middleware/routeValidation.js'
import { createDocsRouter } from './routes/docsRoutes.js'
import { setupEmbeddedServices } from './routes/setupEmbeddedServices.js'
import { setupProxyRoutes } from './routes/setupProxyRoutes.js'

// Determine if running in development environment
const isLocalDev = NODE_ENV === 'development'

/**
 * Start the API Gateway server
 */
async function startGateway(): Promise<Express> {
  const config = loadConfig()

  // Create server with standard configuration
  const port = API_GATEWAY_PORT || 8000

  // Create Express server with standard configuration
  const app = await createExpressServer({
    serviceName: 'api-gateway',
    port,
    healthChecks: [], // We'll handle health checks manually
    rateLimit: {
      max: config.rateLimit.max,
      timeWindow: `${config.rateLimit.windowMs}ms`,
    },
    // Skip auth registration - we'll register it manually with custom config
    skipAuthRegistration: true,
  })

  // Register custom health check handler BEFORE other routes
  app.get('/api/v1/health', handleHealthCheck)
  logger.info('Custom health check handler registered at /api/v1/health')

  // Configure custom request logging
  if (isLocalDev) {
    app.use((req, res, next) => {
      logger.info(
        {
          req: {
            method: req.method,
            url: req.url,
            path: req.path,
            originalUrl: req.originalUrl,
            hostname: req.hostname,
            remoteAddress: req.ip || req.socket?.remoteAddress || 'unknown',
            remotePort: req.socket?.remotePort,
          },
        },
        'incoming request',
      )
      next()
    })
  }

  // Validate JWT secret is properly configured
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is required for API Gateway authentication',
    )
  }

  if (JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security',
    )
  }

  // Initialize Redis for session management and token blacklisting
  let redisService: RedisService | undefined

  try {
    if (!CACHE_DISABLED) {
      redisService = new RedisService()
      await redisService.connect()

      if (isLocalDev) {
        logger.info(
          'Redis connected for session management and token blacklisting',
          {
            component: 'api-gateway',
            service: 'redis',
          },
        )
      }
    } else {
      if (isLocalDev) {
        logger.warn('Redis disabled - using in-memory token blacklist only', {
          component: 'api-gateway',
          fallback: 'in-memory',
        })
      }
    }
  } catch (error) {
    if (isLocalDev) {
      logger.warn(
        'Redis connection failed - using in-memory token blacklist fallback',
        error as Error,
        {
          component: 'api-gateway',
          fallback: 'in-memory',
        },
      )
    }
    redisService = undefined
  }

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
  })

  // Set up centralized authentication BEFORE proxy routes
  // This validates tokens and adds user context headers for backend services
  app.use(
    authMiddleware({
      cacheService: redisService,
      excludePaths: [
        '/health',
        '/favicon.ico',
        '/api/v1/docs',
        '/api/v1/docs/*', // Documentation routes
        '/api/v1/uploads/*', // Static file uploads (avatars, etc.)
        // Public auth endpoints only
        '/api/v1/auth/token',
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/forgot-password',
        '/api/v1/auth/reset-password',
        '/api/v1/auth/verify-email/*',
        '/api/v1/auth/resend-verification',
        '/api/v1/auth/introspect',
        '/api/v1/auth/revoke',
      ],
    }),
  )

  // Set up proxy routes OR embedded services based on mode
  if (process.env.EMBEDDED_MODE === 'true') {
    // Embedded mode is handled by createGatewayWithServices
    logger.info('API Gateway running in embedded mode - proxy routes disabled')
  } else {
    // Normal proxy mode
    setupProxyRoutes(app, isLocalDev)
  }

  if (isLocalDev) {
    logger.info('Centralized authentication enabled at API Gateway level', {
      component: 'api-gateway',
      feature: 'auth',
    })
    logger.info('Public endpoints configured', {
      component: 'api-gateway',
      endpoints: [
        '/health',
        '/docs',
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/forgot-password',
        '/api/v1/auth/reset-password',
      ],
    })
  }

  // Set up documentation routes (after authentication)
  const docsRouter = createDocsRouter()

  app.use('/api/v1/docs', docsRouter)

  if (isLocalDev) {
    logger.info('API documentation available at /api/v1/docs', {
      component: 'api-gateway',
      endpoints: [
        '/api/v1/docs - Documentation index',
        '/api/v1/docs/public - Public API docs',
        '/api/v1/docs/admin - Admin API docs',
        '/api/v1/docs/internal - Internal API docs',
        '/api/v1/docs/all - Complete API docs',
      ],
    })
  }

  // Set up validation middleware (after proxy routes)
  // This validates requests at the gateway level for non-proxied endpoints
  const validationRouter = createValidationRouter()

  app.use(validationRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  // Start the server
  await startServer(app, port, {
    onShutdown: async () => {
      logger.info('API Gateway shutdown complete', {
        component: 'api-gateway',
        event: 'shutdown',
      })
    },
    onUnhandledRejection: (reason) => {
      logger.error(
        'Unhandled Promise Rejection in API Gateway',
        reason as Error,
        {
          component: 'api-gateway',
          event: 'unhandled-rejection',
        },
      )
    },
  })

  return app
}

// Auto-start in development mode
if (isLocalDev) {
  startGateway().catch((error) => {
    logger.error('Failed to start API Gateway', error as Error, {
      component: 'api-gateway',
      event: 'startup-failure',
    })

    process.exit(1)
  })
}

/**
 * Create API Gateway with embedded services (for monolith deployments)
 * This is the industry-standard pattern for serverless/edge deployments
 */
export async function createGatewayWithServices(
  services: Map<string, Application>,
): Promise<Express> {
  // Set embedded mode
  process.env.EMBEDDED_MODE = 'true'

  // Create the gateway app with all standard features
  const app = await startGateway()

  // Mount services directly instead of proxying
  await setupEmbeddedServices(app, services)

  logger.info('API Gateway created with embedded services', {
    mode: 'embedded',
    services: Array.from(services.keys()),
  })

  return app
}

export { startGateway }
