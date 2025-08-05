// Import the necessary dependencies
import { USER_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { initializeCache } from '@pika/redis'
import { FileStoragePort, logger, StorageServiceClient } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

// Import the server creation function
import { createUserServer } from './server.js'

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
 * Initialize and start the unified User service
 * This combines both read and write capabilities
 */
export async function startUserService() {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()
  const fileStorage = initializeFileStorage()

  logger.info(`Unified User service starting on port: ${USER_SERVICE_PORT}`)

  // Create Express server using the extracted function
  const app = await createUserServer({
    prisma,
    cacheService,
    fileStorage,
  })

  // Start the server
  await startServer(app, USER_SERVICE_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified User service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connection
      await cacheService.disconnect()

      logger.info('User service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in User service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startUserService()
    .then(() => {
      logger.info('Unified User Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start User Service:', error)
      process.exit(1)
    })
}
