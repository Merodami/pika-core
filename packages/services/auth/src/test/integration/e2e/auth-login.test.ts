/**
 * Auth Login Integration Tests
 *
 * Tests for the authentication login flow, including password grant,
 * refresh token grant, and various edge cases.
 */

import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { createAuthServer } from '@auth-service/server.js'
import {
  createSharedAuthTestData,
  type SharedAuthTestData,
} from '@auth-service/test/helpers/authTestHelpers.js'
import { CommunicationServiceClientMock } from '@auth-service/test/mocks/CommunicationServiceClientMock.js'
import { UserServiceClientMock } from '@auth-service/test/mocks/UserServiceClientMock.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createTestDatabase,
  TestDatabaseResult,
} from '@pika/tests'
import { UserRole } from '@pika/types'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Auth Login Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let cacheService: MemoryCacheService

  // Shared test data created once
  let sharedTestData: SharedAuthTestData
  let userServiceClient: UserServiceClientMock
  let communicationClient: CommunicationServiceClientMock

  beforeAll(async () => {
    logger.debug('Setting up Auth Login integration tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_auth_login_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create cache service
    cacheService = new MemoryCacheService()

    // Create mock service clients
    userServiceClient = new UserServiceClientMock()
    communicationClient = new CommunicationServiceClientMock()

    // Create auth server with mocked service clients
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient,
      communicationClient,
    })

    request = supertest(app)

    // Initialize E2E Authentication Helper

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedAuthTestData(testDb.prisma)

    logger.debug(`Created ${sharedTestData.allUsers.length} test users`)

    logger.debug('Auth login setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache between tests
    await cacheService.clearAll()

    // Note: We do NOT clear the database between tests
    // Test data is created once and reused
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Authentication Tests with mocked services
  describe('POST /auth/token - Password Grant', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshToken: expect.any(String),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.CUSTOMER,
        },
      })
    })

    it('should reject authentication when user not found', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Invalid email or password',
        }),
      })
    })

    it('should reject authentication with wrong password', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Invalid email or password',
        }),
      })
    })

    it('should reject authentication for inactive user', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'inactive@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Account is inactive. Please contact support.',
        }),
      })
    })

    it('should handle user without password (OAuth-only account)', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'oauth@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Password authentication not available for this account',
        }),
      })
    })

    it('should update last login time on successful authentication', async () => {
      // Test with an active user
      const testEmail = 'active1@example.com'

      // Get the user from mock
      const userBefore = await userServiceClient.getUserByEmail(testEmail)
      const beforeLoginTime = userBefore?.lastLoginAt

      await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: testEmail,
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Get updated user from mock
      const userAfter = await userServiceClient.getUserByEmail(testEmail)

      // Verify lastLoginAt was updated
      expect(userAfter?.lastLoginAt).toBeTruthy()
      if (beforeLoginTime) {
        expect(new Date(userAfter?.lastLoginAt).getTime()).toBeGreaterThan(
          new Date(beforeLoginTime).getTime(),
        )
      }
    })

    it('should handle admin user authentication', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'admin@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        user: {
          role: UserRole.ADMIN,
        },
      })
    })
  })

  // Input Validation Tests
  describe('Input Validation', () => {
    it('should validate email format in username field', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'invalid-email',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    })

    it('should require both username and password', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    })

    it('should handle empty strings as missing values', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: '',
          password: '',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    })
  })
})
