import { HEALTH_CHECK_CACHE_TIME } from '@pika/environment'
import {
  HealthCheckFunction,
  HealthCheckOptions,
  HealthStatus,
  ServiceHealth,
  SystemHealth,
} from '@shared/infrastructure/health/types.js'
import logger from '@shared/infrastructure/logger/Logger.js'

const DEFAULT_OPTIONS: HealthCheckOptions = {
  name: 'service',
  path: '/health',
  cacheTime: HEALTH_CHECK_CACHE_TIME,
  logResults: false,
}

export class HealthCheck {
  private services: Map<string, HealthCheckFunction> = new Map()
  private lastCheck: SystemHealth | null = null
  private lastCheckTime: number = 0
  private options: Required<HealthCheckOptions>
  private startTime: number

  constructor(options: HealthCheckOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<HealthCheckOptions>

    this.startTime = Date.now()
  }

  /**
   * Register a health check for a service
   * @param name The name of the service
   * @param checkFn A function that returns a promise that resolves to a boolean
   */
  register(name: string, checkFn: HealthCheckFunction): void {
    this.services.set(name, checkFn)
  }

  /**
   * Unregister a health check
   * @param name The name of the service
   */
  unregister(name: string): void {
    this.services.delete(name)
  }

  /**
   * Get the complete health status of the system
   * @returns Health check result for the entire system
   */
  async getHealth(): Promise<SystemHealth> {
    const now = Date.now()

    // Return cached result if within cache time
    if (this.lastCheck && now - this.lastCheckTime < this.options.cacheTime) {
      return this.lastCheck
    }

    const servicesHealth: ServiceHealth[] = []

    let systemStatus: HealthStatus = 'healthy'

    // Check each registered service
    for (const [name, checkFn] of this.services.entries()) {
      try {
        const isHealthy = await Promise.resolve(checkFn())

        const serviceStatus: HealthStatus = isHealthy ? 'healthy' : 'unhealthy'

        if (serviceStatus === 'unhealthy' && systemStatus === 'healthy') {
          systemStatus = 'degraded'
        }

        servicesHealth.push({
          name,
          status: serviceStatus,
        })
      } catch (error) {
        if (systemStatus === 'healthy') {
          systemStatus = 'degraded'
        }

        servicesHealth.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // If all services are unhealthy, system is unhealthy
    if (servicesHealth.every((service) => service.status === 'unhealthy')) {
      systemStatus = 'unhealthy'
    }

    const health: SystemHealth = {
      status: systemStatus,
      services: servicesHealth,
      timestamp: new Date().toISOString(),
      version: this.options.version,
      uptime: Math.floor((now - this.startTime) / 1000), // uptime in seconds
    }

    // Update cache
    this.lastCheck = health
    this.lastCheckTime = now

    if (this.options.logResults) {
      logger.info(`Health check result: ${health.status}`)
    }

    return health
  }

  /**
   * Get a simplified liveness check status
   * @returns Object with status and timestamp
   */
  async getLiveness(): Promise<{ status: HealthStatus; timestamp: string }> {
    return {
      status: 'healthy', // Always return healthy if the process is running
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get readiness status
   * @returns The complete health check result
   */
  async getReadiness(): Promise<SystemHealth> {
    return this.getHealth()
  }
}
