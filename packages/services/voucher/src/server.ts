// Load environment variables first
import '@pika/environment'

import { VOUCHER_SERVICE_NAME, VOUCHER_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { BusinessServiceClient, FileStoragePort, logger } from '@pika/shared'
import { TranslationClient, TranslationResolver } from '@pika/translation'
import { PrismaClient } from '@prisma/client'

import { createAdminVoucherRoutes } from './routes/AdminVoucherRoutes.js'
import { createInternalVoucherRoutes } from './routes/InternalVoucherRoutes.js'
import { createVoucherRoutes } from './routes/VoucherRoutes.js'

/**
 * Create and configure the Express server for the Voucher service
 * This is separate from the server startup to make testing easier
 */
export async function createVoucherServer({
  prisma,
  cacheService,
  fileStorage,
  translationClient,
  translationResolver,
  communicationClient,
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  translationClient: TranslationClient
  translationResolver: TranslationResolver
  communicationClient?: any
}) {
  // Initialize service clients
  const businessServiceClient = new BusinessServiceClient()

  logger.info(`Configuring Voucher service for port: ${VOUCHER_SERVICE_PORT}`)

  // Create Express server
  const app = await createExpressServer({
    serviceName: VOUCHER_SERVICE_NAME,
    port: VOUCHER_SERVICE_PORT,
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

  // Register voucher routes
  const voucherRouter = await createVoucherRoutes(
    prisma,
    cacheService,
    translationClient,
    translationResolver,
    fileStorage,
    communicationClient,
  )

  app.use('/vouchers', voucherRouter)

  // Register admin routes
  const adminRouter = createAdminVoucherRoutes(
    prisma,
    cacheService,
    translationClient,
    translationResolver,
    fileStorage,
    communicationClient,
    businessServiceClient,
  )

  app.use('/admin/vouchers', adminRouter)

  // Register internal routes
  const internalRouter = createInternalVoucherRoutes(
    prisma,
    cacheService,
    translationClient,
  )

  app.use('/internal/vouchers', internalRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  // Log service info
  logger.info(
    `Voucher service configured successfully on port ${VOUCHER_SERVICE_PORT}`,
  )

  return app
}
