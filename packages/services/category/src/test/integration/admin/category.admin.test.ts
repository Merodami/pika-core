/**
 * Admin Category Integration Tests
 *
 * Tests admin category endpoints with RBAC authentication
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
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import {
  createE2EAuthHelper,
  E2EAuthHelper,
  MockCacheService,
} from '@pika/tests'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Admin Category Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let server: any
  let sharedTestData: SharedCategoryTestData

  const mockCacheService = new MockCacheService()

  beforeAll(async () => {
    testDb = await createTestDatabase({
      databaseName: 'test_category_admin_db',
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

    logger.debug('E2E authentication setup complete')

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
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

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    if (server) {
      server.close()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('Admin Category Management', () => {
    describe('POST /admin/categories', () => {
      const categoryData = {
        nameKey: 'categories.new.name',
        descriptionKey: 'categories.new.description',
        icon: 'test-icon',
        isActive: true,
        sortOrder: 5,
      }

      it('should create a new category with admin token', async () => {
        const response = await adminClient
          .post('/admin/categories')
          .set('Accept', 'application/json')
          .send(categoryData)
          .expect(201)

        // Verify core fields
        expect(response.body).toHaveProperty('id')
        expect(response.body.nameKey).toBe(categoryData.nameKey)
        expect(response.body.descriptionKey).toBe(categoryData.descriptionKey)
        expect(response.body.icon).toBe(categoryData.icon)
        expect(response.body.isActive).toBe(true)
        expect(response.body.sortOrder).toBe(categoryData.sortOrder)

        // Verify computed fields
        expect(response.body.slug).toBe('categories-new-name')
        expect(response.body.level).toBe(1)
        expect(response.body.path).toBe('')

        // Verify metadata fields
        expect(response.body).toHaveProperty('createdBy')
        expect(response.body).toHaveProperty('createdAt')
        expect(response.body).toHaveProperty('updatedAt')
      })

      it('should reject creation without admin token', async () => {
        await customerClient
          .post('/admin/categories')
          .set('Accept', 'application/json')
          .send(categoryData)
          .expect(403)
      })

      it('should reject creation without authentication', async () => {
        await supertest(app)
          .post('/admin/categories')
          .set('Accept', 'application/json')
          .send(categoryData)
          .expect(401)
      })

      it('should create a child category with parent reference', async () => {
        const parentCategory = sharedTestData.activeParentCategories[0]
        const childData = {
          ...categoryData,
          nameKey: 'categories.child.new.name',
          parentId: parentCategory.id,
        }

        const response = await adminClient
          .post('/admin/categories')
          .set('Accept', 'application/json')
          .send(childData)
          .expect(201)

        expect(response.body.parentId).toBe(parentCategory.id)
        expect(response.body.level).toBe(2)
        expect(response.body.path).toBe(parentCategory.id)
        expect(response.body.nameKey).toBe(childData.nameKey)
        expect(response.body.slug).toBe('categories-child-new-name')
      })
    })

    describe('PATCH /admin/categories/:id', () => {
      it('should update an existing category with admin token', async () => {
        // Create a new category to update (don't modify shared data)
        const category = await testDb.prisma.category.create({
          data: {
            nameKey: 'categories.to-update.name',
            descriptionKey: 'categories.to-update.description',
            slug: `to-update-${uuid().substring(0, 8)}`,
            level: 1,
            path: '',
            isActive: true,
            createdBy: uuid(),
          },
        })

        const updateData = {
          nameKey: 'categories.updated.name',
          isActive: false,
        }

        const response = await adminClient
          .patch(`/admin/categories/${category.id}`)
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(200)

        expect(response.body.nameKey).toBe(updateData.nameKey)
        expect(response.body.isActive).toBe(false)
        expect(response.body.slug).toBe('categories-updated-name')
        expect(response.body.level).toBe(1)
        expect(response.body.path).toBe('')
      })

      it('should reject update without admin token', async () => {
        // Create a new category to update (don't modify shared data)
        const category = await testDb.prisma.category.create({
          data: {
            nameKey: 'categories.to-update2.name',
            descriptionKey: 'categories.to-update2.description',
            slug: `to-update2-${uuid().substring(0, 8)}`,
            level: 1,
            path: '',
            isActive: true,
            createdBy: uuid(),
          },
        })

        const updateData = {
          nameKey: 'categories.updated.name',
          isActive: false,
        }

        await customerClient
          .patch(`/admin/categories/${category.id}`)
          .set('Accept', 'application/json')
          .send(updateData)
          .expect(403)
      })
    })

    describe('DELETE /admin/categories/:id', () => {
      it('should delete a category with no children with admin token', async () => {
        const category = await testDb.prisma.category.create({
          data: {
            nameKey: 'categories.to-delete.name',
            descriptionKey: 'categories.to-delete.description',
            slug: `to-delete-${uuid().substring(0, 8)}`,
            level: 1,
            path: '',
            isActive: true,
            createdBy: uuid(),
          },
        })

        await adminClient
          .delete(`/admin/categories/${category.id}`)
          .set('Accept', 'application/json')
          .expect(204)

        // Verify category was soft deleted
        const deletedCategory = await testDb.prisma.category.findUnique({
          where: { id: category.id },
        })

        expect(deletedCategory?.deletedAt).not.toBeNull()
      })

      it('should reject deletion without admin token', async () => {
        const category = await testDb.prisma.category.create({
          data: {
            nameKey: 'categories.to-delete.name',
            descriptionKey: 'categories.to-delete.description',
            slug: `to-delete-${uuid().substring(0, 8)}`,
            level: 1,
            path: '',
            isActive: true,
            createdBy: uuid(),
          },
        })

        await customerClient
          .delete(`/admin/categories/${category.id}`)
          .set('Accept', 'application/json')
          .expect(403)
      })
    })

    describe('GET /admin/categories', () => {
      it('should get all categories with admin filters', async () => {
        // Use shared test data - we already have inactive categories
        const response = await adminClient
          .get('/admin/categories?isActive=false')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')

        // Should return all inactive categories from shared data
        const expectedInactiveCount = [
          ...sharedTestData.inactiveParentCategories,
          ...sharedTestData.inactiveChildCategories,
        ].length

        expect(response.body.data).toHaveLength(expectedInactiveCount)
        expect(response.body.data.every((cat: any) => !cat.isActive)).toBe(true)
      })

      it('should reject admin listing without admin token', async () => {
        await customerClient
          .get('/admin/categories')
          .set('Accept', 'application/json')
          .expect(403)
      })
    })
  })

  // Authentication Boundary Tests
  describe('Authentication Boundary Tests', () => {
    it('should require authentication for all admin endpoints', async () => {
      const testCategory = sharedTestData.activeParentCategories[0]

      // Test all admin endpoints without authentication
      const adminEndpoints = [
        { method: 'get', url: '/admin/categories' },
        { method: 'post', url: '/admin/categories' },
        { method: 'get', url: `/admin/categories/${testCategory.id}` },
        { method: 'put', url: `/admin/categories/${testCategory.id}` },
        { method: 'delete', url: `/admin/categories/${testCategory.id}` },
      ]

      for (const endpoint of adminEndpoints) {
        await request[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(401)
      }
    })

    it('should require admin role for admin endpoints', async () => {
      const testCategory = sharedTestData.activeParentCategories[0]

      // Test admin endpoints with customer token (should get 403)
      const adminEndpoints = [
        { method: 'get', url: '/admin/categories' },
        { method: 'get', url: `/admin/categories/${testCategory.id}` },
        { method: 'patch', url: `/admin/categories/${testCategory.id}` },
        { method: 'delete', url: `/admin/categories/${testCategory.id}` },
      ]

      for (const endpoint of adminEndpoints) {
        await customerClient[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(403)
      }

      // Test POST endpoint separately with required body
      await customerClient
        .post('/admin/categories')
        .set('Accept', 'application/json')
        .send({
          nameKey: 'test.category',
          descriptionKey: 'test.description',
          isActive: true,
          sortOrder: 1,
        })
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Admin Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidData = {
        nameKey: '',
        invalidField: 'should not be accepted',
      }

      const response = await adminClient
        .post('/admin/categories')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
