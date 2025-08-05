import { MemoryCacheService } from '@pika/redis'
import { PrismaClient } from '@prisma/client'
import express, { type Application } from 'express'

/**
 * Test Harness for Deployment Adapter Tests
 * Following the Service Component Test pattern from microservices.io
 *
 * This creates test doubles for all service dependencies
 * allowing us to test the deployment adapter in isolation
 */

// Mock Express app factory
export function createMockExpressApp(): Application {
  const app = express() as any

  // Add health endpoint for testing
  app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', service: 'mock' })
  })

  return app
}

// Test service factory that creates minimal service apps
export function createTestServiceFactory() {
  return {
    async createAuthServer() {
      return createMockExpressApp()
    },

    async createCommunicationServer() {
      return createMockExpressApp()
    },

    async createGymServer() {
      return createMockExpressApp()
    },

    async createPaymentServer() {
      return { app: createMockExpressApp() }
    },

    async createSessionServer() {
      return createMockExpressApp()
    },

    async createSocialServer() {
      return { app: createMockExpressApp() }
    },

    async createStorageServer() {
      return createMockExpressApp()
    },

    async createSubscriptionServer() {
      return { app: createMockExpressApp() }
    },

    async createSupportServer() {
      return { app: createMockExpressApp() }
    },

    async createUserServer() {
      return createMockExpressApp()
    },
  }
}

// Test service client factory
export function createTestServiceClients() {
  class MockServiceClient {
    constructor(public config: any) {}

    async healthCheck() {
      return { status: 'healthy', service: this.config.serviceName }
    }

    async get(path: string) {
      return { success: true, path }
    }

    async post(path: string, data: any) {
      return { success: true, path, data }
    }
  }

  return {
    user: new MockServiceClient({ serviceName: 'user' }),
    gym: new MockServiceClient({ serviceName: 'gym' }),
    payment: new MockServiceClient({ serviceName: 'payment' }),
    communication: new MockServiceClient({ serviceName: 'communication' }),
    session: new MockServiceClient({ serviceName: 'session' }),
    subscription: new MockServiceClient({ serviceName: 'subscription' }),
    storage: new MockServiceClient({ serviceName: 'storage' }),
  }
}

// Test infrastructure factory
export function createTestInfrastructure() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.DATABASE_TEST_URL ||
          'postgresql://test:test@localhost:5432/test',
      },
    },
  })

  const cache = new MemoryCacheService()

  return { prisma, cache }
}

// Main test harness
export interface TestHarness {
  infrastructure: {
    prisma: PrismaClient
    cache: MemoryCacheService
  }
  serviceFactory: ReturnType<typeof createTestServiceFactory>
  serviceClients: ReturnType<typeof createTestServiceClients>
  config: any
  cleanup: () => Promise<void>
}

export function createTestHarness(): TestHarness {
  const { prisma, cache } = createTestInfrastructure()
  const serviceFactory = createTestServiceFactory()
  const serviceClients = createTestServiceClients()

  const config = {
    environment: 'test',
    infrastructure: {
      database: {
        url:
          process.env.DATABASE_TEST_URL ||
          'postgresql://test:test@localhost:5432/test',
      },
      cache: {
        url: 'redis://localhost:6379',
        ttl: 60,
      },
      storage: {
        type: 'local',
        bucket: 'test-bucket',
      },
    },
    gateway: {
      enabled: false,
    },
  }

  const cleanup = async () => {
    await prisma.$disconnect()
    await cache.disconnect()
  }

  return {
    infrastructure: { prisma, cache },
    serviceFactory,
    serviceClients,
    config,
    cleanup,
  }
}

// Integration test helper that uses real services
export async function createIntegrationTestHarness() {
  const harness = createTestHarness()

  // Override with real implementations if needed
  // This allows progressive enhancement from unit to integration tests

  return harness
}
