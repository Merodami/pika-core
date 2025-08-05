import { PAYMENT_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createPaymentServer } from './server.js'

// Local initialization functions
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

    const { app } = await createPaymentServer({
      prisma,
      cacheService,
    })

    // Start server with startServer utility
    await startServer(app, PAYMENT_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down payment service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start payment service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
