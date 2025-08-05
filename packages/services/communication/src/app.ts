import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  COMMUNICATION_SERVICE_PORT,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
} from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createCommunicationServer } from './server.js'

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

    const app = await createCommunicationServer({
      port: COMMUNICATION_SERVICE_PORT,
      prisma,
      cacheService,
      emailConfig: {
        region: AWS_REGION || 'us-east-1',
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        fromEmail: EMAIL_FROM || 'noreply@pikaom',
        fromName: EMAIL_FROM_NAME || 'Pika',
      },
    })

    // Start the server
    await startServer(app, COMMUNICATION_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Communication service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Communication service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error(
          'Unhandled Promise Rejection in Communication service:',
          reason,
        )
      },
    })
  } catch (error) {
    logger.error('Failed to start communication service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
