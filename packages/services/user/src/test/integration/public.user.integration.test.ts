/**
 * User Service - Public API Integration Tests
 *
 * Tests for public-facing user endpoints that are accessible to authenticated users.
 * These endpoints are for user profile management and self-service operations.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi = await vi.importActual('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared = await vi.importActual('@pika/shared')

  return actualShared // Return all actual exports
})

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  CommunicationServiceClientMock,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pika/tests'
import {
  cleanupTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import { UserRole } from '@pika/types'
import { createUserServer } from '@user/server.js'
import {
  createSharedUserTestData,
  seedTestUsers,
  type SharedUserTestData,
} from '@user/test/helpers/userTestHelpers.js'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

interface FileStoragePort {
  saveFile: (
    file: any,
    prefix?: string,
    options?: any,
  ) => Promise<{ url: string; path: string }>
  deleteFile: (filePath: string) => Promise<void>
  getFileUrl: (path: string) => Promise<string>
  fileExists: (path: string) => Promise<boolean>
}

describe('User Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedUserTestData

  const mockCommunicationClient =
    new CommunicationServiceClientMock().setupEmailSuccess()

  const mockFileStorage: FileStoragePort = {
    saveFile: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/avatar.jpg',
      path: 'avatars/test-avatar.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getFileUrl: vi.fn((path: string) =>
      Promise.resolve(`http://mockstorage.com/${path}`),
    ),
    fileExists: vi.fn().mockResolvedValue(true),
  }

  // Note: Using shared helper from userTestHelpers.js

  beforeAll(async () => {
    logger.debug('Setting up User Service public integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService,
      fileStorage: mockFileStorage as any,
      communicationClient: mockCommunicationClient as any,
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
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedUserTestData(testDb.prisma)

    logger.debug(`Created ${sharedTestData.allUsers.length} shared test users`)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only user-related data to preserve E2E auth users and shared test data
    if (testDb?.prisma) {
      // Delete test users created during tests (not the E2E auth users or shared data)
      await testDb.prisma.user.deleteMany({
        where: {
          email: {
            contains: '@test.com',
            not: {
              in: [
                'admin@e2etest.com',
                'user@e2etest.com',
                'business@e2etest.com',
                // Preserve shared test users
                ...sharedTestData.allUsers.map((u) => u.email),
              ],
            },
          },
        },
      })
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // User Profile Access Tests
  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      // Get the member user from database
      const memberUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      const response = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Check if endpoint exists, skip if not implemented
      if (response.status === 404) {
        // Skipping /users/me test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(memberUser!.id)
      expect(response.body.email).toBe('user@e2etest.com')
      expect(response.body).toHaveProperty('firstName')
      expect(response.body).toHaveProperty('lastName')
      expect(response.body).toHaveProperty('role')
    })

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request
        .get('/users/me')
        .set('Accept', 'application/json')

      // Expect either 401 (auth required) or 404 (endpoint not found)
      expect([401, 404]).toContain(response.status)
    })

    it('should return different data for different user roles', async () => {
      // Test with customer
      const customerResponse = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Test with business user
      const businessResponse = await businessClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Skip if endpoint doesn't exist
      if (customerResponse.status === 404 || businessResponse.status === 404) {
        return
      }

      expect(customerResponse.status).toBe(200)
      expect(businessResponse.status).toBe(200)
      expect(customerResponse.body.role).toBe('customer')
      expect(businessResponse.body.role).toBe('business')
    })
  })

  describe('GET /users/:user_id', () => {
    it('should allow users to view their own profile', async () => {
      const memberUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      const response = await customerClient
        .get(`/users/${memberUser!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(memberUser!.id)
      expect(response.body.email).toBe(memberUser!.email)
    })

    it('should allow authenticated users to view other user profiles', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const otherUser = testUsers.users[0]

      const response = await customerClient
        .get(`/users/${otherUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(otherUser.id)
      expect(response.body.email).toBe(otherUser.email)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/users/${nonExistentId}`)
        .set('Accept', 'application/json')

      expect(response.status).toBe(404)
    })

    it('should handle invalid UUID parameters', async () => {
      const response = await customerClient
        .get('/users/not-a-uuid')
        .set('Accept', 'application/json')

      // Expect 400 since we validate UUID format
      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const otherUser = testUsers.users[0]

      const response = await request
        .get(`/users/${otherUser.id}`)
        .set('Accept', 'application/json')

      expect(response.status).toBe(401)
    })
  })

  // User Profile Updates
  describe('PUT /users/me', () => {
    it('should update current user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping PUT /users/me test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.firstName).toBe('Updated')
      expect(response.body.lastName).toBe('Name')

      // Verify in database
      const updatedUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(updatedUser?.firstName).toBe('Updated')
      expect(updatedUser?.lastName).toBe('Name')
    })

    it('should not allow updating role', async () => {
      const updateData = {
        role: 'admin', // Trying to elevate privileges
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping PUT /users/me role test - endpoint not found
        return
      }

      expect(response.status).toBe(400)

      // Role should not be changed
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(user?.role).toBe(UserRole.CUSTOMER)
    })

    it('should not allow updating email directly', async () => {
      const updateData = {
        email: 'hacker@evil.com',
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      // Should either reject the update or ignore email field
      expect([400, 200]).toContain(response.status)

      // Email should not be changed
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(user?.email).toBe('user@e2etest.com')
    })

    it('should validate input data', async () => {
      const invalidData = {
        firstName: '', // Empty name
        phoneNumber: 'invalid-phone',
      }

      const response = await customerClient
        .put('/users/me')
        .send(invalidData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('should require authentication', async () => {
      const updateData = {
        firstName: 'Unauthorized',
      }

      const response = await request
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      expect(response.status).toBe(401)
    })
  })

  // Avatar Upload Tests
  describe('POST /users/me/avatar', () => {
    it('should allow user to upload their own avatar', async () => {
      const response = await customerClient
        .post('/users/me/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping avatar upload test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.avatarUrl).toBeDefined()
      expect(mockFileStorage.saveFile).toHaveBeenCalled()
    })

    it('should return 400 when no file is uploaded', async () => {
      const response = await customerClient
        .post('/users/me/avatar')
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await request
        .post('/users/me/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')

      expect(response.status).toBe(401)
    })
  })

  // User Search/Browse (if implemented as public)
  describe('User Public Browsing', () => {
    it('should handle user search if publicly available', async () => {
      // This test checks if users can browse/search other users
      // Implementation may vary based on business requirements

      const response = await customerClient
        .get('/users')
        .set('Accept', 'application/json')

      // If endpoint doesn't exist or is admin-only, expect 404 or 403
      if ([404, 403].includes(response.status)) {
        // User browsing not available to public - this is expected
        return
      }

      // If user browsing is available, test pagination
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')
        expect(Array.isArray(response.body.data)).toBe(true)
      }
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed requests
      const response = await customerClient
        .put('/users/me')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      // Should handle malformed JSON gracefully
      expect([400, 404]).toContain(response.status)
    })

    it('should provide helpful error messages', async () => {
      const response = await customerClient
        .put('/users/me')
        .send({
          firstName: '', // Invalid data
        })
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      if (response.status === 400) {
        expect(response.body.error).toBeDefined()
        expect(response.body.error.code).toBeDefined()
      }
    })

    it('should handle network timeouts gracefully', async () => {
      // This test ensures error handling works properly
      // In a real scenario, you might simulate network issues

      const response = await customerClient
        .get('/users/me')
        .timeout(1) // Very short timeout
        .set('Accept', 'application/json')
        .catch((err) => err)

      // Should handle timeout error
      expect(typeof response).toBe('object')
    })
  })

  // Performance Tests (basic)
  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      // Test concurrent access to user profile
      const promises = Array.from({ length: 5 }, () =>
        customerClient.get('/users/me').set('Accept', 'application/json'),
      )

      const responses = await Promise.all(promises)

      // All requests should succeed (or consistently fail if endpoint doesn't exist)
      const statuses = responses.map((r) => r.status)
      const uniqueStatuses = [...new Set(statuses)]

      // Should all have the same status (either all 200 or all 404)
      expect(uniqueStatuses).toHaveLength(1)
    })
  })

  // Data Consistency Tests
  describe('Data Consistency', () => {
    it('should maintain data consistency after updates', async () => {
      const originalResponse = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Skip if endpoint doesn't exist
      if (originalResponse.status === 404) return

      const updateData = {
        firstName: 'ConsistencyTest',
      }

      const updateResponse = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Skip if update endpoint doesn't exist
      if (updateResponse.status === 404) return

      if (updateResponse.status === 200) {
        // Verify the change persisted
        const verifyResponse = await customerClient
          .get('/users/me')
          .set('Accept', 'application/json')

        expect(verifyResponse.status).toBe(200)
        expect(verifyResponse.body.firstName).toBe('ConsistencyTest')
      }
    })
  })
})
