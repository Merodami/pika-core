// Load environment variables first
import '@pika/environment'

import { USER_SERVICE_NAME, USER_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createAdminUserRouter } from './routes/AdminUserRoutes.js'
import { createInternalUserRouter } from './routes/InternalUserRoutes.js'
import { createUserRouter } from './routes/UserRoutes.js'

/**
 * Create and configure the Express server for the User service
 * This is separate from the server startup to make testing easier
 */
export async function createUserServer({
  prisma,
  cacheService,
  fileStorage,
  communicationClient,
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  communicationClient?: any
}) {
  logger.info(`Configuring User service for port: ${USER_SERVICE_PORT}`)

  // Create Express server
  const app = await createExpressServer({
    serviceName: USER_SERVICE_NAME,
    port: USER_SERVICE_PORT,
    cacheService,
    authOptions: {
      excludePaths: ['/health', '/metrics', '/internal/*'],
    },
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await prisma.$queryRaw`SELECT 1`

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
            if (typeof cacheService.checkHealth === 'function') {
              const health = await cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // For MemoryCacheService that doesn't have checkHealth, do a simple operation test
            await cacheService.set('health_check', 'ok', 5)

            const result = await cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
  })

  // Register user routes
  const userRouter = await createUserRouter(
    prisma,
    cacheService,
    fileStorage,
    communicationClient,
  )

  app.use('/users', userRouter)

  // Register admin routes
  const adminRouter = createAdminUserRouter(
    prisma,
    cacheService,
    fileStorage,
    communicationClient,
  )

  app.use('/admin/users', adminRouter)

  // Register internal routes
  const internalRouter = createInternalUserRouter(prisma, cacheService)

  app.use('/internal/users', internalRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  // Log service info
  logger.info(
    `User service configured successfully on port ${USER_SERVICE_PORT}`,
  )

  return app
}
