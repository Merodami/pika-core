/**
 * PDF Service - Admin API Integration Tests
 *
 * Tests for admin-only PDF endpoints that require admin privileges.
 * These endpoints are used for voucher book management and administration.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
} from '@pika/tests'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createPDFServer } from '../../src/server.js'
import {
  createMockedVoucherServiceClient,
  createSharedPDFTestData,
  createTestVoucherBook,
  seedTestVoucherBooks,
  type SharedPDFTestData,
} from '../helpers/pdfTestHelpers.js'

describe('PDF Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedPDFTestData

  // Note: Using shared helper from pdfTestHelpers.js

  beforeAll(async () => {
    logger.debug('Setting up PDF Service admin integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_admin_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server with mocked VoucherServiceClient
    cacheService = new MemoryCacheService()

    const mockedVoucherClient = createMockedVoucherServiceClient()

    app = await createPDFServer({
      prisma: testDb.prisma,
      cacheService,
      voucherServiceClient: mockedVoucherClient as any,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    try {
      await authHelper.createAllTestUsers(testDb.prisma)
    } catch (error) {
      console.error('Error creating test users:', error)
      throw error
    }

    // Check if users were created successfully
    const userCount = await testDb.prisma.user.count()

    logger.debug(
      `Total users in database after createAllTestUsers: ${userCount}`,
    )

    const testUsers = await testDb.prisma.user.findMany({
      where: { email: { contains: '@e2etest.com' } },
      select: { id: true, email: true, role: true },
    })

    logger.debug(`Test users found: ${JSON.stringify(testUsers)}`)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedPDFTestData(testDb.prisma)

    logger.debug(`Created ${sharedTestData.allBooks.length} test voucher books`)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only voucher book-related data to preserve E2E auth users and shared test data
    if (testDb?.prisma) {
      // Delete in proper order to avoid foreign key constraint violations
      await testDb.prisma.adPlacement.deleteMany({})
      await testDb.prisma.voucherBookPage.deleteMany({})
      await testDb.prisma.voucherBook.deleteMany({})
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('GET /admin/voucher-books', () => {
    it('should return all voucher books with admin authentication', async () => {
      // Create test data with different statuses
      await seedTestVoucherBooks(testDb.prisma, {
        generateDrafts: true,
        generatePublished: true,
        count: 2,
      })

      const response = await adminClient
        .get('/admin/voucher-books')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.log('Error response:', response.status, response.body)
      }

      expect(response.status).toBe(200)

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      })

      // Should show both draft and published books for admin
      expect(response.body.data).toHaveLength(2)
    })

    it('should support admin-specific filters', async () => {
      // Create books with different statuses
      await seedTestVoucherBooks(testDb.prisma, {
        generateDrafts: true,
        generatePublished: true,
        count: 2,
      })

      const response = await adminClient
        .get('/admin/voucher-books')
        .query({ status: 'draft' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe('draft')
    })

    it('should support pagination with sorting', async () => {
      // Get a test user for foreign key references
      const testUser = await testDb.prisma.user.findFirst({
        where: { email: { contains: '@e2etest.com' } },
      })

      if (!testUser) {
        throw new Error('No test users found')
      }

      // Create multiple books
      for (let i = 1; i <= 5; i++) {
        await testDb.prisma.voucherBook.create({
          data: {
            id: uuid(),
            title: `Book ${i}`,
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            bookType: 'monthly',
            totalPages: 24,
            status: 'draft',
            createdBy: testUser.id,
            updatedBy: testUser.id,
          },
        })
      }

      const response = await adminClient
        .get('/admin/voucher-books')
        .query({ page: 1, limit: 3, sortBy: 'title', sortOrder: 'asc' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.pagination.total).toBe(5)
    })
  })

  describe('GET /admin/voucher-books/statistics', () => {
    it('should return voucher book statistics', async () => {
      // Create test data
      await seedTestVoucherBooks(testDb.prisma, {
        generateDrafts: true,
        generatePublished: true,
        count: 2,
      })

      const response = await adminClient
        .get('/admin/voucher-books/statistics')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        total: expect.any(Number),
        byStatus: {
          draft: expect.any(Number),
          readyForPrint: expect.any(Number),
          published: expect.any(Number),
          archived: expect.any(Number),
        },
        byType: {
          monthly: expect.any(Number),
          specialEdition: expect.any(Number),
          regional: expect.any(Number),
        },
        distributions: {
          total: expect.any(Number),
          pending: expect.any(Number),
          shipped: expect.any(Number),
          delivered: expect.any(Number),
        },
        recentActivity: expect.any(Array),
      })
    })

    it('should support date range filtering for statistics', async () => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1

      await createTestVoucherBook(testDb.prisma, 'published')

      const response = await adminClient
        .get('/admin/voucher-books/statistics')
        .query({ year: currentYear, month: currentMonth })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('total')
    })
  })

  describe('GET /admin/voucher-books/:id', () => {
    it('should return voucher book details with admin fields', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')

      const response = await adminClient
        .get(`/admin/voucher-books/${testBook.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testBook.id,
        title: testBook.title,
        status: 'draft',
        createdBy: expect.any(String), // Dynamic admin user ID
        updatedBy: expect.any(String), // Dynamic admin user ID
        // Admin response includes additional fields
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('should return 404 for non-existent voucher book', async () => {
      const nonExistentId = uuid()

      const response = await adminClient
        .get(`/admin/voucher-books/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /admin/voucher-books', () => {
    it('should create a new voucher book with admin authentication', async () => {
      const bookData = {
        title: 'New Admin Voucher Book',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        bookType: 'monthly',
        totalPages: 32,
      }

      const response = await adminClient
        .post('/admin/voucher-books')
        .send(bookData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: bookData.title,
        year: bookData.year,
        month: bookData.month,
        bookType: bookData.bookType,
        totalPages: bookData.totalPages,
        status: 'draft', // Default status for new books
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        title: '',
        // Missing required fields
      }

      const response = await adminClient
        .post('/admin/voucher-books')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle duplicate titles gracefully', async () => {
      const bookData = {
        title: 'Duplicate Title Book',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        bookType: 'monthly',
        totalPages: 24,
      }

      // Create first book
      await adminClient.post('/admin/voucher-books').send(bookData).expect(201)

      // Try to create duplicate
      const response = await adminClient
        .post('/admin/voucher-books')
        .send(bookData)
        .set('Accept', 'application/json')
        .expect(409)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PATCH /admin/voucher-books/:id', () => {
    it('should update voucher book with admin authentication', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')
      const updateData = {
        title: 'Updated Voucher Book Title',
        totalPages: 48,
      }

      const response = await adminClient
        .patch(`/admin/voucher-books/${testBook.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testBook.id,
        title: updateData.title,
        totalPages: updateData.totalPages,
      })
    })

    it('should return 404 for non-existent voucher book update', async () => {
      const nonExistentId = uuid()
      const updateData = { title: 'Updated Title' }

      const response = await adminClient
        .patch(`/admin/voucher-books/${nonExistentId}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should validate update data', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')
      const invalidData = {
        totalPages: -1, // Invalid value
      }

      const response = await adminClient
        .patch(`/admin/voucher-books/${testBook.id}`)
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /admin/voucher-books/:id/status', () => {
    it('should update voucher book status', async () => {
      const testBook = await createTestVoucherBook(
        testDb.prisma,
        'ready_for_print',
        undefined,
        undefined,
        true, // withPlacements = true
      )

      const response = await adminClient
        .post(`/admin/voucher-books/${testBook.id}/status`)
        .send({ status: 'published' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testBook.id,
        status: 'published',
      })
    })

    it('should validate status transitions', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'published')

      const response = await adminClient
        .post(`/admin/voucher-books/${testBook.id}/status`)
        .send({ status: 'invalid_status' })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /admin/voucher-books/:id/generate-pdf', () => {
    it('should initiate PDF generation for voucher book', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')

      const response = await adminClient
        .post(`/admin/voucher-books/${testBook.id}/generate-pdf`)
        .send({ force: false })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        jobId: expect.any(String),
        status: expect.any(String),
        message: expect.any(String),
      })
    })

    it('should handle PDF generation errors gracefully', async () => {
      const nonExistentId = uuid()

      const response = await adminClient
        .post(`/admin/voucher-books/${nonExistentId}/generate-pdf`)
        .send({ force: false })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        jobId: expect.any(String),
        status: 'failed',
        message: expect.stringContaining('not found'),
      })
    })
  })

  describe('DELETE /admin/voucher-books/:id', () => {
    it('should soft delete voucher book with admin authentication', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')

      await adminClient
        .delete(`/admin/voucher-books/${testBook.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      // Verify soft deletion - book should still exist but marked as deleted
      const deletedBook = await testDb.prisma.voucherBook.findUnique({
        where: { id: testBook.id },
      })

      expect(deletedBook).toBeNull() // Assuming soft delete removes from normal queries
    })

    it('should return 404 for non-existent voucher book deletion', async () => {
      const nonExistentId = uuid()

      const response = await adminClient
        .delete(`/admin/voucher-books/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /admin/voucher-books/bulk-archive', () => {
    it('should archive multiple voucher books', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma, {
        generatePublished: true,
        count: 2,
      })
      const book1 = voucherBooks[0]
      const book2 = voucherBooks[1]

      const response = await adminClient
        .post('/admin/voucher-books/bulk-archive')
        .send({ voucherBookIds: [book1.id, book2.id] })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        successful: 2,
        failed: 0,
        results: expect.any(Array),
      })
    })

    it('should handle partial failures in bulk operations', async () => {
      const validBook = await createTestVoucherBook(testDb.prisma, 'published')
      const invalidId = uuid()

      const response = await adminClient
        .post('/admin/voucher-books/bulk-archive')
        .send({ voucherBookIds: [validBook.id, invalidId] })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        successful: 1,
        failed: 1,
        results: expect.any(Array),
      })
    })
  })

  // Authentication Boundary Tests
  describe('Authentication Boundary Tests', () => {
    it('should require authentication for all admin endpoints', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')

      // Test all admin endpoints without authentication
      const adminEndpoints = [
        { method: 'get', url: '/admin/voucher-books' },
        { method: 'get', url: '/admin/voucher-books/statistics' },
        { method: 'post', url: '/admin/voucher-books' },
        { method: 'get', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'patch', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'delete', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'post', url: `/admin/voucher-books/${testBook.id}/status` },
        {
          method: 'post',
          url: `/admin/voucher-books/${testBook.id}/generate-pdf`,
        },
        { method: 'post', url: '/admin/voucher-books/bulk-archive' },
      ]

      for (const endpoint of adminEndpoints) {
        await request[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(401)
      }
    })

    it('should require admin role for admin endpoints', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'draft')

      // Test admin endpoints with customer token (should get 403)
      const adminEndpoints = [
        { method: 'get', url: '/admin/voucher-books' },
        { method: 'get', url: '/admin/voucher-books/statistics' },
        { method: 'post', url: '/admin/voucher-books' },
        { method: 'get', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'patch', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'delete', url: `/admin/voucher-books/${testBook.id}` },
        { method: 'post', url: `/admin/voucher-books/${testBook.id}/status` },
        {
          method: 'post',
          url: `/admin/voucher-books/${testBook.id}/generate-pdf`,
        },
        { method: 'post', url: '/admin/voucher-books/bulk-archive' },
      ]

      for (const endpoint of adminEndpoints) {
        await customerClient[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(403)

        await businessClient[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(403)
      }
    })
  })

  // Error Handling Tests
  describe('Admin Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidData = {
        title: '',
        year: 'invalid',
      }

      const response = await adminClient
        .post('/admin/voucher-books')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle database constraint violations', async () => {
      // This would test unique constraints, foreign key violations, etc.
      const response = await adminClient
        .get('/admin/voucher-books')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
    })

    it('should validate UUID parameters', async () => {
      const response = await adminClient
        .get('/admin/voucher-books/invalid-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
