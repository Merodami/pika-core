import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_BUCKET,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
  FILE_STORAGE_SERVICE_PORT,
} from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createStorageServer } from './server.js'

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

    const app = await createStorageServer({
      port: FILE_STORAGE_SERVICE_PORT,
      prisma,
      cacheService,
      storageConfig: {
        region: AWS_S3_REGION,
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
        bucketName: AWS_S3_BUCKET,
        endpoint: AWS_S3_ENDPOINT,
      },
    })

    // Start the server
    await startServer(app, FILE_STORAGE_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Storage service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Storage service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Storage service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start storage service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
