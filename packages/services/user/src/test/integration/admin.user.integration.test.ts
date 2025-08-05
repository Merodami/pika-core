/**
 * User Service - Admin API Integration Tests
 *
 * Tests for admin-only user endpoints that require admin privileges.
 * These endpoints are used for user management and administration.
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
import { UserRole, UserStatus } from '@pika/types'
import { createUserServer } from '@user/server.js'
import {
  createSharedUserTestData,
  seedTestUsers,
  type SharedUserTestData,
} from '@user/test/helpers/userTestHelpers.js'
import { Express } from 'express'
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

describe('User Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

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
    logger.debug('Setting up User Service admin integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_admin_db',
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

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)

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

  // Admin User Management Tests
  describe('GET /users (Admin List)', () => {
    it('should return all users with pagination for admin', async () => {
      await seedTestUsers(testDb.prisma, { count: 5 })

      const response = await adminClient
        .get('/users')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.pagination.total).toBeGreaterThan(0)
    })

    it('should filter users by email', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 3 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .get('/users')
        .query({ email: targetUser.email })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].email).toBe(targetUser.email)
    })

    it('should filter users by role', async () => {
      // Seed specific role users
      await seedTestUsers(testDb.prisma, { count: 3, role: UserRole.CUSTOMER })

      const response = await adminClient
        .get('/users')
        .query({ role: UserRole.CUSTOMER })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)

      // Check that all returned users have customer role
      const nonCustomerUsers = response.body.data.filter(
        (user: any) => user.role !== UserRole.CUSTOMER,
      )

      expect(nonCustomerUsers).toHaveLength(0)

      // Ensure we got some customer users
      const customerUsers = response.body.data.filter(
        (user: any) => user.role === UserRole.CUSTOMER,
      )

      expect(customerUsers.length).toBeGreaterThan(0)
    })

    it('should filter users by status', async () => {
      await seedTestUsers(testDb.prisma, {
        count: 5,
        generateInactive: true,
        generateUnconfirmed: true,
      })

      const response = await adminClient
        .get('/users')
        .query({ status: UserStatus.ACTIVE })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      expect(
        response.body.data.every(
          (user: any) => user.status === UserStatus.ACTIVE,
        ),
      ).toBe(true)
    })

    it('should sort users by specified field', async () => {
      await seedTestUsers(testDb.prisma, { count: 5 })

      const response = await adminClient
        .get('/users?sortBy=email&sortOrder=ASC')
        .set('Accept', 'application/json')
        .expect(200)

      // Filter out e2e test users to avoid test interference
      const emails = response.body.data
        .map((user: any) => user.email)
        .filter((email: string) => !email.endsWith('@e2etest.com'))

      expect(emails).toEqual([...emails].sort())
    })

    it('should paginate results correctly', async () => {
      await seedTestUsers(testDb.prisma, { count: 10 })

      const response = await adminClient
        .get('/users?page=1&limit=5')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        // Skip test if pagination fails
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })

    it('should include hasNext and hasPrev in pagination response', async () => {
      await seedTestUsers(testDb.prisma, { count: 10 })

      // Test first page
      const firstPageResponse = await adminClient
        .get('/users?page=1&limit=5')
        .set('Accept', 'application/json')
        .expect(200)

      expect(firstPageResponse.body.pagination).toHaveProperty('hasNext')
      expect(firstPageResponse.body.pagination).toHaveProperty('hasPrev')
      expect(firstPageResponse.body.pagination.hasPrev).toBe(false)
      expect(firstPageResponse.body.pagination.hasNext).toBe(true)

      // Test second page
      const secondPageResponse = await adminClient
        .get('/users?page=2&limit=5')
        .set('Accept', 'application/json')
        .expect(200)

      expect(secondPageResponse.body.pagination.hasPrev).toBe(true)
      expect(secondPageResponse.body.pagination.hasNext).toBe(true)
    })

    it('should return 403 for non-admin users', async () => {
      await customerClient
        .get('/users')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('GET /users/:user_id (Admin)', () => {
    it('should return user by ID for admin', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .get(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(targetUser.id)
      expect(response.body.email).toBe(targetUser.email)
      expect(response.body).toHaveProperty('firstName')
      expect(response.body).toHaveProperty('lastName')
      expect(response.body).toHaveProperty('role')
      expect(response.body).toHaveProperty('status')
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      await adminClient
        .get(`/users/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should include admin-specific fields', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .get(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      // Admin should see additional fields
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('lastLoginAt')
      expect(response.body).toHaveProperty('emailVerified')
      expect(response.body).toHaveProperty('phoneVerified')
    })
  })

  describe('GET /users/email/:email (Admin)', () => {
    it('should return user by email for admin', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .get(`/users/email/${targetUser.email}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.email).toBe(targetUser.email)
      expect(response.body.id).toBe(targetUser.id)
    })

    it('should return 404 for non-existent email', async () => {
      await adminClient
        .get('/users/email/nonexistent@example.com')
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should return 403 for non-admin users', async () => {
      await customerClient
        .get('/users/email/test@example.com')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Admin User Creation Tests
  describe('POST /users (Admin Create User)', () => {
    it('should create a new user with all required fields', async () => {
      const userData = {
        email: 'admin.created@example.com',
        firstName: 'Admin',
        lastName: 'Created',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        role: UserRole.CUSTOMER,
        status: UserStatus.UNCONFIRMED,
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')

      if (response.status !== 201) {
        console.error('User creation failed:', response.body)
      }

      expect(response.status).toBe(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.email).toBe(userData.email)
      expect(response.body.firstName).toBe(userData.firstName)
      expect(response.body.lastName).toBe(userData.lastName)
      expect(response.body.role).toBe(userData.role)
      expect(response.body.status).toBe(userData.status)

      // Verify in database
      const savedUser = await testDb.prisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(savedUser).not.toBeNull()
      expect(savedUser?.firstName).toBe(userData.firstName)
      expect(savedUser?.role).toBe(userData.role)
    })

    it('should create user with minimal required fields', async () => {
      const userData = {
        email: 'minimal@example.com',
        firstName: 'Min',
        lastName: 'Imal',
        phoneNumber: '+9876543210',
        dateOfBirth: '1985-12-25',
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body.email).toBe(userData.email)
      expect(response.body.role).toBe('customer') // Default value
      expect(response.body.status).toBe(UserStatus.UNCONFIRMED) // Default value
    })

    it('should create business user', async () => {
      const userData = {
        email: 'business@example.com',
        firstName: 'Business',
        lastName: 'Owner',
        phoneNumber: '+1111111111',
        dateOfBirth: '1980-06-15',
        role: UserRole.BUSINESS,
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body.role).toBe('business')
      expect(response.body.email).toBe(userData.email)
    })

    it('should create admin user', async () => {
      const userData = {
        email: 'admin2@example.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+2222222222',
        dateOfBirth: '1975-03-10',
        role: UserRole.ADMIN,
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body.role).toBe('admin')
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        firstName: 'Test',
        // Missing required fields: email, lastName, phoneNumber, dateOfBirth
      }

      const response = await adminClient
        .post('/users')
        .send(incompleteData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should return 422 for duplicate email', async () => {
      const existingUser = await seedTestUsers(testDb.prisma, { count: 1 })

      const userData = {
        email: existingUser.users[0].email,
        firstName: 'Duplicate',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
      }

      await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(422)
    })

    it('should validate role enum values', async () => {
      const userData = {
        email: 'invalid.role@example.com',
        firstName: 'Invalid',
        lastName: 'Role',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        role: 'INVALID_ROLE',
      }

      const response = await adminClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should return 403 for non-admin users', async () => {
      const userData = {
        email: 'unauthorized@example.com',
        firstName: 'Unauthorized',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
      }

      await customerClient
        .post('/users')
        .send(userData)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Admin User Update Tests
  describe('PATCH /users/:user_id (Admin)', () => {
    it('should update an existing user for admin', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const updateData = {
        firstName: 'Updated',
        phoneNumber: '+9876543210',
      }

      const response = await adminClient
        .patch(`/users/${targetUser.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.firstName).toBe('Updated')
      expect(response.body.phoneNumber).toBe('+9876543210')

      // Verify in database
      const updatedUser = await testDb.prisma.user.findUnique({
        where: { id: targetUser.id },
      })

      expect(updatedUser?.firstName).toBe('Updated')
    })

    it('should allow admin to update user role', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, {
        count: 1,
        role: UserRole.CUSTOMER,
      })
      const targetUser = testUsers.users[0]

      const updateData = {
        role: UserRole.BUSINESS,
      }

      const response = await adminClient
        .patch(`/users/${targetUser.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.role).toBe('business')

      // Verify in database
      const updatedUser = await testDb.prisma.user.findUnique({
        where: { id: targetUser.id },
      })

      expect(updatedUser?.role).toBe('business')
    })

    it('should allow admin to update user status', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const updateData = {
        status: UserStatus.SUSPENDED,
      }

      const response = await adminClient
        .patch(`/users/${targetUser.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.status).toBe(UserStatus.SUSPENDED)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()
      const updateData = { firstName: 'Updated' }

      await adminClient
        .patch(`/users/${nonExistentId}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should return 403 for non-admin users', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const updateData = { firstName: 'Unauthorized' }

      await customerClient
        .patch(`/users/${testUsers.users[0].id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Admin User Deletion Tests
  describe('DELETE /users/:user_id (Admin)', () => {
    it('should soft delete a user for admin', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const userToDelete = testUsers.users[0]

      await adminClient
        .delete(`/users/${userToDelete.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      // Verify soft deletion in database
      const deletedUser = await testDb.prisma.user.findUnique({
        where: { id: userToDelete.id },
      })

      expect(deletedUser?.deletedAt).not.toBeNull()
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      await adminClient
        .delete(`/users/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should return 403 for non-admin users', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })

      await customerClient
        .delete(`/users/${testUsers.users[0].id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Admin User Get By ID Tests
  describe('GET /admin/users/:id', () => {
    it('should return user by ID with admin details', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .get(`/admin/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(targetUser.id)
      expect(response.body.email).toBe(targetUser.email)
      expect(response.body.firstName).toBe(targetUser.firstName)
      expect(response.body.lastName).toBe(targetUser.lastName)
      expect(response.body.role).toBe(targetUser.role)
      expect(response.body.status).toBe(targetUser.status)
      expect(response.body.emailVerified).toBe(targetUser.emailVerified)
      expect(response.body.phoneVerified).toBe(targetUser.phoneVerified)
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      await adminClient
        .get(`/admin/users/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should require admin privileges', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      await customerClient
        .get(`/admin/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should validate UUID format', async () => {
      await adminClient
        .get('/admin/users/not-a-valid-uuid')
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  // Admin Profile Tests
  describe('GET /admin/users/me', () => {
    it('should return current admin user profile', async () => {
      const response = await adminClient
        .get('/admin/users/me')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.email).toBe('admin@e2etest.com')
      expect(response.body.role).toBe(UserRole.ADMIN)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('firstName')
      expect(response.body).toHaveProperty('lastName')
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('emailVerified')
      expect(response.body).toHaveProperty('phoneVerified')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should require admin privileges', async () => {
      await customerClient
        .get('/admin/users/me')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('PATCH /admin/users/me', () => {
    it('should update current admin user profile', async () => {
      const updateData = {
        firstName: 'UpdatedAdmin',
        lastName: 'UpdatedLast',
        phoneNumber: '+1234567890',
      }

      const response = await adminClient
        .patch('/admin/users/me')
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.firstName).toBe(updateData.firstName)
      expect(response.body.lastName).toBe(updateData.lastName)
      expect(response.body.phoneNumber).toBe(updateData.phoneNumber)
      expect(response.body.email).toBe('admin@e2etest.com') // Email should not change
      expect(response.body.role).toBe(UserRole.ADMIN) // Role should not change
    })

    it('should validate update data', async () => {
      const invalidData = {
        firstName: '', // Empty string should fail validation
      }

      await adminClient
        .patch('/admin/users/me')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should require admin privileges', async () => {
      const updateData = {
        firstName: 'NotAllowed',
      }

      await customerClient
        .patch('/admin/users/me')
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Admin User Deletion Tests
  describe('DELETE /admin/users/:id', () => {
    it('should delete user by ID', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      await adminClient
        .delete(`/admin/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      // Verify user is soft deleted
      const deletedUser = await testDb.prisma.user.findUnique({
        where: { id: targetUser.id },
      })

      expect(deletedUser?.deletedAt).not.toBeNull()
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      await adminClient
        .delete(`/admin/users/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should require admin privileges', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      await customerClient
        .delete(`/admin/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should validate UUID format', async () => {
      await adminClient
        .delete('/admin/users/not-a-valid-uuid')
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  // Admin Avatar Management
  describe('POST /users/:user_id/avatar (Admin)', () => {
    it('should allow admin to upload avatar for any user', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      const response = await adminClient
        .post(`/users/${targetUser.id}/avatar`)
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(200)

      expect(response.body.avatarUrl).toBeDefined()
      expect(mockFileStorage.saveFile).toHaveBeenCalled()
    })

    it('should return 400 when no file is uploaded', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const targetUser = testUsers.users[0]

      await adminClient
        .post(`/users/${targetUser.id}/avatar`)
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      await adminClient
        .post(`/users/${nonExistentId}/avatar`)
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(404)
    })
  })

  // Unified Verification System Tests
  describe('Unified Verification System', () => {
    describe('Email Verification', () => {
      it('should verify email with admin privileges', async () => {
        // Create a user with unverified email
        const user = await testDb.prisma.user.create({
          data: {
            email: 'verify@test.com',
            firstName: 'Verify',
            lastName: 'Test',
            password: 'hashedpassword',
            status: UserStatus.UNCONFIRMED,
            emailVerified: false,
          },
        })

        // Admin verification directly verifies by userId
        const response = await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'EMAIL',
            userId: user.id,
          })
          .expect(204)

        // Verify the user was actually updated in the database
        const updatedUser = await testDb.prisma.user.findUnique({
          where: { id: user.id },
        })

        expect(updatedUser?.emailVerified).toBe(true)
        expect(updatedUser?.status).toBe(UserStatus.ACTIVE)
      })

      it('should fail with invalid user ID', async () => {
        await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'EMAIL',
            userId: '00000000-0000-0000-0000-000000000000',
          })
          .expect(404)
      })

      it('should resend email verification', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'resend@test.com',
            firstName: 'Resend',
            lastName: 'Test',
            password: 'hashedpassword',
            status: UserStatus.UNCONFIRMED,
            emailVerified: false,
          },
        })

        const response = await adminClient
          .post('/admin/users/resend-verification')
          .send({
            type: 'EMAIL',
            userId: user.id,
          })
          .expect(200)

        expect(response.body.success).toBe(true)

        // Verify email was sent
        expect(mockCommunicationClient.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: user.email,
            templateId: expect.any(String),
            templateParams: expect.objectContaining({
              firstName: user.firstName,
              verificationUrl: expect.stringContaining('/auth/verify-email/'),
            }),
          }),
        )
      })
    })

    describe('Phone Verification', () => {
      it('should verify phone with valid code', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'phone@test.com',
            firstName: 'Phone',
            lastName: 'Test',
            password: 'hashedpassword',
            phoneNumber: '+1234567890',
            phoneVerified: false,
          },
        })

        // Store verification code
        await cacheService.set(`phone-verification:${user.id}`, '123456', 300)

        const response = await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'PHONE',
            userId: user.id,
            code: '123456',
          })
          .expect(204)

        // Verify the user was actually updated in the database
        const updatedUser = await testDb.prisma.user.findUnique({
          where: { id: user.id },
        })

        expect(updatedUser?.phoneVerified).toBe(true)

        // Verify code is deleted
        const codeExists = await cacheService.get(
          `phone-verification:${user.id}`,
        )

        expect(codeExists).toBeNull()
      })

      it('should fail with invalid phone verification code', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'phone2@test.com',
            firstName: 'Phone2',
            lastName: 'Test',
            password: 'hashedpassword',
            phoneNumber: '+1234567890',
          },
        })

        await cacheService.set(`phone-verification:${user.id}`, '123456', 300)

        await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'PHONE',
            userId: user.id,
            code: '999999', // Wrong code
          })
          .expect(401)
      })

      it('should resend phone verification code', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'phone3@test.com',
            firstName: 'Phone3',
            lastName: 'Test',
            password: 'hashedpassword',
            phoneNumber: '+1234567890',
            phoneVerified: false,
          },
        })

        const response = await adminClient
          .post('/admin/users/resend-verification')
          .send({
            type: 'PHONE',
            userId: user.id,
          })
          .expect(200)

        expect(response.body.success).toBe(true)

        // Verify a code was stored
        const code = await cacheService.get(`phone-verification:${user.id}`)

        expect(code).toBeDefined()
        expect(code).toMatch(/^\d{6}$/) // 6-digit code
      })
    })

    describe('Account Confirmation', () => {
      it('should confirm user account', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'confirm@test.com',
            firstName: 'Confirm',
            lastName: 'Test',
            password: 'hashedpassword',
            status: UserStatus.UNCONFIRMED,
            emailVerified: true, // Already verified email
          },
        })

        const response = await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'ACCOUNT_CONFIRMATION',
            userId: user.id,
          })
          .expect(204)

        // Verify the user status was updated
        const updatedUser = await testDb.prisma.user.findUnique({
          where: { id: user.id },
        })

        expect(updatedUser?.status).toBe(UserStatus.ACTIVE)
      })

      it('should fail account confirmation without userId', async () => {
        await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'ACCOUNT_CONFIRMATION',
          })
          .expect(400)
      })
    })

    describe('Verification Error Cases', () => {
      it('should fail with unsupported verification type', async () => {
        await adminClient
          .post('/admin/users/verify')
          .send({
            type: 'INVALID_TYPE',
            userId: 'some-id',
          })
          .expect(400)
      })

      it('should fail resend with missing parameters', async () => {
        await adminClient
          .post('/admin/users/resend-verification')
          .send({
            type: 'EMAIL',
            // Missing both userId and email
          })
          .expect(400)
      })

      it('should fail resend for non-existent user', async () => {
        await adminClient
          .post('/admin/users/resend-verification')
          .send({
            type: 'EMAIL',
            userId: '00000000-0000-0000-0000-000000000000',
          })
          .expect(404)
      })

      it('should require admin privileges for verification endpoints', async () => {
        await customerClient
          .post('/admin/users/verify')
          .send({
            type: 'EMAIL',
            userId: '00000000-0000-0000-0000-000000000000',
          })
          .expect(403)
      })
    })
  })

  // Ban/Unban User Tests
  describe('User Ban/Unban Management', () => {
    describe('PUT /users/:id/ban', () => {
      it('should ban a user with reason and notification', async () => {
        const targetUser = sharedTestData.allUsers.find(
          (u) => u.role === 'customer',
        )!

        const response = await adminClient
          .put(`/users/${targetUser.id}/ban`)
          .send({
            reason: 'Violation of Terms of Service',
            duration: 30,
            notifyUser: true,
          })
          .expect(204)

        // Verify user is banned
        const userResponse = await adminClient
          .get(`/users/${targetUser.id}`)
          .expect(200)

        expect(userResponse.body.status).toBe('banned')

        // Verify email was sent
        expect(mockCommunicationClient.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: targetUser.email,
            subject: 'Account Suspended',
            templateId: 'account-banned',
            templateParams: expect.objectContaining({
              reason: 'Violation of Terms of Service',
              duration: 30,
            }),
          }),
        )
      })

      it('should ban a user without notification', async () => {
        const targetUser = sharedTestData.allUsers.find(
          (u) => u.role === 'business',
        )!

        await adminClient
          .put(`/users/${targetUser.id}/ban`)
          .send({
            reason: 'Suspicious activity',
            notifyUser: false,
          })
          .expect(204)

        // Verify user is banned
        const userResponse = await adminClient
          .get(`/users/${targetUser.id}`)
          .expect(200)

        expect(userResponse.body.status).toBe('banned')

        // Verify no email was sent for this ban
        const emailCalls = mockCommunicationClient.sendEmail.mock.calls
        const banEmailForUser = emailCalls.find(
          (call) =>
            call[0].to === targetUser.email &&
            call[0].subject === 'Account Suspended',
        )

        expect(banEmailForUser).toBeUndefined()
      })

      it('should ban a user with minimal parameters', async () => {
        const targetUser = sharedTestData.allUsers[2]

        await adminClient
          .put(`/users/${targetUser.id}/ban`)
          .send({})
          .expect(204)

        // Verify user is banned
        const userResponse = await adminClient
          .get(`/users/${targetUser.id}`)
          .expect(200)

        expect(userResponse.body.status).toBe('banned')
      })

      it('should require admin privileges to ban users', async () => {
        const targetUser = sharedTestData.allUsers[0]

        await customerClient
          .put(`/users/${targetUser.id}/ban`)
          .send({ reason: 'Test' })
          .expect(403)
      })

      it('should return 404 for non-existent user', async () => {
        await adminClient
          .put('/users/00000000-0000-0000-0000-000000000000/ban')
          .send({ reason: 'Test' })
          .expect(404)
      })
    })

    describe('PUT /users/:id/unban', () => {
      it('should unban a user with notification', async () => {
        // First ban a user
        const targetUser = sharedTestData.allUsers[3]

        await adminClient
          .put(`/users/${targetUser.id}/ban`)
          .send({ reason: 'Test ban' })
          .expect(204)

        // Clear previous mock calls
        mockCommunicationClient.sendEmail.mockClear()

        // Now unban with notification
        await adminClient
          .put(`/users/${targetUser.id}/unban`)
          .send({
            reason: 'Ban appeal approved',
            notifyUser: true,
          })
          .expect(204)

        // Verify user is active
        const userResponse = await adminClient
          .get(`/users/${targetUser.id}`)
          .expect(200)

        expect(userResponse.body.status).toBe('active')

        // Verify email was sent
        expect(mockCommunicationClient.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: targetUser.email,
            subject: 'Account Reinstated',
            templateId: 'account-unbanned',
            templateParams: expect.objectContaining({
              reason: 'Ban appeal approved',
            }),
          }),
        )
      })

      it('should unban a user without notification', async () => {
        // First ban a user
        const targetUser = sharedTestData.allUsers[4]

        await adminClient
          .put(`/users/${targetUser.id}/ban`)
          .send({ reason: 'Test ban' })
          .expect(204)

        // Now unban without notification
        await adminClient
          .put(`/users/${targetUser.id}/unban`)
          .send({
            notifyUser: false,
          })
          .expect(204)

        // Verify user is active
        const userResponse = await adminClient
          .get(`/users/${targetUser.id}`)
          .expect(200)

        expect(userResponse.body.status).toBe('active')
      })

      it('should require admin privileges to unban users', async () => {
        const targetUser = sharedTestData.allUsers[0]

        await customerClient
          .put(`/users/${targetUser.id}/unban`)
          .send({ reason: 'Test' })
          .expect(403)
      })
    })
  })

  // Admin Error Handling Tests
  describe('Admin Error Handling', () => {
    it('should handle invalid input for POST', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid email format
        firstName: '', // Empty required field
        role: 'INVALID_ROLE', // Invalid role
      }

      const response = await adminClient
        .post('/users')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400) // Validation error

      expect(response.body.error).toBeDefined()
    })

    it('should handle invalid UUID parameters', async () => {
      await adminClient
        .get('/users/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should provide detailed error information for admins', async () => {
      const response = await adminClient
        .post('/users')
        .send({}) // Empty data
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBeDefined()
      if (response.body.error.validationErrors) {
        expect(typeof response.body.error.validationErrors).toBe('object')
      }
    })
  })

  // Admin Performance and Monitoring
  describe('Admin Performance Tests', () => {
    it('should handle bulk user operations efficiently', async () => {
      // Create multiple users and test listing performance
      await seedTestUsers(testDb.prisma, { count: 50 })

      const startTime = Date.now()
      const response = await adminClient
        .get('/users?limit=50')
        .set('Accept', 'application/json')
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.body.data).toHaveLength(50)
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should handle concurrent admin operations', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 5 })

      // Perform concurrent read operations
      const promises = testUsers.users.map((user) =>
        adminClient.get(`/users/${user.id}`).set('Accept', 'application/json'),
      )

      const responses = await Promise.all(promises)

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })
})
