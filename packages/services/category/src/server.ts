import { CATEGORY_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { TranslationClient } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'

import { AdminCategoryController } from './controllers/AdminCategoryController.js'
import { CategoryController } from './controllers/CategoryController.js'
import { InternalCategoryController } from './controllers/InternalCategoryController.js'
import { CategoryRepository } from './repositories/CategoryRepository.js'
import { createAdminCategoryRoutes } from './routes/AdminCategoryRoutes.js'
import { createCategoryRoutes } from './routes/CategoryRoutes.js'
import { createInternalCategoryRoutes } from './routes/InternalCategoryRoutes.js'
import { CategoryService } from './services/CategoryService.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
  translationClient: TranslationClient
}

export async function createCategoryServer(config: ServerConfig) {
  const { prisma, cacheService } = config

  // Create Express app with standard configuration
  const app = await createExpressServer({
    serviceName: 'category',
    port: CATEGORY_SERVICE_PORT,
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
  const categoryRepository = new CategoryRepository(prisma, cacheService)
  const categoryService = new CategoryService(categoryRepository, cacheService)

  // Initialize controllers
  const categoryController = new CategoryController(categoryService)
  const adminCategoryController = new AdminCategoryController(categoryService)
  const internalCategoryController = new InternalCategoryController(
    categoryService,
  )

  // Mount route handlers
  app.use('/categories', createCategoryRoutes(categoryController))
  app.use(
    '/admin/categories',
    createAdminCategoryRoutes(adminCategoryController),
  )
  app.use(
    '/internal/categories',
    createInternalCategoryRoutes(internalCategoryController),
  )

  // Register error middleware (must be last)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  logger.info('Category service server configured successfully')

  return { app }
}
