// Import the necessary dependencies
import { BUSINESS_SERVICE_PORT, REDIS_PASSWORD } from '@pika/environment'
import { startServer } from '@pika/http'
import { initializeCache, RedisConfigService } from '@pika/redis'
import { logger } from '@pika/shared'
import { createTranslationService, TranslationClient } from '@pika/translation'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Import the server creation function
import { createBusinessServer } from './server.js'

/**
 * Initialize the database connection
 */
export async function initializeDatabase() {
  const prisma = new PrismaClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Successfully connected to PostgreSQL database')

    return prisma
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database:', error)
    throw error
  }
}

/**
 * Initialize and start the Business service
 */
export async function startBusinessService() {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()

  // Create translation service and client
  // Use the same Redis configuration as the cache service
  const redisConfig = RedisConfigService.getInstance().getConfig()
  const translationRedis = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
  })

  const translationService = createTranslationService(prisma, translationRedis)
  const translationClient = new TranslationClient(translationService)

  logger.info(`Business service starting on port: ${BUSINESS_SERVICE_PORT}`)

  // Create Express server using the extracted function
  const app = await createBusinessServer({
    prisma,
    cacheService,
    translationClient,
  })

  // Start the server
  await startServer(app, BUSINESS_SERVICE_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down Business service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connections
      await cacheService.disconnect()
      translationRedis.disconnect()

      logger.info('Business service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in Business service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startBusinessService()
    .then(() => {
      logger.info('Business Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Business Service:', error)
      process.exit(1)
    })
}
