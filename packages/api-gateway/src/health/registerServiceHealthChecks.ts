import {
  AUTH_API_URL,
  COMMUNICATION_API_URL,
  FILE_STORAGE_API_URL,
  PAYMENT_API_URL,
  SUBSCRIPTION_API_URL,
  SUPPORT_API_URL,
  USER_API_URL,
} from '@pika/environment'
import type { HealthCheckConfig } from '@pika/http'
import { logger } from '@pika/shared'

/**
 * Register health checks for all services
 * @param isLocalDev - Whether running in development mode
 * @returns Array of health check configurations
 */
export async function registerServiceHealthChecks(
  isLocalDev: boolean,
): Promise<HealthCheckConfig[]> {
  const healthChecks: HealthCheckConfig[] = []

  logger.debug('Registering service health checks', {
    component: 'api-gateway',
    operation: 'health-checks',
    isLocalDev,
  })

  // Add health checks for each service
  const services = [
    {
      name: 'auth',
      url: AUTH_API_URL,
    },
    {
      name: 'user',
      url: USER_API_URL,
    },
    {
      name: 'payment',
      url: PAYMENT_API_URL,
    },
    {
      name: 'subscription',
      url: SUBSCRIPTION_API_URL,
    },
    {
      name: 'communication',
      url: COMMUNICATION_API_URL,
    },
    {
      name: 'support',
      url: SUPPORT_API_URL,
    },
    {
      name: 'file-storage',
      url: FILE_STORAGE_API_URL,
    },
  ]

  for (const service of services) {
    healthChecks.push({
      name: `${service.name}-service`,
      check: async () => {
        try {
          const response = await fetch(`${service.url}/api/v1/health`)

          return response.ok
        } catch (error) {
          if (isLocalDev) {
            logger.warn(`Health check failed for ${service.name}:`, error)
          }

          return false
        }
      },
      details: {
        type: 'Service',
        essential: true,
      },
    })
  }

  return healthChecks
}
