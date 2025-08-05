import { SUBSCRIPTION_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger, PaymentServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import {
  createAdminPlanRoutes,
  createAdminSubscriptionRoutes,
} from './routes/AdminSubscriptionRoutes.js'
import { createInternalSubscriptionRouter } from './routes/InternalSubscriptionRoutes.js'
import { createPlanRouter } from './routes/PlanRoutes.js'
import { createPublicSubscriptionRoutes } from './routes/PublicSubscriptionRoutes.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
  paymentClient?: PaymentServiceClient // Optional for testing
}

export async function createSubscriptionServer(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: 'subscription-service',
    port: SUBSCRIPTION_SERVICE_PORT,
    cacheService: config.cacheService,
    authOptions: {
      excludePaths: ['/health', '/metrics', '/internal/*'],
    },
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await config.prisma.$queryRaw`SELECT 1`

            return true
          } catch {
            return false
          }
        },
        details: { type: 'PostgreSQL' },
      },
      {
        name: 'redis',
        check: async () => {
          try {
            // Handle both RedisService and MemoryCacheService
            if (typeof config.cacheService.checkHealth === 'function') {
              const health = await config.cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // For MemoryCacheService that doesn't have checkHealth, do a simple operation test
            await config.cacheService.set('health_check', 'ok', 5)

            const result = await config.cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400,
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
  })

  // Initialize payment client if not provided (for testing)
  const paymentClient = config.paymentClient || new PaymentServiceClient()

  // Public routes
  app.use(
    '/plans',
    createPlanRouter(config.prisma, config.cacheService, paymentClient),
  )
  app.use(
    '/subscriptions',
    createPublicSubscriptionRoutes(config.prisma, config.cacheService),
  )

  // Admin routes
  app.use(
    '/admin/subscriptions',
    createAdminSubscriptionRoutes(config.prisma, config.cacheService),
  )
  app.use(
    '/admin/subscription-plans',
    createAdminPlanRoutes(config.prisma, config.cacheService),
  )

  // Internal API routes
  app.use(
    '/internal/subscriptions',
    createInternalSubscriptionRouter(config.prisma, config.cacheService),
  )

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return { app }
}
