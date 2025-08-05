#!/usr/bin/env tsx

/**
 * Standalone auth service runner for testing
 * This allows us to test the auth service in isolation
 */

import { AUTH_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import { createAuthServer } from './src/server.js'

async function startAuthService() {
  logger.info('Starting auth service in standalone mode...')

  // Initialize dependencies
  const prisma = new PrismaClient()
  const cacheService = new MemoryCacheService()

  try {
    // Connect to database
    await prisma.$connect()
    logger.info('Database connected')

    // Create server
    const server = await createAuthServer({
      port: AUTH_SERVICE_PORT,
      prisma,
      cacheService,
    })

    // Start server
    await startServer(server, AUTH_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down auth service...')
        await prisma.$disconnect()
      },
    })

    logger.info(
      `Auth service is running on http://localhost:${AUTH_SERVICE_PORT}`,
    )
    logger.info('Test endpoints:')
    logger.info(`  POST http://localhost:${AUTH_SERVICE_PORT}/auth/login`)
    logger.info(`  POST http://localhost:${AUTH_SERVICE_PORT}/auth/register`)
    logger.info(`  POST http://localhost:${AUTH_SERVICE_PORT}/auth/refresh`)
    logger.info(`  GET  http://localhost:${AUTH_SERVICE_PORT}/health`)
  } catch (error) {
    logger.error('Failed to start auth service:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Start the service
startAuthService()
