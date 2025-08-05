import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import { createAdminCommentRouter } from './routes/AdminCommentRoutes.js'
import { createAdminProblemRouter } from './routes/AdminProblemRoutes.js'
import { createAdminSupportRouter } from './routes/AdminSupportRoutes.js'
import { createProblemRouter } from './routes/ProblemRoutes.js'
import { createSupportCommentRouter } from './routes/SupportCommentRoutes.js'

export interface ServerConfig {
  port: number
  prisma: PrismaClient
  cacheService: ICacheService
}

export async function createSupportServer(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: 'support-service',
    port: config.port,
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

  // Mount routes
  app.use('/problems', createProblemRouter(config.prisma, config.cacheService))
  app.use(
    '/comments',
    createSupportCommentRouter(config.prisma, config.cacheService),
  )

  // Mount admin routes
  app.use(
    '/admin/support',
    createAdminSupportRouter(config.prisma, config.cacheService),
  )
  app.use(
    '/admin/problems',
    createAdminProblemRouter(config.prisma, config.cacheService),
  )
  app.use(
    '/admin/comments',
    createAdminCommentRouter(config.prisma, config.cacheService),
  )

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return { app }
}
