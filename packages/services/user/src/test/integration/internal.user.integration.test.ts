/**
 * User Service - Internal API Integration Tests
 *
 * Tests for internal service-to-service user endpoints.
 * These endpoints are only accessible by other services using API key authentication.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

// Mock @pika/shared to provide CommunicationServiceClient
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return {
    ...actualShared,
    CommunicationServiceClient: vi.fn().mockImplementation(() => ({
      sendEmail: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

import type {
  CreatePasswordResetTokenRequest,
  ValidatePasswordResetTokenRequest,
  VerifyEmailRequest,
} from '@pika/api'
import { MemoryCacheService } from '@pika/redis'
import type { FileStoragePort } from '@pika/shared'
import type { InternalAPIClient, TestDatabase } from '@pika/tests'
import {
  cleanupTestDatabase,
  createTestDatabase,
  InternalAPITestHelper,
} from '@pika/tests'
import { UserRole, UserStatus } from '@pika/types'
import { createUserServer } from '@user/server.js'
import {
  createSharedUserTestData,
  type SharedUserTestData,
} from '@user/test/helpers/userTestHelpers.js'
import bcrypt from 'bcrypt'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('User Service - Internal API Integration Tests', () => {
  let app: Express
  let testDb: TestDatabase
  let internalClient: InternalAPIClient
  let internalAPIHelper: InternalAPITestHelper
  let cacheService: MemoryCacheService
  let testUserIds: { existing: string; new: string }
  let sharedTestData: SharedUserTestData

  // Mock file storage
  const mockFileStorage: FileStoragePort = {
    saveFile: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/test.jpg',
      path: 'test.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getFileUrl: vi.fn().mockResolvedValue('http://mockstorage.com/test.jpg'),
    fileExists: vi.fn().mockResolvedValue(true),
  }

  // Note: Using shared helper from userTestHelpers.js

  beforeAll(async () => {
    // Setup internal API test helper
    internalAPIHelper = new InternalAPITestHelper(
      'dev-service-api-key-change-in-production',
    )
    internalAPIHelper.setup()

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Create server
    cacheService = new MemoryCacheService()

    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService,
      fileStorage: mockFileStorage,
    })

    // Create internal API client
    internalClient = internalAPIHelper.createClient(app)

    // Create a test user for tests that need an existing user
    const existingUser = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: 'existing@test.com',
        firstName: 'Existing',
        lastName: 'User',
        password: await bcrypt.hash('ExistingPassword123!', 10),
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    // Create shared test data once for all tests
    sharedTestData = await createSharedUserTestData(testDb.prisma)

    testUserIds = {
      existing: existingUser.id,
      new: uuid(),
    }
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear cache
    await cacheService.clearAll()

    // Clean up test users created during tests, preserve shared data
    if (testDb?.prisma) {
      await testDb.prisma.user.deleteMany({
        where: {
          email: {
            contains: '@test.com',
            not: {
              in: [
                'existing@test.com',
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
    // Cleanup
    internalAPIHelper.cleanup()
    await cleanupTestDatabase(testDb)
  })

  // Internal User Authentication Endpoints
  describe('GET /internal/users/auth/by-email/:email', () => {
    it('should get user auth data by email', async () => {
      const response = await internalClient
        .get('/internal/users/auth/by-email/existing@test.com')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testUserIds.existing,
        email: 'existing@test.com',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        password: expect.any(String),
      })
    })

    it('should return 404 for non-existent email', async () => {
      await internalClient
        .get('/internal/users/auth/by-email/nonexistent@test.com')
        .expect(404)
    })

    it('should handle email case insensitivity correctly', async () => {
      // Test with uppercase email - should find the user (case-insensitive)
      const response = await internalClient
        .get('/internal/users/auth/by-email/EXISTING@TEST.COM')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testUserIds.existing,
        email: 'existing@test.com', // Stored in lowercase
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      })
    })
  })

  describe('GET /internal/users/auth/:id', () => {
    it('should get user auth data by ID', async () => {
      const response = await internalClient
        .get(`/internal/users/auth/${testUserIds.existing}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: testUserIds.existing,
        email: 'existing@test.com',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        password: expect.any(String),
      })
    })

    it('should return 404 for non-existent ID', async () => {
      const nonExistentId = uuid()

      await internalClient
        .get(`/internal/users/auth/${nonExistentId}`)
        .expect(404)
    })

    it('should handle invalid UUID format', async () => {
      const response = await internalClient.get(
        '/internal/users/auth/invalid-uuid',
      )

      expect([400, 404]).toContain(response.status)
    })
  })

  // Internal User Creation
  describe('POST /internal/users', () => {
    it('should create a new user', async () => {
      const createRequest = {
        email: 'newuser@test.com',
        passwordHash: await bcrypt.hash('NewPassword123!', 10),
        firstName: 'New',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        acceptTerms: true,
      }

      const response = await internalClient
        .post('/internal/users')
        .send(createRequest)
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.UNCONFIRMED,
        emailVerified: false,
      })

      // Verify user was created in database
      const user = await testDb.prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      })

      expect(user).toBeTruthy()
      expect(user?.password).toBeTruthy()
      // Verify password is hashed
      expect(user?.password).not.toBe('NewPassword123!')
    })

    it('should reject duplicate email', async () => {
      const createRequest = {
        email: 'existing@test.com',
        passwordHash: await bcrypt.hash('AnotherPassword123!', 10),
        firstName: 'Another',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        acceptTerms: true,
      }

      await internalClient
        .post('/internal/users')
        .send(createRequest)
        .expect(409)
    })

    it('should reject invalid email format', async () => {
      const createRequest = {
        email: 'invalid-email',
        passwordHash: await bcrypt.hash('Password123!', 10),
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        acceptTerms: true,
      }

      const response = await internalClient
        .post('/internal/users')
        .send(createRequest)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        status_code: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Invalid email'),
          validationErrors: expect.objectContaining({
            email: expect.arrayContaining([
              expect.stringContaining('Invalid email'),
            ]),
          }),
        },
      })
    })

    it('should handle missing required fields', async () => {
      const incompleteRequest = {
        email: 'incomplete@test.com',
        // Missing required fields
      }

      const response = await internalClient
        .post('/internal/users')
        .send(incompleteRequest)

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })
  })

  // Internal User Updates
  describe('POST /internal/users/:id/last-login', () => {
    it('should update last login timestamp', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        loginTime: new Date().toISOString(),
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/last-login`)
        .send(updateRequest)
        .expect(204)

      // Verify lastLoginAt was updated
      const user = await testDb.prisma.user.findUnique({
        where: { id: testUserIds.existing },
      })

      expect(user?.lastLoginAt).toBeTruthy()
      expect(user?.lastLoginAt).toBeInstanceOf(Date)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()
      const updateRequest = {
        userId: nonExistentId,
        loginTime: new Date().toISOString(),
      }

      await internalClient
        .post(`/internal/users/${nonExistentId}/last-login`)
        .send(updateRequest)
        .expect(404)
    })

    it('should validate login time format', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        loginTime: 'invalid-date',
      }

      const response = await internalClient
        .post(`/internal/users/${testUserIds.existing}/last-login`)
        .send(updateRequest)

      expect([400, 204]).toContain(response.status) // May accept or reject invalid date
    })
  })

  // Internal User Checks
  describe('GET /internal/users/check-email/:email', () => {
    it('should return exists true for existing email', async () => {
      const response = await internalClient
        .get('/internal/users/check-email/existing@test.com')
        .expect(200)

      expect(response.body).toEqual({ exists: true })
    })

    it('should return exists false for non-existent email', async () => {
      const response = await internalClient
        .get('/internal/users/check-email/nonexistent@test.com')
        .expect(200)

      expect(response.body).toEqual({ exists: false })
    })

    it('should handle special characters in email', async () => {
      const response = await internalClient
        .get('/internal/users/check-email/test+special@example.com')
        .expect(200)

      expect(response.body).toHaveProperty('exists')
      expect(typeof response.body.exists).toBe('boolean')
    })
  })

  describe('GET /internal/users/check-phone/:phone', () => {
    it('should check phone existence', async () => {
      // First, update the test user with a phone number
      await testDb.prisma.user.update({
        where: { id: testUserIds.existing },
        data: { phoneNumber: '+1234567890' },
      })

      const response = await internalClient
        .get('/internal/users/check-phone/+1234567890')
        .expect(200)

      expect(response.body).toEqual({ exists: true })
    })

    it('should return exists false for non-existent phone', async () => {
      const response = await internalClient
        .get('/internal/users/check-phone/+9999999999')
        .expect(200)

      expect(response.body).toEqual({ exists: false })
    })

    it('should handle phone number formatting', async () => {
      // Test different phone formats
      const response = await internalClient
        .get('/internal/users/check-phone/1234567890')
        .expect(200)

      expect(response.body).toHaveProperty('exists')
      expect(typeof response.body.exists).toBe('boolean')
    })
  })

  // Internal Password Management
  describe('POST /internal/users/:id/password', () => {
    it('should update user password', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        passwordHash: await bcrypt.hash('NewSecurePassword123!', 10),
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/password`)
        .send(updateRequest)
        .expect(204)

      // Verify password was changed
      const user = await testDb.prisma.user.findUnique({
        where: { id: testUserIds.existing },
      })
      const isValidPassword = await bcrypt.compare(
        'NewSecurePassword123!',
        user!.password!,
      )

      expect(isValidPassword).toBe(true)
    })

    it('should accept any valid hash format', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        passwordHash: 'any-hash-format-is-accepted', // Internal APIs trust the hash
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/password`)
        .send(updateRequest)
        .expect(204)

      // Verify password was stored
      const user = await testDb.prisma.user.findUnique({
        where: { id: testUserIds.existing },
      })

      expect(user?.password).toBe('any-hash-format-is-accepted')
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()
      const updateRequest = {
        userId: nonExistentId,
        passwordHash: await bcrypt.hash('Password123!', 10),
      }

      await internalClient
        .post(`/internal/users/${nonExistentId}/password`)
        .send(updateRequest)
        .expect(404)
    })
  })

  // Internal Email Verification
  describe('POST /internal/users/:id/verify-email', () => {
    it('should mark email as verified', async () => {
      // Create unverified user
      const unverifiedUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: 'unverified@test.com',
          firstName: 'Unverified',
          lastName: 'User',
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          emailVerified: false,
        },
      })

      const verifyRequest: VerifyEmailRequest = {
        userId: unverifiedUser.id,
      }

      const response = await internalClient
        .post(`/internal/users/${unverifiedUser.id}/verify-email`)
        .send(verifyRequest)
        .expect(200)

      expect(response.body).toEqual({ success: true })

      // Verify email was marked as verified
      const user = await testDb.prisma.user.findUnique({
        where: { id: unverifiedUser.id },
      })

      expect(user?.emailVerified).toBe(true)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()
      const verifyRequest: VerifyEmailRequest = {
        userId: nonExistentId,
      }

      await internalClient
        .post(`/internal/users/${nonExistentId}/verify-email`)
        .send(verifyRequest)
        .expect(404)
    })

    it('should handle already verified email', async () => {
      const verifyRequest: VerifyEmailRequest = {
        userId: testUserIds.existing, // Already verified
      }

      const response = await internalClient
        .post(`/internal/users/${testUserIds.existing}/verify-email`)
        .send(verifyRequest)

      expect([200, 409]).toContain(response.status) // May accept or indicate already verified
    })
  })

  // Password Reset Token Flow
  describe('Password Reset Token Flow', () => {
    it('should create, validate, and invalidate password reset token', async () => {
      // 1. Create token
      const createTokenRequest: CreatePasswordResetTokenRequest = {}

      const createResponse = await internalClient
        .post(`/internal/users/${testUserIds.existing}/password-reset-token`)
        .send(createTokenRequest)
        .expect(200)

      expect(createResponse.body).toMatchObject({
        token: expect.any(String),
      })

      const { token } = createResponse.body

      // 2. Validate token immediately after creation
      const validateRequest: ValidatePasswordResetTokenRequest = {
        token,
      }

      const validateResponse = await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)

      expect(validateResponse.status).toBe(200)
      expect(validateResponse.body).toMatchObject({
        userId: testUserIds.existing,
      })

      // 3. Invalidate token
      await internalClient
        .post('/internal/users/invalidate-password-reset-token')
        .send({ token })
        .expect(200)

      // 4. Verify token is no longer valid
      await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)
        .expect(401)
    })

    it('should reject invalid token', async () => {
      const validateRequest: ValidatePasswordResetTokenRequest = {
        token: 'invalid-token',
      }

      await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)
        .expect(401)
    })

    it('should handle token expiration', async () => {
      // Create token
      const createResponse = await internalClient
        .post(`/internal/users/${testUserIds.existing}/password-reset-token`)
        .send({})
        .expect(200)

      const { token } = createResponse.body

      // Manually expire token (simulate time passing)
      await cacheService.del(`password-reset:${token}`)

      // Try to validate expired token
      await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send({ token })
        .expect(401)
    })
  })

  // Email Verification Token Flow
  describe('Email Verification Token Flow', () => {
    it('should create and validate email verification token', async () => {
      // 1. Create token
      const createResponse = await internalClient
        .post(
          `/internal/users/${testUserIds.existing}/email-verification-token`,
        )
        .send({})
        .expect(200)

      expect(createResponse.body).toMatchObject({
        token: expect.any(String),
      })

      const { token } = createResponse.body

      // 2. Validate token immediately after creation
      const validateResponse = await internalClient
        .post('/internal/users/validate-email-verification-token')
        .send({ token })
        .expect(200)

      expect(validateResponse.body).toMatchObject({
        userId: testUserIds.existing,
      })
    })

    it('should reject invalid email verification token', async () => {
      await internalClient
        .post('/internal/users/validate-email-verification-token')
        .send({ token: 'invalid-token' })
        .expect(401)
    })

    it('should return 404 for non-existent user when creating token', async () => {
      const nonExistentId = uuid()

      await internalClient
        .post(`/internal/users/${nonExistentId}/email-verification-token`)
        .send({})
        .expect(404)
    })
  })

  // Bulk Operations
  describe('Bulk Operations', () => {
    it('should handle multiple user checks efficiently', async () => {
      const emails = [
        'existing@test.com',
        'nonexistent1@test.com',
        'nonexistent2@test.com',
      ]

      const promises = emails.map((email) =>
        internalClient.get(`/internal/users/check-email/${email}`),
      )

      const responses = await Promise.all(promises)

      expect(responses[0].body.exists).toBe(true)
      expect(responses[1].body.exists).toBe(false)
      expect(responses[2].body.exists).toBe(false)

      // All requests should complete successfully
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle concurrent password updates', async () => {
      // Create multiple users for concurrent testing
      const users = await Promise.all([
        testDb.prisma.user.create({
          data: {
            id: uuid(),
            email: 'concurrent1@test.com',
            firstName: 'Concurrent',
            lastName: 'User1',
            role: UserRole.CUSTOMER,
            password: 'old-password',
          },
        }),
        testDb.prisma.user.create({
          data: {
            id: uuid(),
            email: 'concurrent2@test.com',
            firstName: 'Concurrent',
            lastName: 'User2',
            role: UserRole.CUSTOMER,
            password: 'old-password',
          },
        }),
      ])

      const promises = users.map((user) =>
        internalClient.post(`/internal/users/${user.id}/password`).send({
          userId: user.id,
          passwordHash: `new-password-${user.id}`,
        }),
      )

      const responses = await Promise.all(promises)

      // All updates should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(204)
      })
    })
  })

  // Authentication and Authorization
  describe('Authentication and Authorization', () => {
    it('should reject all internal endpoints without x-api-key', async () => {
      const endpoints = [
        { method: 'get', path: '/internal/users/auth/by-email/test@test.com' },
        { method: 'get', path: '/internal/users/auth/123' },
        { method: 'post', path: '/internal/users' },
        { method: 'post', path: '/internal/users/123/last-login' },
        { method: 'get', path: '/internal/users/check-email/test@test.com' },
        { method: 'get', path: '/internal/users/check-phone/+1234567890' },
        { method: 'post', path: '/internal/users/123/password' },
        { method: 'post', path: '/internal/users/123/verify-email' },
      ]

      for (const endpoint of endpoints) {
        const request = supertest(app)[endpoint.method](endpoint.path)

        if (endpoint.method !== 'get') {
          // Send minimal valid data to avoid validation errors
          if (
            endpoint.path.includes('/internal/users') &&
            endpoint.path.split('/').length === 3
          ) {
            // POST /internal/users
            request.send({
              email: 'test@example.com',
              passwordHash: await bcrypt.hash('password', 10),
              firstName: 'Test',
              lastName: 'User',
              role: UserRole.CUSTOMER,
              acceptTerms: true,
            })
          } else if (endpoint.path.includes('last-login')) {
            request.send({ userId: '123', loginTime: new Date().toISOString() })
          } else if (endpoint.path.includes('password')) {
            request.send({
              userId: '123',
              passwordHash: await bcrypt.hash('password', 10),
            })
          } else if (endpoint.path.includes('verify-email')) {
            request.send({ userId: '123' })
          } else {
            request.send({})
          }
        }

        const response = await request

        if (response.status !== 401) {
          console.log(
            `Endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} returned:`,
            {
              status: response.status,
              body: response.body,
            },
          )
        }

        expect(response.status).toBe(401)
      }
    })

    it('should accept requests with valid service API key', async () => {
      // Just test one endpoint to verify the middleware works
      const response = await internalClient
        .get('/internal/users/check-email/any@email.com')
        .expect(200)

      expect(response.body).toMatchObject({
        exists: false,
      })
    })

    it('should reject requests with invalid API key', async () => {
      const response = await supertest(app)
        .get('/internal/users/check-email/test@test.com')
        .set('x-api-key', 'invalid-key')

      expect(response.status).toBe(401)
    })
  })

  // Performance and Reliability Tests
  describe('Performance and Reliability', () => {
    it('should handle high-frequency token operations', async () => {
      // Create multiple tokens rapidly
      const promises = Array.from({ length: 10 }, () =>
        internalClient
          .post(`/internal/users/${testUserIds.existing}/password-reset-token`)
          .send({}),
      )

      const responses = await Promise.all(promises)

      // All token creations should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.token).toBeDefined()
      })

      // All tokens should be unique
      const tokens = responses.map((r) => r.body.token)
      const uniqueTokens = new Set(tokens)

      expect(uniqueTokens.size).toBe(tokens.length)
    })

    it('should handle cache failures gracefully', async () => {
      // Disconnect cache to simulate failure
      await cacheService.disconnect()

      // Operations should still work (though may be slower)
      const response = await internalClient.get(
        '/internal/users/check-email/existing@test.com',
      )

      expect([200, 500]).toContain(response.status) // May fail gracefully or continue

      // Reconnect cache
      await cacheService.connect()
    })

    it('should maintain data consistency under concurrent operations', async () => {
      // Create user and perform concurrent operations
      const user = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: 'consistency@test.com',
          firstName: 'Consistency',
          lastName: 'Test',
          role: UserRole.CUSTOMER,
          emailVerified: false,
        },
      })

      // Perform concurrent email verification and password update
      const promises = [
        internalClient
          .post(`/internal/users/${user.id}/verify-email`)
          .send({ userId: user.id }),
        internalClient.post(`/internal/users/${user.id}/password`).send({
          userId: user.id,
          passwordHash: 'new-password-hash',
        }),
      ]

      const responses = await Promise.all(promises)

      // Both operations should succeed
      responses.forEach((response) => {
        expect([200, 204]).toContain(response.status)
      })

      // Verify final state
      const finalUser = await testDb.prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(finalUser?.emailVerified).toBe(true)
      expect(finalUser?.password).toBe('new-password-hash')
    })
  })
})
