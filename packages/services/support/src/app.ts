import { SUPPORT_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createSupportServer } from './server.js'

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

export async function startService(): Promise<void> {
  let prisma: PrismaClient | undefined
  let cacheService: ICacheService | undefined

  try {
    // Initialize dependencies
    prisma = await initializeDatabase()
    cacheService = await initializeCache()

    const { app } = await createSupportServer({
      port: SUPPORT_SERVICE_PORT,
      prisma,
      cacheService,
    })

    // Start the server
    await startServer(app, SUPPORT_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Support service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Support service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Support service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start support service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
