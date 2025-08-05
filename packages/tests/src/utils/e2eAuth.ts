import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_SECRET,
} from '@pika/environment'
import { logger } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'
import type { Express } from 'express'
import type jwt from 'jsonwebtoken'
import { get } from 'lodash-es'
import supertest from 'supertest'

import { AuthenticatedRequestClient } from './authRequest.js'

/**
 * Test user data for E2E testing
 */
export interface TestUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
}

/**
 * E2E Authentication Helper for integration tests with real auth flow
 *
 * This class handles:
 * - Creating test users via real registration endpoints
 * - Logging in to get real JWT tokens
 * - Providing authenticated request clients
 * - Managing token lifecycle
 */
export class E2EAuthHelper {
  private app: Express
  private request: supertest.SuperTest<supertest.Test>
  private tokens: Map<string, { token: string; expiresAt: Date }> = new Map()
  private readonly baseUrl: string

  // Pre-defined test users for different roles
  private readonly testUsers: Record<string, TestUserData> = {
    ADMIN: {
      email: 'admin@e2etest.com',
      password: 'TestAdmin123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      phoneNumber: '+1234567890',
    },
    USER: {
      email: 'user@e2etest.com',
      password: 'TestUser123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1234567891',
    },
    MEMBER: {
      email: 'member@e2etest.com',
      password: 'TestMember123!',
      firstName: 'Test',
      lastName: 'Member',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1234567892',
    },
    PROFESSIONAL: {
      email: 'professional@e2etest.com',
      password: 'TestProfessional123!',
      firstName: 'Test',
      lastName: 'Professional',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1234567893',
    },
    BUSINESS: {
      email: 'business@e2etest.com',
      password: 'TestBusiness123!',
      firstName: 'Test',
      lastName: 'Business',
      role: UserRole.BUSINESS,
      phoneNumber: '+1234567894',
    },
  }

  constructor(app: Express, baseUrl: string = '/api/v1') {
    this.app = app
    this.request = supertest(app) as any
    this.baseUrl = baseUrl
  }

  /**
   * Create test user directly in database (for microservice tests)
   * This bypasses the need for auth endpoints in individual services
   */
  private async ensureUserExistsInDatabase(
    userType: keyof typeof this.testUsers,
    prisma: any,
  ): Promise<string> {
    const userData = get(this.testUsers, userType)
    // Generate a proper UUID for the user ID
    const { v4: uuid } = require('uuid')
    const userId = uuid()

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        logger.debug(`Test user ${userType} already exists in database`)
        // Ensure related domain entities exist for existing user
        await this.createDomainEntitiesForUser(
          prisma,
          existingUser.id,
          userData.role,
        )

        return existingUser.id
      }

      // Create user directly in database
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          status: UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: !!userData.phoneNumber,
          password: null, // No password needed for test users
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Create related domain entities based on user role
      await this.createDomainEntitiesForUser(prisma, user.id, userData.role)

      logger.debug(
        `Created test user ${userType} in database with ID: ${user.id}`,
      )

      return user.id
    } catch (error) {
      console.warn(`Failed to create test user ${userType} in database:`, error)

      // Return a predictable ID anyway
      return userId
    }
  }

  /**
   * Create domain entities for user based on their role
   * Ensures proper user-entity relationships for testing
   */
  private async createDomainEntitiesForUser(
    prisma: any,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    try {
      // No additional entities needed for current roles
      // Note: ADMIN role doesn't need additional domain entities in our current schema
    } catch (error) {
      console.warn(
        `Failed to create domain entities for user ${userId} with role ${role}:`,
        error,
      )
      // Don't throw - this is not critical for basic auth testing
    }
  }

  /**
   * Generate a valid JWT token for testing
   * Can be called with either userType/userId or custom user data
   */
  generateTestToken(
    userTypeOrData:
      | keyof typeof this.testUsers
      | { userId: string; email: string; role: string },
    userId?: string,
  ): string {
    const algorithm = JWT_ALGORITHM as jwt.Algorithm

    // Validate required configuration based on algorithm
    if (algorithm.startsWith('HS')) {
      if (!JWT_SECRET) {
        throw new Error(
          'JWT_SECRET environment variable is required for HMAC algorithms',
        )
      }
    } else if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
      if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
        throw new Error(
          'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables are required for RSA/ECDSA algorithms',
        )
      }
    }

    let payload: any

    if (typeof userTypeOrData === 'string') {
      // Called with userType and userId
      const userData = get(this.testUsers, userTypeOrData)

      payload = {
        userId: userId,
        email: userData.email,
        role: userData.role,
        status: UserStatus.ACTIVE,
        type: 'access' as const,
        iat: Math.floor(Date.now() / 1000),
      }
    } else {
      // Called with custom user data object
      payload = {
        userId: userTypeOrData.userId,
        email: userTypeOrData.email,
        role: userTypeOrData.role,
        status: UserStatus.ACTIVE,
        type: 'access' as const,
        iat: Math.floor(Date.now() / 1000),
      }
    }

    // Import jwt here to avoid circular dependencies
    const jwt = require('jsonwebtoken')

    // Select appropriate signing key based on algorithm
    let signingKey: string

    if (algorithm.startsWith('HS')) {
      signingKey = JWT_SECRET
    } else {
      // For RSA/ECDSA algorithms, use the key from environment (already unescaped)
      signingKey = JWT_PRIVATE_KEY
    }

    return jwt.sign(payload, signingKey, {
      algorithm,
      expiresIn: '1h', // 1 hour is plenty for tests
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: payload.userId,
      jwtid: `test-${payload.role.toLowerCase()}-${Date.now()}`,
    })
  }

  /**
   * Login as a specific user type and get a real JWT token
   * For microservice tests, this creates users in DB and generates valid tokens
   */
  async loginAs(
    userType: keyof typeof this.testUsers,
    prisma?: any,
  ): Promise<string> {
    // Check if we have a valid token
    const existingToken = this.tokens.get(userType)

    if (existingToken && existingToken.expiresAt > new Date()) {
      return existingToken.token
    }

    try {
      let userId: string

      if (prisma) {
        // Create user in database for microservice tests
        userId = await this.ensureUserExistsInDatabase(userType, prisma)
      } else {
        // Use predictable UUID for API-based tests
        const { v4: uuid } = require('uuid')

        userId = uuid()
      }

      // Generate valid JWT token
      const accessToken = this.generateTestToken(userType, userId)

      // Calculate expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // Store token with expiration
      this.tokens.set(userType, {
        token: accessToken,
        expiresAt: expiresAt,
      })

      const userData = get(this.testUsers, userType)

      logger.debug(
        `Successfully authenticated as ${userType} (${userData.email}) with userId: ${userId}`,
      )

      return accessToken
    } catch (error) {
      console.error(`❌ Failed to authenticate as ${userType}:`, error)
      throw new Error(`E2E Authentication failed for ${userType}: ${error}`)
    }
  }

  /**
   * Get an authenticated request client for a specific user type
   */
  async getAuthenticatedClient(
    userType: keyof typeof this.testUsers,
    prisma?: any,
  ): Promise<AuthenticatedRequestClient> {
    const token = await this.loginAs(userType, prisma)

    return new AuthenticatedRequestClient(this.request, token)
  }

  /**
   * Get an admin client (convenience method)
   */
  async getAdminClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('ADMIN', prisma)
  }

  /**
   * Get a user client (convenience method)
   */
  async getUserClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('USER', prisma)
  }

  /**
   * Get a member client (convenience method)
   */
  async getMemberClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('MEMBER', prisma)
  }

  /**
   * Get a professional client (convenience method)
   */
  async getProfessionalClient(
    prisma?: any,
  ): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('PROFESSIONAL', prisma)
  }

  /**
   * Get a business client (convenience method)
   */
  async getBusinessClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('BUSINESS', prisma)
  }

  /**
   * Get an unauthenticated client for testing 401 scenarios
   */
  getUnauthenticatedClient(): supertest.SuperTest<supertest.Test> {
    return this.request
  }

  /**
   * Get a service-to-service authenticated client
   * This creates a special client that uses service authentication instead of JWT tokens
   *
   * @param serviceName - Name of the calling service (default: 'test-service')
   * @returns AuthenticatedRequestClient configured for service-to-service auth
   *
   * @example
   * const serviceClient = authHelper.getServiceClient('user-service')
   * const response = await serviceClient.get('/internal/users/123')
   */
  getServiceClient(
    serviceName: string = 'test-service',
  ): AuthenticatedRequestClient {
    // For service auth, we'll pass a special token that the AuthenticatedRequestClient
    // will recognize and handle differently
    const serviceAuthToken = `SERVICE:${serviceName}`

    // Create a custom AuthenticatedRequestClient that overrides the header setting
    const client = new AuthenticatedRequestClient(
      this.request,
      serviceAuthToken,
    )

    // Override the internal _createRequest method to add service headers
    const originalCreateRequest = (client as any)._createRequest

    ;(client as any)._createRequest = function (
      method: string,
      url: string,
      overrideToken?: string | null,
    ) {
      const req = originalCreateRequest.call(this, method, url, overrideToken)

      // If using service auth token, replace auth headers with service headers
      if ((overrideToken || this.token)?.startsWith('SERVICE:')) {
        const serviceName = (overrideToken || this.token).substring(8)
        const apiKey =
          process.env.SERVICE_API_KEY ||
          'dev-service-api-key-change-in-production'
        const serviceId = `${serviceName}-test`

        // Remove JWT auth headers
        req.unset('Authorization')
        req.unset('x-user-id')
        req.unset('x-user-email')
        req.unset('x-user-role')
        req.unset('x-user-status')

        // Add service auth headers
        req
          .set('x-api-key', apiKey)
          .set('x-service-name', serviceName)
          .set('x-service-id', serviceId)
          .set('x-correlation-id', `test-${Date.now()}`)
      }

      return req
    }

    return client
  }

  /**
   * Test token refresh functionality
   */
  async refreshToken(userType: keyof typeof this.testUsers): Promise<string> {
    const existingToken = this.tokens.get(userType)

    if (!existingToken) {
      throw new Error(`No token found for ${userType}. Call loginAs() first.`)
    }

    try {
      // Use refresh endpoint to get new token
      const refreshResponse = await this.request
        .post(`${this.baseUrl}/auth/refresh`)
        .set('Authorization', `Bearer ${existingToken.token}`)
        .expect(200)

      const { accessToken, expiresAt } = refreshResponse.body.tokens

      // Update stored token
      this.tokens.set(userType, {
        token: accessToken,
        expiresAt: new Date(expiresAt),
      })

      return accessToken
    } catch (error) {
      console.error(`Failed to refresh token for ${userType}:`, error)
      throw error
    }
  }

  /**
   * Logout a specific user (revoke their token)
   */
  async logout(userType: keyof typeof this.testUsers): Promise<void> {
    const tokenData = this.tokens.get(userType)

    if (!tokenData) {
      return // Already logged out
    }

    try {
      await this.request
        .post(`${this.baseUrl}/auth/logout`)
        .set('Authorization', `Bearer ${tokenData.token}`)
        .expect(200)
    } catch (error) {
      console.warn(`Failed to logout ${userType}:`, error)
    } finally {
      this.tokens.delete(userType)
    }
  }

  /**
   * Clear all stored tokens (for test cleanup)
   */
  clearTokens(): void {
    this.tokens.clear()
    logger.debug('Cleared all authentication tokens')
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(userType: keyof typeof this.testUsers): {
    hasToken: boolean
    expiresAt?: Date
  } {
    const tokenData = this.tokens.get(userType)

    return {
      hasToken: !!tokenData,
      expiresAt: tokenData?.expiresAt,
    }
  }

  /**
   * Create test users in bulk (useful for test setup)
   */
  async createAllTestUsers(prisma?: any): Promise<void> {
    logger.debug('Creating all test users...')

    const userTypes = Object.keys(this.testUsers) as Array<
      keyof typeof this.testUsers
    >

    if (prisma) {
      // Create users directly in database for microservice tests
      const results = await Promise.allSettled(
        userTypes.map((userType) =>
          this.ensureUserExistsInDatabase(userType, prisma),
        ),
      )

      const failures = results.filter((result) => result.status === 'rejected')

      if (failures.length > 0) {
        console.warn(
          `⚠️  ${failures.length} test users failed to create in database`,
        )
      } else {
        logger.debug('All test users created successfully in database')
      }
    } else {
      logger.debug('Skipping user creation - will generate tokens as needed')
    }
  }

  /**
   * Authenticate all users in bulk (useful for test setup)
   */
  async authenticateAllUsers(prisma?: any): Promise<void> {
    logger.debug('Authenticating all test users...')

    const userTypes = Object.keys(this.testUsers) as Array<
      keyof typeof this.testUsers
    >

    await Promise.all(
      userTypes.map((userType) => this.loginAs(userType, prisma)),
    )

    logger.debug('All test users authenticated')
  }
}

/**
 * Convenience function to create E2E auth helper
 */
export function createE2EAuthHelper(
  app: Express,
  baseUrl?: string,
): E2EAuthHelper {
  return new E2EAuthHelper(app, baseUrl)
}

/**
 * Test user roles for easy reference
 */
export const TEST_USER_ROLES = {
  ADMIN: 'ADMIN' as const,
  USER: 'CUSTOMER' as const,
} as const

export type TestUserRole =
  (typeof TEST_USER_ROLES)[keyof typeof TEST_USER_ROLES]
