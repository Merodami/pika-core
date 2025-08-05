/**
 * OAuth 2.0 Integration Tests
 *
 * Tests for OAuth 2.0 endpoints including token generation,
 * refresh, introspection, and revocation.
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
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
} from '@pika/tests'
import { UserRole } from '@pika/types'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('OAuth 2.0 Endpoints Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Shared test data created once
  let sharedTestData: SharedAuthTestData
  let userServiceClient: UserServiceClientMock
  let communicationClient: CommunicationServiceClientMock

  beforeAll(async () => {
    logger.debug('Setting up OAuth integration tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_oauth_db',
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
    authHelper = createE2EAuthHelper(app)

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedAuthTestData(testDb.prisma)

    logger.debug(`Created ${sharedTestData.allUsers.length} test users`)

    logger.debug('OAuth setup complete')
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

  describe('POST /auth/token', () => {
    describe('Password Grant', () => {
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

      it('should reject invalid password', async () => {
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

      it('should reject non-existent user', async () => {
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
    })

    describe('Refresh Token Grant', () => {
      it('should refresh valid token', async () => {
        // Get a valid refresh token first
        const loginResponse = await request
          .post('/auth/token')
          .send({
            grantType: 'password',
            username: 'test@example.com',
            password: 'Password123!',
          })
          .set('Accept', 'application/json')
          .expect(200)

        const refreshToken = loginResponse.body.refreshToken

        // Use refresh token
        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'refreshToken',
            refreshToken,
          })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
          tokenType: 'Bearer',
          expiresIn: 900,
          refreshToken: expect.any(String),
        })

        // New access token should be different, refresh token may be the same
        expect(response.body.accessToken).not.toBe(
          loginResponse.body.accessToken,
        )
        // Note: In this implementation, refresh token is not rotated
      })

      it('should reject invalid refresh token', async () => {
        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'refreshToken',
            refreshToken: 'invalid-refresh-token',
          })
          .set('Accept', 'application/json')
          .expect(401)

        expect(response.body).toMatchObject({
          error: expect.objectContaining({
            message: expect.stringContaining('Invalid token format'),
          }),
        })
      })
    })

    it('should reject unsupported grant type', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'implicit',
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

  describe('POST /auth/introspect', () => {
    it('should introspect valid access token', async () => {
      // Get a fresh token for this test
      const tokenResponse = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const response = await request
        .post('/auth/introspect')
        .send({
          token: tokenResponse.body.accessToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        active: true,
        sub: '123e4567-e89b-12d3-a456-426614174001',
        tokenType: 'Bearer',
        scope: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      })
    })

    it('should return inactive for invalid token', async () => {
      const response = await request
        .post('/auth/introspect')
        .send({
          token: 'invalid-token',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        active: false,
      })
    })

    it('should return inactive for expired token', async () => {
      // Create an expired token using authHelper
      const expiredToken = authHelper.generateTestToken({
        userId: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
        role: 'USER',
        expiresIn: '-1h', // Expired 1 hour ago
      })

      const response = await request
        .post('/auth/introspect')
        .send({
          token: expiredToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        active: false,
      })
    })
  })

  describe('POST /auth/revoke', () => {
    it('should revoke valid token', async () => {
      // Get a fresh token using active user
      const loginResponse = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'active2@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const tokenToRevoke = loginResponse.body.accessToken

      // Revoke the token
      const response = await request
        .post('/auth/revoke')
        .send({
          token: tokenToRevoke,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
      })

      // Verify token is revoked by trying to introspect it
      const introspectResponse = await request
        .post('/auth/introspect')
        .send({
          token: tokenToRevoke,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(introspectResponse.body).toMatchObject({
        active: false,
      })
    })

    it('should always return success for invalid tokens', async () => {
      const response = await request
        .post('/auth/revoke')
        .send({
          token: 'invalid-token',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
      })
    })

    it.skip('should revoke all tokens when allDevices is true', async () => {
      // TODO: Implement revokeAllTokens in AuthService
      // Use admin user for this test to avoid conflicts
      const loginResponse1 = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'admin@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const loginResponse2 = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'admin@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Revoke all tokens
      const response = await request
        .post('/auth/revoke')
        .send({
          token: loginResponse1.body.accessToken,
          allDevices: true,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
      })

      // Verify both tokens are revoked
      const introspectResponse1 = await request
        .post('/auth/introspect')
        .send({
          token: loginResponse1.body.accessToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      const introspectResponse2 = await request
        .post('/auth/introspect')
        .send({
          token: loginResponse2.body.accessToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(introspectResponse1.body.active).toBe(false)
      expect(introspectResponse2.body.active).toBe(false)
    })
  })

  describe('GET /auth/userinfo', () => {
    it('should return user info for authenticated request', async () => {
      // Get a fresh token
      const loginResponse = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        role: UserRole.CUSTOMER,
        permissions: expect.any(Array),
      })
    })

    it('should require authentication', async () => {
      const response = await request.get('/auth/userinfo').expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'NOT_AUTHENTICATED',
        }),
      })
    })

    it('should reject invalid token', async () => {
      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          code: 'NOT_AUTHENTICATED',
        }),
      })
    })

    it('should handle multiple user info requests', async () => {
      // Get a fresh token
      const loginResponse = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const token = loginResponse.body.accessToken

      // First request
      const response1 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Second request
      const response2 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Both responses should be identical
      expect(response1.body).toEqual(response2.body)
    })
  })
})
