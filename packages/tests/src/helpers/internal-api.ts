import type { Express } from 'express'
import supertest from 'supertest'

export interface InternalAPIClient {
  get: (url: string) => supertest.Test
  post: (url: string) => supertest.Test
  put: (url: string) => supertest.Test
  patch: (url: string) => supertest.Test
  delete: (url: string) => supertest.Test
}

/**
 * Creates an internal API client with x-api-key authentication
 * for testing service-to-service communication
 */
export function createInternalAPIClient(
  app: Express,
  apiKey: string,
  serviceName: string = 'test-service',
  serviceId: string = 'test-service-id',
): InternalAPIClient {
  const headers = {
    'x-api-key': apiKey,
    'x-service-name': serviceName,
    'x-service-id': serviceId,
  }

  return {
    get: (url: string) => supertest(app).get(url).set(headers),
    post: (url: string) => supertest(app).post(url).set(headers),
    put: (url: string) => supertest(app).put(url).set(headers),
    patch: (url: string) => supertest(app).patch(url).set(headers),
    delete: (url: string) => supertest(app).delete(url).set(headers),
  }
}

/**
 * Creates an internal API client with additional headers
 * Useful for adding correlation IDs, service names, etc.
 */
export function createInternalAPIClientWithHeaders(
  app: Express,
  apiKey: string,
  additionalHeaders: Record<string, string> = {},
): InternalAPIClient {
  return {
    get: (url: string) =>
      supertest(app).get(url).set('x-api-key', apiKey).set(additionalHeaders),
    post: (url: string) =>
      supertest(app).post(url).set('x-api-key', apiKey).set(additionalHeaders),
    put: (url: string) =>
      supertest(app).put(url).set('x-api-key', apiKey).set(additionalHeaders),
    patch: (url: string) =>
      supertest(app).patch(url).set('x-api-key', apiKey).set(additionalHeaders),
    delete: (url: string) =>
      supertest(app)
        .delete(url)
        .set('x-api-key', apiKey)
        .set(additionalHeaders),
  }
}

/**
 * Test helper for internal API authentication
 */
export class InternalAPITestHelper {
  private originalApiKey: string | undefined

  constructor(private testApiKey: string = 'test-service-api-key') {
    this.originalApiKey = process.env.SERVICE_API_KEY
  }

  /**
   * Sets up the test API key
   * Call this in beforeAll()
   */
  setup(): void {
    process.env.SERVICE_API_KEY = this.testApiKey
  }

  /**
   * Restores the original API key
   * Call this in afterAll()
   */
  cleanup(): void {
    if (this.originalApiKey !== undefined) {
      process.env.SERVICE_API_KEY = this.originalApiKey
    } else {
      delete process.env.SERVICE_API_KEY
    }
  }

  /**
   * Creates an internal API client
   */
  createClient(
    app: Express,
    serviceName: string = 'test-service',
    serviceId: string = 'test-service-id',
  ): InternalAPIClient {
    return createInternalAPIClient(app, this.testApiKey, serviceName, serviceId)
  }

  /**
   * Gets the test API key
   */
  getApiKey(): string {
    return this.testApiKey
  }
}
