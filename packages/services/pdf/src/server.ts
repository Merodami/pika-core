import { PDF_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import { AdminVoucherBookController } from './controllers/AdminVoucherBookController.js'
import { VoucherBookController } from './controllers/VoucherBookController.js'
import { AdPlacementRepository } from './repositories/AdPlacementRepository.js'
import { BookDistributionRepository } from './repositories/BookDistributionRepository.js'
import { VoucherBookPageRepository } from './repositories/VoucherBookPageRepository.js'
import { VoucherBookRepository } from './repositories/VoucherBookRepository.js'
import { createAdminVoucherBookRoutes } from './routes/AdminVoucherBookRoutes.js'
import { createVoucherBookRoutes } from './routes/VoucherBookRoutes.js'
import { AdminVoucherBookService } from './services/AdminVoucherBookService.js'
import { VoucherBookService } from './services/VoucherBookService.js'
import { VoucherServiceClient } from './services/VoucherServiceClient.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
  voucherServiceClient?: VoucherServiceClient
}

export async function createPDFServer(config: ServerConfig) {
  const { prisma, cacheService, voucherServiceClient } = config

  // Create Express app with standard configuration
  const app = await createExpressServer({
    serviceName: 'pdf',
    port: PDF_SERVICE_PORT,
    cacheService,
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
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
    authOptions: {
      excludePaths: [
        '/health',
        '/metrics',
        '/internal/*', // Internal service-to-service communication
      ],
    },
  })

  // Initialize dependencies with dependency injection
  const voucherBookRepository = new VoucherBookRepository(prisma, cacheService)
  const voucherBookPageRepository = new VoucherBookPageRepository(
    prisma,
    cacheService,
  )
  const adPlacementRepository = new AdPlacementRepository(prisma, cacheService)
  const bookDistributionRepository = new BookDistributionRepository(
    prisma,
    cacheService,
  )

  // Initialize services
  const voucherBookService = new VoucherBookService(
    voucherBookRepository,
    voucherBookPageRepository,
    adPlacementRepository,
    bookDistributionRepository,
    cacheService,
    voucherServiceClient,
  )
  const adminVoucherBookService = new AdminVoucherBookService(
    voucherBookRepository,
    voucherBookPageRepository,
    adPlacementRepository,
    bookDistributionRepository,
    cacheService,
    voucherServiceClient,
  )

  // Initialize controllers
  const voucherBookController = new VoucherBookController(voucherBookService)
  const adminVoucherBookController = new AdminVoucherBookController(
    adminVoucherBookService,
  )

  // Mount route handlers
  app.use('/voucher-books', createVoucherBookRoutes(voucherBookController))
  app.use(
    '/admin/voucher-books',
    createAdminVoucherBookRoutes(adminVoucherBookController),
  )

  // Register error middleware (must be last)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  logger.info('PDF service server configured successfully')

  return app
}
