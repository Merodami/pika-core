import { SUBSCRIPTION_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createSubscriptionServer } from './server.js'

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

    const { app } = await createSubscriptionServer({
      prisma,
      cacheService,
    })

    // Start the server
    await startServer(app, SUBSCRIPTION_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Subscription service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Subscription service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error(
          'Unhandled Promise Rejection in Subscription service:',
          reason,
        )
      },
    })
  } catch (error) {
    logger.error('Failed to start subscription service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
