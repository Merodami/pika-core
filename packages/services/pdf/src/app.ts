import { PDF_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createPDFServer } from './server.js'

async function initializeDatabase(): Promise<PrismaClient> {
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

export async function startPDFService(): Promise<void> {
  let prisma: PrismaClient | undefined
  let cacheService: ICacheService | undefined

  try {
    // Initialize dependencies
    prisma = await initializeDatabase()
    cacheService = await initializeCache()

    const app = await createPDFServer({
      prisma,
      cacheService,
    })

    // Start the server
    await startServer(app, PDF_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down PDF service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('PDF service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in PDF service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start PDF service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startPDFService()
    .then(() => {
      logger.info('PDF Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start PDF Service:', error)
      process.exit(1)
    })
}
