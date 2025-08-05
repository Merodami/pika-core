/**
 * Public Category Integration Tests
 *
 * Tests public category endpoints that don't require authentication
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

  return {
    ...actualShared,
    PermissionResource: actualShared.PermissionResource,
    PermissionAction: actualShared.PermissionAction,
  }
})
// --- END MOCKING CONFIGURATION ---

import { createCategoryServer } from '@category/server.js'
import {
  cleanupCategoryTestData,
  createSharedCategoryTestData,
  createTestCategory,
  type SharedCategoryTestData,
} from '@category/test/helpers/categoryTestHelpers.js'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  type TestDatabaseResult,
} from '@pika/tests'
import { MockCacheService } from '@pika/tests'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Public Category Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let server: any
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let customerClient: AuthenticatedRequestClient
  let sharedTestData: SharedCategoryTestData

  const mockCacheService = new MockCacheService()

  beforeAll(async () => {
    testDb = await createTestDatabase({
      databaseName: 'test_category_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    process.env.DATABASE_URL = testDb.databaseUrl

    const serverResult = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
    })

    app = serverResult.app

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated client
    customerClient = await authHelper.getUserClient(testDb.prisma)

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

    if (server) {
      server.close()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('GET /categories', () => {
    it('should return all categories with pagination', async () => {
      // Using shared test data - total categories created in beforeAll
      const response = await customerClient
        .get('/categories')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.pagination.total).toBe(
        sharedTestData.allCategories.length,
      )
    })

    it('should filter categories by parentId', async () => {
      // Use shared test data parent
      const parentCategory = sharedTestData.activeParentCategories[0]
      const response = await customerClient
        .get(`/categories?parentId=${parentCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      // Should return all children of this parent (active + inactive)
      const expectedChildren = sharedTestData.allCategories.filter(
        (cat) => cat.parentId === parentCategory.id,
      )

      expect(response.body.data).toHaveLength(expectedChildren.length)
      expect(
        response.body.data.every(
          (cat: any) => cat.parentId === parentCategory.id,
        ),
      ).toBe(true)
    })

    it('should filter categories by isActive status', async () => {
      // Test active categories using shared test data
      const response = await customerClient
        .get('/categories?isActive=true')
        .set('Accept', 'application/json')
        .expect(200)

      const activeCount = [
        ...sharedTestData.activeParentCategories,
        ...sharedTestData.activeChildCategories,
      ].length

      expect(response.body.data).toHaveLength(activeCount)
      expect(response.body.data.every((cat: any) => cat.isActive)).toBe(true)

      // Test inactive categories
      const inactiveResponse = await customerClient
        .get('/categories?isActive=false')
        .set('Accept', 'application/json')
        .expect(200)

      const inactiveCount = [
        ...sharedTestData.inactiveParentCategories,
        ...sharedTestData.inactiveChildCategories,
      ].length

      expect(inactiveResponse.body.data).toHaveLength(inactiveCount)
      expect(
        inactiveResponse.body.data.every((cat: any) => !cat.isActive),
      ).toBe(true)
    })

    it('should sort categories by specified field', async () => {
      // Use shared test data for sorting test
      const response = await customerClient
        .get('/categories?sortBy=sortOrder&sortOrder=desc')
        .set('Accept', 'application/json')
        .expect(200)

      const sortOrders = response.body.data.map((cat: any) => cat.sortOrder)

      // Verify descending order
      expect(sortOrders).toEqual([...sortOrders].sort((a, b) => b - a))
    })

    it('should return empty array when no categories match filter', async () => {
      // Test with a non-existent parent ID
      const nonExistentId = uuid()
      const response = await customerClient
        .get(`/categories?parentId=${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(0)
      expect(response.body.pagination.total).toBe(0)
      expect(response.body.pagination.totalPages).toBe(0)
    })

    it('should paginate results correctly', async () => {
      // Create additional categories for pagination test
      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          createTestCategory(testDb.prisma, {
            nameKey: `categories.pagination.test.${i}.name`,
            descriptionKey: `categories.pagination.test.${i}.description`,
            sortOrder: 100 + i,
          }),
        ),
      )

      const response = await customerClient
        .get('/categories?page=2&limit=5')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(5)
      expect(response.body.data).toHaveLength(5)
      // Total should include shared data + new test data
      expect(response.body.pagination.total).toBeGreaterThan(
        sharedTestData.allCategories.length,
      )
    })
  })

  describe('GET /categories/:id', () => {
    it('should return a specific category by ID', async () => {
      // Use shared test data
      const testCategory = sharedTestData.activeParentCategories[0]
      const response = await customerClient
        .get(`/categories/${testCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testCategory.id)
      expect(response.body.nameKey).toBe(testCategory.nameKey)
      expect(response.body).toHaveProperty('slug')
      expect(response.body).toHaveProperty('level')
      expect(response.body).toHaveProperty('path')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 404 for non-existent category ID', async () => {
      const nonExistentId = uuid()

      await customerClient
        .get(`/categories/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /categories/hierarchy', () => {
    it('should return hierarchical category tree', async () => {
      // Use shared test data for hierarchy test
      const response = await customerClient
        .get('/categories/hierarchy')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)

      // Should have hierarchical structure with parent categories
      const rootCategories = response.body.data.filter(
        (cat: any) => !cat.parentId,
      )

      expect(rootCategories).toHaveLength(sharedTestData.rootCategories.length)
      expect(rootCategories.length).toBeGreaterThan(0)
    })
  })

  describe('GET /categories/:id/path', () => {
    it('should return category path (breadcrumb)', async () => {
      // Use shared test data
      const childCategory = sharedTestData.activeChildCategories[0]

      const response = await customerClient
        .get(`/categories/${childCategory.id}/path`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toHaveLength(2) // Parent + child
    })
  })

  // Authentication Boundary Tests
  describe('Authentication Boundary Tests', () => {
    it('should require authentication for all category endpoints', async () => {
      const testCategory = sharedTestData.activeParentCategories[0]

      // Test all protected endpoints without authentication
      const protectedEndpoints = [
        { method: 'get', url: '/categories' },
        { method: 'get', url: `/categories/${testCategory.id}` },
        { method: 'get', url: '/categories/hierarchy' },
        { method: 'get', url: `/categories/${testCategory.id}/path` },
      ]

      for (const endpoint of protectedEndpoints) {
        await request[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(401)
      }
    })

    it('should reject invalid JWT tokens', async () => {
      await request
        .get('/categories')
        .set('Authorization', 'Bearer invalid-token')
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid UUIDs in path parameters', async () => {
      const response = await customerClient
        .get('/categories/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
