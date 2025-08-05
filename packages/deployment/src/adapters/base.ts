import { logger } from '@pika/shared'
import type { Application } from 'express'
import type { Server } from 'http'

import type {
  DeploymentAdapter,
  DeploymentConfig,
  DeploymentPlatform,
  HealthCheckResult,
  ServiceDefinition,
  ServiceRegistry,
} from '../types/index.js'

export abstract class BaseDeploymentAdapter implements DeploymentAdapter {
  abstract readonly platform: DeploymentPlatform

  protected config: DeploymentConfig
  protected registry: ServiceRegistry
  protected server?: Server

  constructor(config: DeploymentConfig) {
    this.config = config
    this.registry = this.createServiceRegistry()
  }

  abstract initialize(): Promise<void>
  abstract createApp(): Promise<Application>
  abstract startServer(app: Application): Promise<Server | void>

  async shutdown(): Promise<void> {
    logger.info('Shutting down deployment adapter')

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve())
      })
    }

    // Platform-specific cleanup
    await this.cleanup()
  }

  getServiceUrl(serviceName: string): string {
    const service = this.registry.get(serviceName)

    if (!service) {
      throw new Error(`Service ${serviceName} not found in registry`)
    }

    // In local mode, services use base paths
    if (this.config.platform === 'local') {
      return this.registry.getBasePath(serviceName)
    }

    // In Vercel and distributed mode, services have their own URLs
    return this.getDistributedServiceUrl(serviceName)
  }

  async isServiceAvailable(serviceName: string): Promise<boolean> {
    try {
      const service = this.registry.get(serviceName)

      if (!service) return false

      // In monolith mode, check if the service is registered
      if (
        this.config.platform === 'vercel' ||
        this.config.platform === 'local'
      ) {
        return true
      }

      // In distributed mode, perform health check
      return await this.checkDistributedService(serviceName)
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const services: Record<string, any> = {}

    for (const service of this.registry.list()) {
      const startTime = Date.now()
      const isAvailable = await this.isServiceAvailable(service.name)

      services[service.name] = {
        status: isAvailable ? 'up' : 'down',
        latency: Date.now() - startTime,
      }
    }

    const infrastructure = await this.checkInfrastructure()

    const allServicesUp = Object.values(services).every(
      (s) => s.status === 'up',
    )
    const allInfraUp = Object.values(infrastructure).every(Boolean)

    return {
      status:
        allServicesUp && allInfraUp
          ? 'healthy'
          : Object.values(services).some((s) => s.status === 'up')
            ? 'degraded'
            : 'unhealthy',
      services,
      infrastructure,
    }
  }

  protected abstract cleanup(): Promise<void>
  protected abstract getDistributedServiceUrl(serviceName: string): string
  protected abstract checkDistributedService(
    serviceName: string,
  ): Promise<boolean>
  protected abstract checkInfrastructure(): Promise<{
    database: boolean
    cache: boolean
    storage: boolean
  }>

  private createServiceRegistry(): ServiceRegistry {
    const services = new Map<string, ServiceDefinition>()

    return {
      register(service: ServiceDefinition) {
        services.set(service.name, service)
      },

      get(serviceName: string) {
        return services.get(serviceName)
      },

      list() {
        return Array.from(services.values())
      },

      getUrl(serviceName: string) {
        const service = services.get(serviceName)

        if (!service) {
          throw new Error(`Service ${serviceName} not found`)
        }

        return `http://localhost:${service.port}`
      },

      getBasePath(serviceName: string) {
        const service = services.get(serviceName)

        if (!service) {
          throw new Error(`Service ${serviceName} not found`)
        }

        return service.basePath
      },
    }
  }
}
