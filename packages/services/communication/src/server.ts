import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import { createEmailRouter } from './routes/EmailRoutes.js'
import { createInternalCommunicationRouter } from './routes/InternalCommunicationRoutes.js'
import { createNotificationRouter } from './routes/NotificationRoutes.js'
import type { EmailConfig } from './services/EmailService.js'

export interface ServerConfig {
  port: number
  prisma: PrismaClient
  cacheService: ICacheService
  emailConfig: EmailConfig
}

export async function createCommunicationServer(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: 'communication-service',
    port: config.port,
    cacheService: config.cacheService,
    authOptions: {
      excludePaths: [
        '/health',
        '/metrics',
        '/internal/*', // Internal routes use service authentication
      ],
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

  // Mount public routes
  app.use(
    '/emails',
    createEmailRouter(config.prisma, config.cacheService, config.emailConfig),
  )
  app.use(
    '/notifications',
    createNotificationRouter(
      config.prisma,
      config.cacheService,
      config.emailConfig,
    ),
  )

  // Mount internal routes for service-to-service communication
  app.use(
    '/internal',
    createInternalCommunicationRouter(
      config.prisma,
      config.cacheService,
      config.emailConfig,
    ),
  )

  // TODO: Add admin routes when needed (currently excluded per directive)
  // app.use('/admin', createAdminRouter(config.prisma, config.cacheService, config.emailConfig))

  // TODO: Add more routes when implemented
  // app.use('/sms', createSmsRouter(config.prisma, config.cacheService))

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return app
}
