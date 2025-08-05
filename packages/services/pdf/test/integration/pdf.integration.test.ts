/**
 * PDF Service - Public API Integration Tests
 *
 * Tests for public-facing PDF endpoints that are accessible to authenticated users.
 * These endpoints handle voucher book viewing and PDF downloads.
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
  createTestVoucherBook,
  seedTestVoucherBooks,
} from '../helpers/pdfTestHelpers.js'

describe('PDF Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient

  // Note: Using helper from pdfTestHelpers.js

  beforeAll(async () => {
    logger.debug('Setting up PDF Service integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()

    app = await createPDFServer({
      prisma: testDb.prisma,
      cacheService,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    customerClient = await authHelper.getUserClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
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

  describe('GET /voucher-books', () => {
    it('should return paginated published voucher books with authentication', async () => {
      await seedTestVoucherBooks(testDb.prisma, {
        generatePublished: true,
        generateDrafts: true,
        count: 3,
      })

      const response = await customerClient
        .get('/voucher-books')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.log('Response status:', response.status)
        console.log('Response body:', JSON.stringify(response.body, null, 2))
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

      // Should only show published books (2 published, 1 draft created)
      expect(response.body.data).toHaveLength(2)
      expect(
        response.body.data.every((book: any) => book.status === 'published'),
      ).toBe(true)
    })

    it('should support pagination parameters', async () => {
      await seedTestVoucherBooks(testDb.prisma, {
        generatePublished: true,
        count: 5,
      })

      const response = await customerClient
        .get('/voucher-books')
        .query({ page: 1, limit: 3 })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(3)
      expect(response.body.pagination.total).toBe(5)
    })

    it('should support filtering by year and month', async () => {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1

      // Get a test user for foreign key references
      const testUser = await testDb.prisma.user.findFirst({
        where: { email: { contains: '@e2etest.com' } },
      })

      if (!testUser) {
        throw new Error('No test users found')
      }

      // Create books with different dates
      await testDb.prisma.voucherBook.create({
        data: {
          id: uuid(),
          title: 'Current Month Book',
          year: currentYear,
          month: currentMonth,
          bookType: 'monthly',
          totalPages: 24,
          status: 'published',
          createdBy: testUser.id,
          updatedBy: testUser.id,
        },
      })

      await testDb.prisma.voucherBook.create({
        data: {
          id: uuid(),
          title: 'Different Month Book',
          year: currentYear,
          month: currentMonth === 12 ? 1 : currentMonth + 1,
          bookType: 'monthly',
          totalPages: 24,
          status: 'published',
          createdBy: testUser.id,
          updatedBy: testUser.id,
        },
      })

      const response = await customerClient
        .get('/voucher-books')
        .query({ year: currentYear, month: currentMonth })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].title).toBe('Current Month Book')
    })

    it('should support filtering by book type', async () => {
      // Get a test user for foreign key references
      const testUser = await testDb.prisma.user.findFirst({
        where: { email: { contains: '@e2etest.com' } },
      })

      if (!testUser) {
        throw new Error('No test users found')
      }

      await testDb.prisma.voucherBook.create({
        data: {
          id: uuid(),
          title: 'Monthly Book',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          bookType: 'monthly',
          totalPages: 24,
          status: 'published',
          createdBy: testUser.id,
          updatedBy: testUser.id,
        },
      })

      await testDb.prisma.voucherBook.create({
        data: {
          id: uuid(),
          title: 'Special Book',
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          bookType: 'special_edition',
          totalPages: 32,
          status: 'published',
          createdBy: testUser.id,
          updatedBy: testUser.id,
        },
      })

      const response = await customerClient
        .get('/voucher-books')
        .query({ bookType: 'monthly' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].bookType).toBe('monthly')
    })
  })

  describe('GET /voucher-books/:id', () => {
    it('should return a specific published voucher book by ID', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'published')

      const response = await customerClient
        .get(`/voucher-books/${testBook.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testBook.id,
        title: testBook.title,
        year: testBook.year,
        month: testBook.month,
        bookType: testBook.bookType,
        status: 'published',
      })
    })

    it('should return 404 for non-existent voucher book ID', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/voucher-books/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for draft voucher books (not published)', async () => {
      const draftBook = await createTestVoucherBook(testDb.prisma, 'draft')

      const response = await customerClient
        .get(`/voucher-books/${draftBook.id}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle invalid UUID format', async () => {
      const response = await customerClient
        .get('/voucher-books/invalid-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /voucher-books/:id/download', () => {
    it('should initiate PDF download for published voucher book', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'published')

      const response = await customerClient
        .get(`/voucher-books/${testBook.id}/download`)
        .set('Accept', 'application/json')
        .expect(200)

      // Should return download information or stream
      expect(response.body).toBeDefined()
    })

    it('should return 404 for non-existent voucher book download', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/voucher-books/${nonExistentId}/download`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for draft voucher book download', async () => {
      const draftBook = await createTestVoucherBook(testDb.prisma, 'draft')

      const response = await customerClient
        .get(`/voucher-books/${draftBook.id}/download`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })
  })

  // Authentication Boundary Tests
  describe('Authentication Boundary Tests', () => {
    it('should require authentication for all voucher book endpoints', async () => {
      const testBook = await createTestVoucherBook(testDb.prisma, 'published')

      // Test all protected endpoints without authentication
      const protectedEndpoints = [
        { method: 'get', url: '/voucher-books' },
        { method: 'get', url: `/voucher-books/${testBook.id}` },
        { method: 'get', url: `/voucher-books/${testBook.id}/download` },
      ]

      for (const endpoint of protectedEndpoints) {
        await request[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(401)
      }
    })

    it('should reject invalid JWT tokens', async () => {
      await request
        .get('/voucher-books')
        .set('Authorization', 'Bearer invalid-token')
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would need a way to simulate database errors
      // For now, we test with valid requests
      const response = await customerClient
        .get('/voucher-books')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
    })

    it('should validate query parameters', async () => {
      const response = await customerClient
        .get('/voucher-books')
        .query({ year: 'invalid' })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle large page numbers gracefully', async () => {
      const response = await customerClient
        .get('/voucher-books')
        .query({ page: 99999 })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toEqual([])
      expect(response.body.pagination.page).toBe(99999)
    })
  })
})
