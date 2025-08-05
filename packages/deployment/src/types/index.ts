import type { PrismaClient } from '@prisma/client'
import type { Application } from 'express'
import type { Server } from 'http'

export type DeploymentPlatform = 'vercel' | 'aws' | 'kubernetes' | 'local'
export type Environment = 'development' | 'staging' | 'production'

export interface ServiceDefinition {
  name: string
  port: number
  basePath: string
  healthCheck: string
  createApp: (dependencies: ServiceDependencies) => Promise<Application>
}

export interface ServiceDependencies {
  prisma: PrismaClient
  cache: any // Using any for cache service to avoid circular dependency
  services?: ServiceClients
}

export interface ServiceClients {
  auth?: any
  user?: any
  payment?: any
  subscription?: any
  communication?: any
  support?: any
  storage?: any
  fileStorage?: any
}

export interface InfrastructureConfig {
  database: {
    url: string
    ssl?: boolean
    poolSize?: number
  }
  cache: {
    url: string
    ttl?: number
    ssl?: boolean
  }
  storage: {
    type: 's3' | 'blob' | 'minio' | 'local'
    endpoint?: string
    bucket?: string
    region?: string
    accessKey?: string
    secretKey?: string
  }
  email?: {
    provider: 'resend' | 'sendgrid' | 'ses'
    apiKey?: string
    from?: string
  }
}

export interface DeploymentConfig {
  platform: DeploymentPlatform
  environment: Environment
  region?: string
  services: ServiceDefinition[]
  infrastructure: InfrastructureConfig
  gateway?: {
    enabled: boolean
    port?: number
    rateLimit?: {
      windowMs: number
      max: number
    }
  }
  monitoring?: {
    enabled: boolean
    provider?: 'datadog' | 'newrelic' | 'prometheus'
  }
}

export interface DeploymentAdapter {
  readonly platform: DeploymentPlatform

  initialize(): Promise<void>
  createApp(): Promise<Application>
  startServer(app: Application): Promise<Server | void>
  shutdown(): Promise<void>

  // Service discovery
  getServiceUrl(serviceName: string): string
  isServiceAvailable(serviceName: string): Promise<boolean>

  // Health checks
  healthCheck(): Promise<HealthCheckResult>
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  services: Record<
    string,
    {
      status: 'up' | 'down'
      latency?: number
      error?: string
    }
  >
  infrastructure: {
    database: boolean
    cache: boolean
    storage: boolean
  }
}

export interface ServiceRegistry {
  register(service: ServiceDefinition): void
  get(serviceName: string): ServiceDefinition | undefined
  list(): ServiceDefinition[]
  getUrl(serviceName: string): string
  getBasePath(serviceName: string): string
}
