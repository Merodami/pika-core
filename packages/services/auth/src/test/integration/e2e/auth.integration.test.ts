import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

// Force Vitest to use the actual implementation
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

import { createAuthServer } from '@auth-service/server.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  CommunicationServiceClientMock,
  UserServiceClientMock,
} from '@tests/mocks/services'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Use shared mocks
const mockUserServiceClient = new UserServiceClientMock()
const mockCommunicationClient = new CommunicationServiceClientMock()

describe('Auth Service Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    logger.debug('Setting up Auth Service integration tests...')

    // Create test database
    testDb = await createTestDatabase()

    // Create cache service
    const cacheService = new MemoryCacheService()

    // Create auth server with mocked service clients
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient: mockUserServiceClient as any,
      communicationClient: mockCommunicationClient as any,
    })

    request = supertest(app)

    logger.debug('Auth service setup complete')
  }, 120000)

  beforeEach(async () => {
    // Reset all mocks
    mockUserServiceClient.reset()
    mockCommunicationClient.reset()

    // Clear database between tests
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Registration Tests
  describe('POST /auth/register', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        // Missing required fields
      }

      const response = await request
        .post('/auth/register')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate password strength', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak', // Too short and missing requirements
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01T00:00:00Z',
        acceptTerms: true,
        role: 'MEMBER',
      }

      const response = await request
        .post('/auth/register')
        .send(weakPasswordData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate email format', async () => {
      const invalidEmailData = {
        email: 'not-an-email',
        password: 'StrongPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01T00:00:00Z',
        acceptTerms: true,
        role: 'MEMBER',
      }

      const response = await request
        .post('/auth/register')
        .send(invalidEmailData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should require acceptTerms to be true', async () => {
      const noTermsData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01T00:00:00Z',
        acceptTerms: false,
        role: 'MEMBER',
      }

      const response = await request
        .post('/auth/register')
        .send(noTermsData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  // OAuth Token Tests
  describe('POST /auth/token', () => {
    it('should validate username and password are provided', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should validate email format', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'invalid-email',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  // Token Revocation Tests
  describe('POST /auth/revoke', () => {
    it('should always return success per OAuth spec', async () => {
      const response = await request
        .post('/auth/revoke')
        .send({
          token: 'invalid-token',
        })
        .set('Accept', 'application/json')
        .expect(200) // OAuth spec requires always returning success

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/token.*revoked|revoked.*successfully/i),
      })
    })
  })

  // OAuth Refresh Token Tests
  describe('POST /auth/token - Refresh Grant', () => {
    it('should validate refresh token is provided', async () => {
      await request
        .post('/auth/token')
        .send({
          grantType: 'refreshToken',
        })
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should reject invalid refresh token format', async () => {
      await request
        .post('/auth/token')
        .send({
          grantType: 'refreshToken',
          refreshToken: '',
        })
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  // Change Password Tests
  describe('POST /auth/change-password', () => {
    it('should require authentication', async () => {
      await request
        .post('/auth/change-password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        })
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Forgot Password Tests
  describe('POST /auth/forgot-password', () => {
    it('should validate email format', async () => {
      await request
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should accept valid email format', async () => {
      mockUserServiceClient.getUserByEmail.mockResolvedValueOnce(null)

      const response = await request
        .post('/auth/forgot-password')
        .send({ email: 'valid@example.com' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.message).toBeDefined()
    })
  })

  // Reset Password Tests
  describe('POST /auth/reset-password', () => {
    it('should validate token and password are provided', async () => {
      await request
        .post('/auth/reset-password')
        .send({})
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should validate new password strength', async () => {
      await request
        .post('/auth/reset-password')
        .send({
          token: 'some-token',
          newPassword: 'weak',
        })
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  // Email Verification Tests
  describe('GET /auth/verify-email/:token', () => {
    it('should validate token parameter', async () => {
      await request
        .get('/auth/verify-email/')
        .set('Accept', 'application/json')
        .expect(404) // No token provided results in 404
    })
  })

  // Resend Verification Email Tests
  describe('POST /auth/resend-verification', () => {
    it('should validate email format', async () => {
      await request
        .post('/auth/resend-verification')
        .send({ email: 'invalid-email' })
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should accept valid email format', async () => {
      mockUserServiceClient.getUserByEmail.mockResolvedValueOnce({
        id: 'test-id',
        email: 'test@example.com',
        emailVerified: false,
      })

      const response = await request
        .post('/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.message).toBeDefined()
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid JSON body', async () => {
      await request
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })

    it('should handle form data instead of JSON', async () => {
      // OAuth 2.0 endpoints should reject form data and require JSON
      const response = await request
        .post('/auth/token')
        .type('form')
        .send(
          'grantType=password&username=test@example.com&password=Password123!',
        )

      // Should return 400 for unsupported content type, 415 for unsupported media type, or 401 if auth middleware runs first
      expect([400, 401, 415]).toContain(response.status)
    })

    it('should validate input types', async () => {
      const invalidTypes = {
        grantType: 'password',
        username: 123, // Should be string
        password: true, // Should be string
      }

      await request
        .post('/auth/token')
        .send(invalidTypes)
        .set('Accept', 'application/json')
        .expect(400)
    })
  })
})
