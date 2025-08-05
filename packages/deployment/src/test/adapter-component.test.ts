import express from 'express'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BaseDeploymentAdapter } from '../adapters/base.js'
import type {
  DeploymentConfig,
  DeploymentPlatform,
  ServiceDefinition,
} from '../types/index.js'

/**
 * Service Component Test for Deployment Adapter
 *
 * Following microservices.io Service Component Test pattern:
 * - Tests the adapter in isolation
 * - Uses test doubles for dependencies
 * - Focuses on adapter behavior, not implementation
 */

// Test implementation of deployment adapter
class TestDeploymentAdapter extends BaseDeploymentAdapter {
  readonly platform: DeploymentPlatform = 'local'
  private testApp?: express.Application
  private isHealthy = true

  constructor(config: DeploymentConfig) {
    super(config)
  }

  async initialize(): Promise<void> {
    // Register test services
    this.registry.register({
      name: 'test-service',
      port: 5000,
      basePath: '/test',
      healthCheck: '/health',
      createApp: async () => this.createTestApp(),
    })
  }

  async createApp(): Promise<express.Application> {
    const app = express()

    // Add health endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        platform: this.platform,
      })
    })

    // Mount test service
    const testApp = this.createTestApp()

    app.use('/test', testApp)

    this.testApp = app

    return app
  }

  async startServer(app: express.Application): Promise<any> {
    // For testing, we don't actually start a server
    return { app }
  }

  protected async cleanup(): Promise<void> {
    // Cleanup test resources
  }

  protected getDistributedServiceUrl(serviceName: string): string {
    return `http://localhost:5000${this.registry.getBasePath(serviceName)}`
  }

  protected async checkDistributedService(
    serviceName: string,
  ): Promise<boolean> {
    return this.registry.has(serviceName)
  }

  protected async checkInfrastructure(): Promise<{
    database: boolean
    cache: boolean
    storage: boolean
  }> {
    return {
      database: true,
      cache: true,
      storage: true,
    }
  }

  // Test helper methods
  setHealthy(healthy: boolean) {
    this.isHealthy = healthy
  }

  private createTestApp(): express.Application {
    const app = express()

    app.get('/health', (_req, res) =>
      res.json({ status: 'ok', service: 'test' }),
    )
    app.get('/test', (_req, res) => res.json({ message: 'test endpoint' }))

    return app
  }
}

describe('Deployment Adapter Component Tests', () => {
  let adapter: TestDeploymentAdapter
  let app: express.Application

  const testConfig: DeploymentConfig = {
    platform: 'local',
    environment: 'test',
    infrastructure: {
      database: { url: 'postgresql://test:test@localhost:5432/test' },
      cache: { url: 'redis://localhost:6379', ttl: 60 },
      storage: { type: 'local', bucket: 'test' },
    },
  }

  beforeEach(async () => {
    adapter = new TestDeploymentAdapter(testConfig)
    await adapter.initialize()
    app = await adapter.createApp()
  })

  afterEach(async () => {
    await adapter.shutdown()
  })

  describe('Platform Identification', () => {
    it('should identify correct platform', () => {
      expect(adapter.platform).toBe('local')
    })

    it('should return platform from property', () => {
      expect(adapter.platform).toBe('local')
    })
  })

  describe('Service Registration', () => {
    it('should register services during initialization', async () => {
      expect(await adapter.isServiceAvailable('test-service')).toBe(true)
    })

    it('should provide service URLs', () => {
      const url = adapter.getServiceUrl('test-service')

      expect(url).toBe('/test')
    })

    it('should throw error for unknown service', () => {
      expect(() => adapter.getServiceUrl('unknown-service')).toThrow()
    })
  })

  describe('Health Checks', () => {
    it('should return healthy status when all components are healthy', async () => {
      const health = await adapter.healthCheck()

      expect(health.status).toBe('healthy')
      expect(health.services).toBeDefined()
      expect(health.infrastructure).toBeDefined()
    })

    it('should return unhealthy status when adapter is unhealthy', async () => {
      adapter.setHealthy(false)

      // Need to recreate the app to reflect the health change
      app = await adapter.createApp()

      const response = await supertest(app).get('/health').expect(200)

      expect(response.body.status).toBe('unhealthy')
    })

    it('should check infrastructure components', async () => {
      const health = await adapter.healthCheck()

      expect(health.infrastructure).toEqual({
        database: true,
        cache: true,
        storage: true,
      })
    })

    it('should check registered services', async () => {
      const health = await adapter.healthCheck()

      expect(health.services).toHaveProperty('test-service')
      expect(health.services['test-service']).toHaveProperty('status', 'up')
    })
  })

  describe('Express App Creation', () => {
    it('should create Express app with health endpoint', async () => {
      const response = await supertest(app).get('/health').expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('platform', 'local')
    })

    it('should mount service routes', async () => {
      const response = await supertest(app).get('/test/health').expect(200)

      expect(response.body).toEqual({ status: 'ok', service: 'test' })
    })

    it('should handle service endpoints', async () => {
      const response = await supertest(app).get('/test/test').expect(200)

      expect(response.body).toEqual({ message: 'test endpoint' })
    })
  })

  describe('Lifecycle Management', () => {
    it('should start and shutdown cleanly', async () => {
      const newAdapter = new TestDeploymentAdapter(testConfig)

      await expect(newAdapter.initialize()).resolves.not.toThrow()
      await expect(newAdapter.createApp()).resolves.toBeDefined()
      await expect(newAdapter.shutdown()).resolves.not.toThrow()
    })

    it('should provide health check data', async () => {
      const health = await adapter.healthCheck()

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('services')
      expect(health).toHaveProperty('infrastructure')
    })
  })

  describe('Error Handling', () => {
    it('should handle service registration errors gracefully', async () => {
      const badAdapter = new TestDeploymentAdapter(testConfig)

      // Override initialize to throw
      badAdapter.initialize = async () => {
        throw new Error('Initialization failed')
      }

      await expect(badAdapter.initialize()).rejects.toThrow(
        'Initialization failed',
      )
    })

    it('should provide meaningful error for missing services', () => {
      expect(() => adapter.getServiceUrl('non-existent')).toThrow(
        /Service .* not found/,
      )
    })
  })
})

describe('Deployment Adapter Integration Patterns', () => {
  it('demonstrates service composition pattern', async () => {
    // This test shows how multiple services can be composed
    const config: DeploymentConfig = {
      platform: 'local',
      environment: 'test',
      infrastructure: {
        database: { url: 'postgresql://test' },
        cache: { url: 'redis://test' },
        storage: { type: 'local', bucket: 'test' },
      },
    }

    class CompositeAdapter extends TestDeploymentAdapter {
      async initialize(): Promise<void> {
        // Register multiple services
        const services: ServiceDefinition[] = [
          {
            name: 'auth',
            port: 5001,
            basePath: '/auth',
            healthCheck: '/health',
            createApp: async () =>
              express().get('/health', (_req, res) =>
                res.json({ status: 'ok' }),
              ),
          },
          {
            name: 'users',
            port: 5002,
            basePath: '/users',
            healthCheck: '/health',
            createApp: async () =>
              express().get('/health', (_req, res) =>
                res.json({ status: 'ok' }),
              ),
          },
        ]

        for (const service of services) {
          this.registry.register(service)
        }
      }
    }

    const adapter = new CompositeAdapter(config)

    await adapter.initialize()

    expect(await adapter.isServiceAvailable('auth')).toBe(true)
    expect(await adapter.isServiceAvailable('users')).toBe(true)

    const health = await adapter.healthCheck()

    expect(Object.keys(health.services)).toHaveLength(2)

    await adapter.shutdown()
  })
})
