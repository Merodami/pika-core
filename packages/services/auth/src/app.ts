import { AUTH_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import {
  CommunicationServiceClient,
  logger,
  UserServiceClient,
} from '@pika/shared'

import { createAuthServer } from './server.js'

export async function startService(): Promise<void> {
  let cacheService: ICacheService | undefined
  let userServiceClient: UserServiceClient | undefined
  let communicationClient: CommunicationServiceClient | undefined

  try {
    // Initialize dependencies
    cacheService = await initializeCache()

    // Initialize service clients
    userServiceClient = new UserServiceClient()
    communicationClient = new CommunicationServiceClient()

    const app = await createAuthServer({
      port: AUTH_SERVICE_PORT,
      cacheService,
      userServiceClient,
      communicationClient,
    })

    // Start the server
    await startServer(app, AUTH_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Auth service...')
        await cacheService?.disconnect()
        logger.info('Auth service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Auth service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start auth service', error)

    // Cleanup on startup failure
    await cacheService?.disconnect()

    throw error
  }
}
