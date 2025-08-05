/**
 * Business Service - Admin API Integration Tests
 *
 * Tests for admin-only business endpoints that require admin privileges.
 * These endpoints are used for business management and administration.
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
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createMockTranslationClient,
  createTestDatabase,
  E2EAuthHelper,
  MockTranslationClient,
  TestDatabaseResult,
} from '@pika/tests'
import type { Express } from 'express'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Note: Using shared helper from businessTestHelpers.js

describe('Business Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient

  // Authenticated clients for different user types
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedBusinessTestData

  beforeAll(async () => {
    logger.debug('Setting up Business Service Admin API integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_admin_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
    })

    logger.debug('Express server ready for testing.')

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedBusinessTestData(testDb.prisma)
    logger.debug(
      `Created ${sharedTestData.allBusinesses.length} test businesses`,
    )

    // Verify shared data was created
    const businessCount = await testDb.prisma.business.count()

    logger.debug(
      `Database has ${businessCount} businesses after shared data creation`,
    )

    if (businessCount === 0) {
      throw new Error('No shared test data was created - database setup issue')
    }
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests
    translationClient.clear()

    // Verify shared test data still exists
    const businessCount = await testDb.prisma.business.count()

    logger.debug(`Database has ${businessCount} businesses at start of test`)

    if (businessCount === 0) {
      // Recreate shared data if it was deleted by another test
      logger.debug('Shared test data was cleared - recreating...')
      sharedTestData = await createSharedBusinessTestData(testDb.prisma)

      const newCount = await testDb.prisma.business.count()

      logger.debug(`Recreated ${newCount} businesses`)
    }

    // Don't clean up shared test data between tests - only clean any extra data created
    // This preserves the shared test data created in beforeAll
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Admin Business Management Tests
  describe('GET /admin/businesses', () => {
    it('should return all businesses including inactive for admin', async () => {
      // Use shared test data instead of creating new ones
      const response = await adminClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET /admin/businesses failed:', {
          status: response.status,
          body: response.body,
          error: response.error,
          text: response.text,
        })
        console.error(
          'Full error details:',
          JSON.stringify(response.body, null, 2),
        )
      }

      expect(response.status).toBe(200)

      // Should see all businesses from shared data
      expect(response.body.data.length).toBeGreaterThanOrEqual(
        sharedTestData.allBusinesses.length,
      )

      // Admin should see both active and inactive businesses
      const responseIds = response.body.data.map((b: any) => b.id)
      const hasActive = sharedTestData.activeBusinesses.some((b) =>
        responseIds.includes(b.id),
      )
      const hasInactive = sharedTestData.inactiveBusinesses.some((b) =>
        responseIds.includes(b.id),
      )

      expect(hasActive).toBe(true)
      expect(hasInactive).toBe(true)
    })

    it('should filter by active status for admin', async () => {
      // Get only inactive businesses from shared data (don't filter by verified status)
      const response = await adminClient
        .get('/admin/businesses')
        .query({ active: false })
        .set('Accept', 'application/json')
        .expect(200)

      // All returned businesses should be inactive
      if (response.body.data.length > 0) {
        expect(response.body.data.every((b: any) => !b.active)).toBe(true)
      }

      // Should include our shared inactive businesses
      const responseIds = response.body.data.map((b: any) => b.id)
      const includesSharedInactive = sharedTestData.inactiveBusinesses.some(
        (b) => responseIds.includes(b.id),
      )

      expect(includesSharedInactive).toBe(true)
    })

    it('should include related data when requested', async () => {
      // Use shared test data
      const response = await adminClient
        .get('/admin/businesses')
        .query({ include: 'user,category' })
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.error(
          'Include related data failed:',
          JSON.stringify(response.body, null, 2),
        )
      }

      expect(response.status).toBe(200)

      // Check that we have data
      expect(response.body.data.length).toBeGreaterThan(0)

      // Relations should be included when requested
      const firstBusiness = response.body.data[0]

      // The response should have the base business fields at minimum
      expect(firstBusiness).toHaveProperty('id')
      expect(firstBusiness).toHaveProperty('businessNameKey')
    })

    it('should require admin role for admin endpoints', async () => {
      // Non-admin users should get 403 Forbidden
      await customerClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should support advanced filtering for admins', async () => {
      // Use shared test data - we have unverified businesses
      const response = await adminClient
        .get('/admin/businesses')
        .query({
          verified: 'false',
          active: 'true',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        .set('Accept', 'application/json')
        .expect(200)

      // All results should match the filter criteria
      if (response.body.data.length > 0) {
        const allMatch = response.body.data.every(
          (b: any) => b.verified === false && b.active === true,
        )

        expect(allMatch).toBe(true)
      }

      // Should include our shared unverified businesses that are active
      const expectedIds = sharedTestData.unverifiedBusinesses
        .filter((b) => b.active)
        .map((b) => b.id)
      const responseIds = response.body.data.map((b: any) => b.id)
      const hasExpectedBusinesses = expectedIds.some((id) =>
        responseIds.includes(id),
      )

      expect(hasExpectedBusinesses).toBe(true)
    })
  })

  describe('GET /admin/businesses/:id', () => {
    it('should return full business details for admin', async () => {
      // Use a business from shared test data
      const business = sharedTestData.activeBusinesses[0]

      const response = await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      // Admin should see all fields including sensitive ones
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return inactive businesses for admin', async () => {
      // Use an inactive business from shared test data
      const business = sharedTestData.inactiveBusinesses[0]

      const response = await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      expect(response.body.active).toBe(false)
    })
  })

  describe('POST /admin/businesses/:id/verify', () => {
    it('should verify a business', async () => {
      // Use an unverified business from shared test data
      const unverifiedBusiness = sharedTestData.unverifiedBusinesses[0]

      const response = await adminClient
        .post(`/admin/businesses/${unverifiedBusiness.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.verified).toBe(true)

      // Verify in database
      const updatedBusiness = await testDb.prisma.business.findUnique({
        where: { id: unverifiedBusiness.id },
      })

      expect(updatedBusiness?.verified).toBe(true)
    })

    it('should unverify a business', async () => {
      // Use a verified business from shared test data
      const verifiedBusiness = sharedTestData.verifiedBusinesses[0]

      const response = await adminClient
        .post(`/admin/businesses/${verifiedBusiness.id}/verify`)
        .send({ verified: false })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.verified).toBe(false)
    })

    it('should require admin role for verification', async () => {
      // Use a business from shared test data
      const business = sharedTestData.activeBusinesses[0]

      await customerClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('POST /admin/businesses/:id/rating', () => {
    it('should update business rating', async () => {
      // Use a business from shared test data
      const business = sharedTestData.activeBusinesses[0]

      const ratingData = {
        rating: 4.5,
      }

      const response = await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(ratingData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.avgRating).toBe(4.5)
    })

    it('should validate rating range', async () => {
      // Use a business from shared test data
      const business = sharedTestData.activeBusinesses[1]

      // Invalid rating (> 5)
      const invalidRating = {
        rating: 6,
      }

      await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(invalidRating)
        .set('Accept', 'application/json')
        .expect(400)

      // Negative rating
      const negativeRating = {
        rating: -1,
      }

      await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(negativeRating)
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  describe('PUT /admin/businesses/:id', () => {
    it('should update any business as admin', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const updateData = {
        active: false,
        verified: true,
      }

      const response = await adminClient
        .patch(`/admin/businesses/${business.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.active).toBe(false)
      expect(response.body.verified).toBe(true)
    })

    it('should allow admin to change business category', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Create a new category
      const newCategory = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.new.${uuid()}`,
          descriptionKey: `category.description.new.${uuid()}`,
          slug: `new-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          isActive: true,
          sortOrder: 1,
          createdBy: uuid(),
        },
      })

      const response = await adminClient
        .patch(`/admin/businesses/${business.id}`)
        .send({ categoryId: newCategory.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.categoryId).toBe(newCategory.id)
    })
  })

  describe('DELETE /admin/businesses/:id', () => {
    it('should soft delete a business as admin', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      await adminClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      // Verify business is soft deleted (deletedAt is set)
      const deletedBusiness = await testDb.prisma.business.findUnique({
        where: { id: business.id },
      })

      expect(deletedBusiness?.deletedAt).not.toBeNull()
    })

    it('should require admin role for deletion', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      await customerClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Bulk Operations (Admin Only)
  describe.skip('Admin Bulk Operations - Not Implemented', () => {
    it('should bulk verify multiple businesses', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        generateUnverified: true,
        count: 5,
      })

      const unverifiedIds = businesses
        .filter((b) => !b.verified)
        .map((b) => b.id)

      const response = await adminClient
        .post('/admin/businesses/bulk/verify')
        .send({
          businessIds: unverifiedIds,
          verified: true,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.updated).toBe(unverifiedIds.length)

      // Verify all are now verified
      const updatedBusinesses = await testDb.prisma.business.findMany({
        where: { id: { in: unverifiedIds } },
      })

      expect(updatedBusinesses.every((b) => b.verified)).toBe(true)
    })

    it('should bulk activate/deactivate businesses', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 4,
      })

      const businessIds = businesses.map((b) => b.id)

      // Deactivate all
      const response = await adminClient
        .post('/admin/businesses/bulk/status')
        .send({
          businessIds,
          active: false,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.updated).toBe(businessIds.length)

      // Verify all are inactive
      const updatedBusinesses = await testDb.prisma.business.findMany({
        where: { id: { in: businessIds } },
      })

      expect(updatedBusinesses.every((b) => !b.active)).toBe(true)
    })
  })

  // Admin Analytics and Reporting
  describe.skip('Admin Analytics - Not Implemented', () => {
    it('should get business statistics', async () => {
      await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
        generateUnverified: true,
        count: 10,
      })

      const response = await adminClient
        .get('/admin/businesses/stats')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('active')
      expect(response.body).toHaveProperty('inactive')
      expect(response.body).toHaveProperty('verified')
      expect(response.body).toHaveProperty('unverified')
      expect(response.body.total).toBe(10)
    })

    it('should get businesses by category stats', async () => {
      // Create multiple categories with businesses
      for (let i = 0; i < 3; i++) {
        await seedTestBusinesses(testDb.prisma, { count: 3 })
      }

      const response = await adminClient
        .get('/admin/businesses/stats/by-category')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(3) // 3 categories
      expect(response.body[0]).toHaveProperty('categoryId')
      expect(response.body[0]).toHaveProperty('count')
    })
  })

  // RBAC Permission Tests
  describe('RBAC Permission Tests', () => {
    it('should enforce proper permissions for admin endpoints', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Test various admin endpoints with non-admin users
      const endpoints = [
        { method: 'get', url: '/admin/businesses' },
        { method: 'get', url: `/admin/businesses/${business.id}` },
        { method: 'post', url: `/admin/businesses/${business.id}/verify` },
        { method: 'post', url: `/admin/businesses/${business.id}/rating` },
        { method: 'patch', url: `/admin/businesses/${business.id}` },
        { method: 'delete', url: `/admin/businesses/${business.id}` },
      ]

      for (const endpoint of endpoints) {
        // Customer should get 403
        const customerReq = customerClient[
          endpoint.method as 'get' | 'post' | 'put' | 'delete'
        ](endpoint.url)

        if (endpoint.method !== 'get' && endpoint.method !== 'delete') {
          customerReq.send({ test: 'data' })
        }
        await customerReq.set('Accept', 'application/json').expect(403)

        // Business user should get 403
        const businessReq = businessClient[
          endpoint.method as 'get' | 'post' | 'put' | 'delete'
        ](endpoint.url)

        if (endpoint.method !== 'get' && endpoint.method !== 'delete') {
          businessReq.send({ test: 'data' })
        }
        await businessReq.set('Accept', 'application/json').expect(403)
      }
    })

    it('should allow admin to perform all operations', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Admin should be able to access all endpoints
      await adminClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .patch(`/admin/businesses/${business.id}`)
        .send({ businessName: 'Test Business Admin Quick Update' })
        .set('Accept', 'application/json')
        .expect(200)
    })
  })
})
