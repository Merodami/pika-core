import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import {
  CommunicationServiceClient,
  logger,
  UserServiceClient,
} from '@pika/shared'

import { createAuthRouter } from './routes/AuthRoutes.js'

export interface ServerConfig {
  port: number
  cacheService: ICacheService
  userServiceClient: UserServiceClient
  communicationClient?: CommunicationServiceClient
}

export async function createAuthServer(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: 'auth-service',
    port: config.port,
    cacheService: config.cacheService,
    skipAuthRegistration: true, // We don't need global auth for auth service
    authOptions: {
      excludePaths: [
        '/auth/register',
        '/auth/token',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email/*',
        '/auth/resend-verification',
        '/auth/introspect',
        '/auth/revoke',
        '/health',
        '/metrics',
      ],
    },
    healthChecks: [
      {
        name: 'redis',
        check: async () => {
          try {
            // Handle both RedisService and MemoryCacheService
            if (typeof config.cacheService.checkHealth === 'function') {
              const health = await config.cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // For MemoryCacheService that doesn't have checkHealth, do a simple operation test
            await config.cacheService.set('health_check', 'ok', 5)

            const result = await config.cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400,
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
  })

  // Mount routes
  const authRouter = createAuthRouter(
    config.cacheService,
    config.userServiceClient,
    config.communicationClient,
  )

  app.use('/auth', authRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return app
}
