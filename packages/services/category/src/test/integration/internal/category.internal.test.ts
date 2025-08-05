/**
 * Internal Category Integration Tests
 *
 * Tests internal category endpoints for service-to-service communication
 * Following SERVICE_REPLICATION_PATTERN.md
 */
import { vi } from 'vitest'

// --- START MOCKING CONFIGURATION ---
vi.unmock('@pika/http')
vi.unmock('@pika/shared')

vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi
})

vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared
})
// --- END MOCKING CONFIGURATION ---

import { createCategoryServer } from '@category/server.js'
import {
  cleanupCategoryTestData,
  createSharedCategoryTestData,
  type SharedCategoryTestData,
} from '@category/test/helpers/categoryTestHelpers.js'
import { SERVICE_API_KEY } from '@pika/environment'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createTestDatabase,
  InternalAPITestHelper,
  type TestDatabaseResult,
} from '@pika/tests'
import { MockCacheService } from '@pika/tests'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Internal Category Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let server: any
  let request: supertest.SuperTest<supertest.Test>
  let sharedTestData: SharedCategoryTestData
  let internalAPIHelper: InternalAPITestHelper
  let internalClient: any

  const mockCacheService = new MockCacheService()

  beforeAll(async () => {
    testDb = await createTestDatabase({
      databaseName: 'test_category_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    process.env.DATABASE_URL = testDb.databaseUrl

    // Initialize Internal API Helper using the actual SERVICE_API_KEY from environment
    internalAPIHelper = new InternalAPITestHelper(SERVICE_API_KEY)
    internalAPIHelper.setup() // This ensures consistency

    const serverResult = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
    })

    app = serverResult.app

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Create internal client with proper headers
    internalClient = internalAPIHelper.createClient(app)

    // Create shared test data once for all tests
    sharedTestData = await createSharedCategoryTestData(testDb.prisma)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Only clean up non-shared test data
    if (testDb?.prisma) {
      await cleanupCategoryTestData(testDb.prisma, {
        preserveSharedData: true,
        sharedCategoryIds: sharedTestData.allCategories.map((c) => c.id),
      })
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    internalAPIHelper.cleanup() // Clean up API key

    if (server) {
      server.close()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('Internal Category Service Communication', () => {
    describe('GET /internal/categories/:id', () => {
      it('should get category by ID for internal services', async () => {
        // Use shared test data
        const parentCategory = sharedTestData.activeParentCategories[0]

        const response = await internalClient
          .get(`/internal/categories/${parentCategory.id}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.id).toBe(parentCategory.id)
        expect(response.body.nameKey).toBe(parentCategory.nameKey)
      })

      it('should return 404 for non-existent category', async () => {
        const nonExistentId = uuid()

        await internalClient
          .get(`/internal/categories/${nonExistentId}`)
          .set('Accept', 'application/json')
          .expect(404)
      })
    })

    describe('POST /internal/categories/bulk', () => {
      it('should get multiple categories by IDs', async () => {
        // Use shared test data
        const parentCategory = sharedTestData.activeParentCategories[0]
        const childCategory = sharedTestData.activeChildCategories[0]
        const categoryIds = [parentCategory.id, childCategory.id]

        const response = await internalClient
          .post('/internal/categories/bulk')
          .send({ categoryIds })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.data.map((c: any) => c.id)).toEqual(
          expect.arrayContaining(categoryIds),
        )
      })

      it('should handle mix of existing and non-existing categories', async () => {
        // Use shared test data
        const parentCategory = sharedTestData.activeParentCategories[0]
        const nonExistentId = uuid()
        const categoryIds = [parentCategory.id, nonExistentId]

        const response = await internalClient
          .post('/internal/categories/bulk')
          .send({ categoryIds })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].id).toBe(parentCategory.id)
      })
    })

    describe('POST /internal/categories/validate', () => {
      it('should validate existing active categories', async () => {
        // Use shared test data
        const parentCategory = sharedTestData.activeParentCategories[0]
        const childCategory = sharedTestData.activeChildCategories[0]
        const categoryIds = [parentCategory.id, childCategory.id]

        const response = await internalClient
          .post('/internal/categories/validate')
          .send({ categoryIds, checkActive: true })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.valid).toBe(true)
        expect(response.body.results).toHaveLength(2)
        expect(response.body.results.every((r: any) => r.valid)).toBe(true)
      })

      it('should detect invalid categories', async () => {
        const nonExistentId = uuid()
        const categoryIds = [nonExistentId]

        const response = await internalClient
          .post('/internal/categories/validate')
          .send({ categoryIds, checkActive: true })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.valid).toBe(false)
        expect(response.body.results).toHaveLength(1)
        expect(response.body.results[0].valid).toBe(false)
        expect(response.body.results[0].exists).toBe(false)
      })
    })

    describe('GET /internal/categories/hierarchy', () => {
      it('should return category hierarchy for internal use', async () => {
        // Shared test data already has categories
        const response = await internalClient
          .get('/internal/categories/hierarchy')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        // The hierarchy endpoint returns root categories only (tree structure)
        expect(response.body.data).toHaveLength(
          sharedTestData.rootCategories.length,
        )
      })

      it('should filter internal category list by active status', async () => {
        // Test the getAllCategories endpoint with isActive filter
        const response = await internalClient
          .get('/internal/categories?isActive=true')
          .set('Accept', 'application/json')
          .expect(200)

        const expectedActiveCount =
          sharedTestData.activeParentCategories.length +
          sharedTestData.activeChildCategories.length

        // Response now includes pagination
        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')
        expect(response.body.data).toHaveLength(expectedActiveCount)
        expect(response.body.data.every((cat: any) => cat.isActive)).toBe(true)
        expect(response.body.pagination.total).toBe(expectedActiveCount)
      })
    })
  })

  // Error Handling Tests
  describe('Internal Error Handling', () => {
    it('should handle invalid service authentication', async () => {
      // Use shared test data
      const parentCategory = sharedTestData.activeParentCategories[0]

      // Missing service headers should fall back to JWT auth (which will fail)
      await request
        .get(`/internal/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should handle invalid UUID in bulk request', async () => {
      const response = await internalClient
        .post('/internal/categories/bulk')
        .send({ categoryIds: ['not-a-uuid'] })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
