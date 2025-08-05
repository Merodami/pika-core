// Import the necessary dependencies
import { REDIS_PASSWORD, VOUCHER_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { initializeCache, RedisConfigService } from '@pika/redis'
import { FileStoragePort, logger, StorageServiceClient } from '@pika/shared'
import {
  createTranslationResolver,
  createTranslationService,
  TranslationClient,
} from '@pika/translation'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Import the server creation function
import { createVoucherServer } from './server.js'

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
 * Initialize the file storage service
 */
function initializeFileStorage(): FileStoragePort {
  logger.info('Initializing storage service client for file uploads')

  // Use the storage service for all file operations
  return new StorageServiceClient()
}

/**
 * Initialize and start the unified Voucher service
 * This combines both read and write capabilities
 */
export async function startVoucherService() {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()
  const fileStorage = initializeFileStorage()

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
  const translationResolver = createTranslationResolver(translationClient)

  logger.info(
    `Unified Voucher service starting on port: ${VOUCHER_SERVICE_PORT}`,
  )

  // Create Express server using the extracted function
  const app = await createVoucherServer({
    prisma,
    cacheService,
    fileStorage,
    translationClient,
    translationResolver,
  })

  // Start the server
  await startServer(app, VOUCHER_SERVICE_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified Voucher service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connections
      await cacheService.disconnect()
      translationRedis.disconnect()

      logger.info('Voucher service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in Voucher service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startVoucherService()
    .then(() => {
      logger.info('Unified Voucher Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Voucher Service:', error)
      process.exit(1)
    })
}
