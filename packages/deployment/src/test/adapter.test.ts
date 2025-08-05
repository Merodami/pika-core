import express from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { createDeploymentAdapter } from '../factory.js'
import type { DeploymentAdapter } from '../types/index.js'
import { createTestHarness, type TestHarness } from './test-harness.js'

// Mock service modules to use our test harness
let testHarness: TestHarness

vi.mock('@pika/auth-service', () => ({
  createAuthServer: () => testHarness.serviceFactory.createAuthServer(),
}))

vi.mock('@pika/communication', () => ({
  createCommunicationServer: () =>
    testHarness.serviceFactory.createCommunicationServer(),
}))

vi.mock('@gym/server.js', () => ({
  createGymServer: () => testHarness.serviceFactory.createGymServer(),
}))

vi.mock('@pika/payment', () => ({
  createPaymentServer: () => testHarness.serviceFactory.createPaymentServer(),
}))

vi.mock('@session/server.js', () => ({
  createSessionServer: () => testHarness.serviceFactory.createSessionServer(),
}))

vi.mock('@social/server.js', () => ({
  createSocialServer: () => testHarness.serviceFactory.createSocialServer(),
}))

vi.mock('@pika/storage', () => ({
  createStorageServer: () => testHarness.serviceFactory.createStorageServer(),
}))

vi.mock('@pika/subscription', () => ({
  createSubscriptionServer: () =>
    testHarness.serviceFactory.createSubscriptionServer(),
}))

vi.mock('@pika/support', () => ({
  createSupportServer: () => testHarness.serviceFactory.createSupportServer(),
}))

vi.mock('@pika/user', () => ({
  createUserServer: () => testHarness.serviceFactory.createUserServer(),
}))

// Mock shared service clients
vi.mock('@pika/shared', () => ({
  BaseServiceClient: class {
    constructor(config: any) {
      this.serviceName = config.serviceName
    }

    protected async request(path: string) {
      return { data: { status: 'ok' } }
    }
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  ErrorFactory: {
    fromError: (err: any) => err,
    resourceNotFound: (resource: string, id: string) =>
      new Error(`${resource} ${id} not found`),
  },
  UserServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  GymServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  PaymentServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  CommunicationServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  SessionServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  SubscriptionServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
  StorageServiceClient: class {
    async healthCheck() {
      return { status: 'ok' }
    }
  },
}))

// Service Component Test Pattern
// Testing the deployment adapter with test doubles for external dependencies
// These tests require extensive mocking of all microservices
// See adapter-component.test.ts for simpler unit tests
describe.skip('Deployment Adapter Integration Tests', () => {
  let adapter: DeploymentAdapter
  let app: express.Application

  beforeAll(async () => {
    // Create test harness
    testHarness = createTestHarness()

    // Create adapter in local mode with test configuration
    adapter = await createDeploymentAdapter('local', testHarness.config)

    // Create the Express app
    app = await adapter.createApp()
  })

  afterAll(async () => {
    await adapter.shutdown()
    await testHarness.cleanup()
  })

  describe('Adapter Initialization', () => {
    it('should create adapter with correct platform', () => {
      expect(adapter.platform).toBe('local')
    })

    it('should register all services', async () => {
      const services = [
        'auth',
        'user',
        'gym',
        'session',
        'payment',
        'subscription',
        'communication',
        'social',
        'support',
        'storage',
      ]

      for (const service of services) {
        const isAvailable = await adapter.isServiceAvailable(service)

        expect(isAvailable).toBe(true)
      }
    })

    it('should provide service URLs', () => {
      const authUrl = adapter.getServiceUrl('auth')

      expect(authUrl).toBe('/auth')

      const userUrl = adapter.getServiceUrl('user')

      expect(userUrl).toBe('/users')
    })
  })

  describe('Health Checks', () => {
    it('should return health status', async () => {
      const health = await adapter.healthCheck()

      expect(health.status).toMatch(/healthy|degraded|unhealthy/)
      expect(health.services).toBeDefined()
      expect(health.infrastructure).toBeDefined()
    })

    it('should check infrastructure components', async () => {
      const health = await adapter.healthCheck()

      expect(health.infrastructure).toHaveProperty('database')
      expect(health.infrastructure).toHaveProperty('cache')
      expect(health.infrastructure).toHaveProperty('storage')
    })
  })

  describe('Express App Integration', () => {
    it('should create Express app', () => {
      expect(app).toBeDefined()
      expect(app.listen).toBeDefined()
    })

    it('should respond to health endpoint', async () => {
      const response = await supertest(app).get('/health').expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('services')
    })

    it('should mount all service routes', async () => {
      // Test a few service endpoints
      const endpoints = [
        { path: '/auth/health', service: 'auth' },
        { path: '/users/health', service: 'user' },
        { path: '/gyms/health', service: 'gym' },
      ]

      for (const endpoint of endpoints) {
        const response = await supertest(app).get(endpoint.path).expect(200)

        expect(response.body).toHaveProperty('status', 'ok')
        expect(response.body).toHaveProperty('service', endpoint.service)
      }
    })

    it('should handle 404 for unknown routes', async () => {
      const response = await supertest(app).get('/unknown-route').expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('Service Communication', () => {
    it('should allow inter-service communication', async () => {
      // This would test that services can call each other
      // For now, just verify the URLs are correct
      const sessionUrl = adapter.getServiceUrl('session')
      const userUrl = adapter.getServiceUrl('user')

      expect(sessionUrl).toBe('/sessions')
      expect(userUrl).toBe('/users')
    })
  })

  describe('Error Handling', () => {
    it('should handle service not found', () => {
      expect(() => adapter.getServiceUrl('non-existent')).toThrow()
    })

    it('should handle global errors', async () => {
      // Test error handling by triggering an error
      const response = await supertest(app)
        .post('/auth/login')
        .send({}) // Invalid body
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
