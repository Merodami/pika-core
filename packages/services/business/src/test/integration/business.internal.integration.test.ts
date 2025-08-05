/**
 * Business Service - Internal API Integration Tests
 *
 * Tests for internal service-to-service business endpoints.
 * These endpoints are only accessible by other services using API key authentication.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared') // Unmock shared to use real error classes with real middleware

import { createBusinessServer } from '@business/server.js'
import {
  createSharedBusinessTestData,
  seedTestBusinesses,
  type SharedBusinessTestData,
} from '@business/test/helpers/businessTestHelpers.js'
import { SERVICE_API_KEY } from '@pika/environment'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createTestDatabase,
  InternalAPITestHelper,
  TestDatabaseResult,
} from '@pika/tests'
import { TranslationClient } from '@pika/translation'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Note: Using shared helper from businessTestHelpers.js

describe('Business Service - Internal API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let cacheService: MemoryCacheService
  let translationClient: TranslationClient
  let internalAPIHelper: InternalAPITestHelper
  let internalClient: any

  // Shared test data created once
  let sharedTestData: SharedBusinessTestData

  beforeAll(async () => {
    logger.debug(
      'Setting up Business Service Internal API integration tests...',
    )

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Initialize Internal API Helper using the actual SERVICE_API_KEY from environment
    internalAPIHelper = new InternalAPITestHelper(SERVICE_API_KEY)
    internalAPIHelper.setup() // This ensures consistency

    // Create server AFTER setting up API key
    cacheService = new MemoryCacheService()
    translationClient = new TranslationClient()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Create internal client with proper headers
    internalClient = internalAPIHelper.createClient(app)

    logger.debug('Internal API setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedBusinessTestData(testDb.prisma)
    logger.debug(
      `Created ${sharedTestData.allBusinesses.length} test businesses`,
    )
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Don't clean up shared test data between tests - only clean any extra data created
    // This preserves the shared test data created in beforeAll
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    internalAPIHelper.cleanup() // Clean up

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Internal Service Discovery
  describe('GET /internal/businesses/category/:categoryId', () => {
    it('should get businesses by category for internal services', async () => {
      // No query parameters - should get all businesses (no filtering)
      const response = await internalClient
        .get(
          `/internal/businesses/category/${sharedTestData.activeCategory.id}`,
        )
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)

      // Should have businesses from shared data in that category
      const businessesInCategory = sharedTestData.allBusinesses.filter(
        (b) => b.categoryId === sharedTestData.activeCategory.id,
      )

      expect(response.body.data.length).toBeGreaterThanOrEqual(
        businessesInCategory.length,
      )
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('id')
        expect(response.body.data[0]).toHaveProperty('businessNameKey')
      }
    })

    it('should apply filters when specified', async () => {
      // Test with explicit filters
      const response = await internalClient
        .get(
          `/internal/businesses/category/${sharedTestData.activeCategory.id}?onlyActive=true&onlyVerified=false`,
        )
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)

      // Should only return businesses that are active=true AND verified=false
      if (response.body.data.length > 0) {
        response.body.data.forEach((business: any) => {
          expect(business.active).toBe(true)
          expect(business.verified).toBe(false)
        })
      }
    })

    it('should return empty array for categories with no businesses', async () => {
      const emptyCategory = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.empty`,
          descriptionKey: `category.description.empty`,
          slug: `empty-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          isActive: true,
          sortOrder: 1,
          createdBy: uuid(),
        },
      })

      const response = await internalClient
        .get(`/internal/businesses/category/${emptyCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toEqual([])
    })
  })

  describe('POST /internal/businesses/batch', () => {
    it('should batch get businesses by IDs', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 5,
      })
      const businessIds = businesses.slice(0, 3).map((b) => b.id)

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.businesses).toHaveLength(3)
      expect(response.body.businesses.map((b: any) => b.id).sort()).toEqual(
        businessIds.sort(),
      )
    })

    it('should handle non-existent IDs gracefully', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 2,
      })
      const validId = businesses[0].id
      const nonExistentIds = [uuid(), uuid()]

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [validId, ...nonExistentIds] })
        .set('Accept', 'application/json')
        .expect(200)

      // Should only return the valid business
      expect(response.body.businesses).toHaveLength(1)
      expect(response.body.businesses[0].id).toBe(validId)
    })

    it('should reject empty businessIds array', async () => {
      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [] })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('Too small')
    })
  })

  describe('GET /internal/businesses/user/:id', () => {
    it('should get business by user ID for internal services', async () => {
      // Use business from shared test data
      const businessWithUser = sharedTestData.allBusinesses[0]

      const response = await internalClient
        .get(`/internal/businesses/user/${businessWithUser.userId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(businessWithUser.id)
      expect(response.body.userId).toBe(businessWithUser.userId)
    })

    it('should return 404 for user without business', async () => {
      const userWithoutBusiness = uuid()

      await internalClient
        .get(`/internal/businesses/user/${userWithoutBusiness}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /internal/businesses/:id', () => {
    it('should get business by ID for internal services', async () => {
      // Use business from shared test data
      const business = sharedTestData.activeBusinesses[0]

      const response = await internalClient
        .get(`/internal/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      expect(response.body.businessNameKey).toBe(business.businessNameKey)
      expect(response.body.userId).toBe(business.userId)
    })

    it('should return 404 for non-existent business', async () => {
      const nonExistentId = uuid()

      await internalClient
        .get(`/internal/businesses/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Security Tests
  describe('Internal API Security', () => {
    it('should require API key for internal endpoints', async () => {
      // Test without API key
      await request
        .get(`/internal/businesses/${uuid()}`)
        .set('Accept', 'application/json')
        .expect(401)

      await request
        .post('/internal/businesses/batch')
        .send({ businessIds: [] })
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should reject invalid API keys', async () => {
      await request
        .get('/internal/businesses/by-category')
        .set('x-api-key', 'invalid-api-key')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should include service identification headers', async () => {
      // The internal client should automatically add service headers
      const { businesses } = await seedTestBusinesses(testDb.prisma)

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [businesses[0].id] })
        .set('Accept', 'application/json')
        .expect(200)

      // Service should process the request successfully with proper headers
      expect(response.body.businesses).toHaveLength(1)
    })
  })

  // Performance and Bulk Operations
  describe('Internal API Performance', () => {
    it('should efficiently handle large batch requests', async () => {
      // Create many businesses
      const allBusinesses = []

      for (let i = 0; i < 5; i++) {
        const { businesses } = await seedTestBusinesses(testDb.prisma, {
          count: 10,
        })

        allBusinesses.push(...businesses)
      }

      const businessIds = allBusinesses.map((b) => b.id)

      const startTime = Date.now()
      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds })
        .set('Accept', 'application/json')
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.body.businesses).toHaveLength(50)
      // Should complete within reasonable time (< 1.5 seconds for 50 records)
      expect(duration).toBeLessThan(1500)
    })

    it('should handle concurrent requests', async () => {
      const { businesses, category } = await seedTestBusinesses(testDb.prisma, {
        count: 10,
      })

      // Make multiple concurrent requests
      const promises = [
        internalClient.get(`/internal/businesses/category/${category.id}`),
        internalClient
          .post('/internal/businesses/batch')
          .send({ businessIds: businesses.map((b) => b.id) }),
        internalClient.get(`/internal/businesses/user/${businesses[0].userId}`),
      ]

      const results = await Promise.all(promises)

      // All requests should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200)
      })
    })
  })

  // Data Consistency Tests
  describe('Internal API Data Consistency', () => {
    it('should return consistent data across different endpoints', async () => {
      // Use an existing business from shared test data
      const business = sharedTestData.verifiedBusinesses[0]
      const userId = business.userId

      // Get the same business through different endpoints
      const [batchResponse, userResponse] = await Promise.all([
        internalClient
          .post('/internal/businesses/batch')
          .send({ businessIds: [business.id] }),
        internalClient.get(`/internal/businesses/user/${userId}`),
      ])

      // Data should be consistent
      expect(batchResponse.body.businesses[0].id).toBe(userResponse.body.id)
      expect(batchResponse.body.businesses[0].businessNameKey).toBe(
        userResponse.body.businessNameKey,
      )
      expect(batchResponse.body.businesses[0].avgRating).toBe(
        userResponse.body.avgRating,
      )
    })

    it('should handle includes properly', async () => {
      // Use business from shared test data
      const business = sharedTestData.activeBusinesses[0]

      // Get business with includes
      const response = await internalClient
        .get(`/internal/businesses/${business.id}?include=user,category`)
        .expect(200)

      // Should include relations when requested
      expect(response.body.id).toBe(business.id)
      expect(response.body.businessNameKey).toBe(business.businessNameKey)
    })
  })
})
