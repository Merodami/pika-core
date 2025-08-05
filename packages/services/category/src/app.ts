import { CATEGORY_SERVICE_PORT, REDIS_PASSWORD } from '@pika/environment'
import { startServer } from '@pika/http'
import {
  type ICacheService,
  initializeCache,
  RedisConfigService,
} from '@pika/redis'
import { logger } from '@pika/shared'
import { createTranslationService, TranslationClient } from '@pika/translation'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

import { createCategoryServer } from './server.js'

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

export async function startCategoryService(): Promise<void> {
  let prisma: PrismaClient | undefined
  let cacheService: ICacheService | undefined
  let translationRedis: any | undefined

  try {
    // Initialize dependencies
    prisma = await initializeDatabase()
    cacheService = await initializeCache()

    // Create translation service and client
    // Use the same Redis configuration as the cache service
    const redisConfig = RedisConfigService.getInstance().getConfig()

    translationRedis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: REDIS_PASSWORD,
      db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
    })

    const translationService = createTranslationService(
      prisma,
      translationRedis,
    )
    const translationClient = new TranslationClient(translationService)

    const { app } = await createCategoryServer({
      prisma,
      cacheService,
      translationClient,
    })

    // Start the server
    await startServer(app, CATEGORY_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Category service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Category service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Category service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start category service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
