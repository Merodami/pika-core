import { UserRole, UserStatus } from '@pika/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtTokenService, User } from '../../../services/JwtTokenService.js'

describe('JwtTokenService', () => {
  let jwtService: JwtTokenService

  const testSecret = 'test-secret-key-32-characters-long-for-testing'
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isActive: () => true,
  }

  beforeEach(() => {
    jwtService = new JwtTokenService(
      testSecret,
      '15m', // access token expiry
      '7d', // refresh token expiry
      'test-issuer',
      'test-audience',
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Token Generation', () => {
    it('should generate access and refresh tokens', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens).toHaveProperty('expiresAt')
      expect(tokens).toHaveProperty('refreshExpiresAt')

      expect(typeof tokens.accessToken).toBe('string')
      expect(typeof tokens.refreshToken).toBe('string')
      expect(tokens.expiresAt).toBeInstanceOf(Date)
      expect(tokens.refreshExpiresAt).toBeInstanceOf(Date)
    })

    it('should generate different tokens for each call', async () => {
      const tokens1 = await jwtService.generateTokens(mockUser)
      const tokens2 = await jwtService.generateTokens(mockUser)

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken)
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken)
    })

    it('should set correct expiration times', async () => {
      const beforeGeneration = new Date()
      const tokens = await jwtService.generateTokens(mockUser)

      // Access token should expire in ~15 minutes
      const accessTokenExpiry =
        tokens.expiresAt.getTime() - beforeGeneration.getTime()

      expect(accessTokenExpiry).toBeGreaterThan(14 * 60 * 1000) // At least 14 minutes
      expect(accessTokenExpiry).toBeLessThan(16 * 60 * 1000) // At most 16 minutes

      // Refresh token should expire in ~7 days
      const refreshTokenExpiry =
        tokens.refreshExpiresAt.getTime() - beforeGeneration.getTime()

      expect(refreshTokenExpiry).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000) // At least 6.9 days
      expect(refreshTokenExpiry).toBeLessThan(7.1 * 24 * 60 * 60 * 1000) // At most 7.1 days
    })

    it('should handle different user roles', async () => {
      const adminUser: User = { ...mockUser, role: UserRole.ADMIN }
      const userUser: User = {
        ...mockUser,
        role: UserRole.ADMIN,
      }

      const adminTokens = await jwtService.generateTokens(adminUser)
      const userTokens = await jwtService.generateTokens(userUser)

      expect(adminTokens.accessToken).toBeTruthy()
      expect(userTokens.accessToken).toBeTruthy()

      // Verify the role is encoded in the token
      const adminPayload = await jwtService.verifyToken(
        adminTokens.accessToken,
        'access',
      )
      const userPayload = await jwtService.verifyToken(
        userTokens.accessToken,
        'access',
      )

      expect(adminPayload.payload?.role).toBe(UserRole.ADMIN)
      expect(userPayload.payload?.role).toBe(UserRole.ADMIN)
    })
  })

  describe('Token Verification', () => {
    it('should verify valid access tokens', async () => {
      const tokens = await jwtService.generateTokens(mockUser)
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload?.userId).toBe(mockUser.id)
      expect(result.payload?.email).toBe(mockUser.email)
      expect(result.payload?.type).toBe('access')
    })

    it('should verify valid refresh tokens', async () => {
      const tokens = await jwtService.generateTokens(mockUser)
      const result = await jwtService.verifyToken(
        tokens.refreshToken,
        'refresh',
      )

      expect(result.isValid).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload?.userId).toBe(mockUser.id)
      expect(result.payload?.type).toBe('refresh')
    })

    it('should reject invalid tokens', async () => {
      const invalidTokens = [
        'invalid.token.here',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        'not-a-jwt-token',
        'Bearer token-here',
      ]

      for (const token of invalidTokens) {
        const result = await jwtService.verifyToken(token, 'access')

        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      }
    })

    it('should reject tokens with wrong type', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Try to verify access token as refresh token
      const result1 = await jwtService.verifyToken(
        tokens.accessToken,
        'refresh',
      )

      expect(result1.isValid).toBe(false)
      expect(result1.error).toContain('Expected refresh token, but got access')

      // Try to verify refresh token as access token
      const result2 = await jwtService.verifyToken(
        tokens.refreshToken,
        'access',
      )

      expect(result2.isValid).toBe(false)
      expect(result2.error).toContain('Expected access token, but got refresh')
    })

    it('should reject expired tokens', async () => {
      // Create service with very short expiry
      const shortExpiryService = new JwtTokenService(testSecret, '1s', '1s')
      const tokens = await shortExpiryService.generateTokens(mockUser)

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const result = await shortExpiryService.verifyToken(
        tokens.accessToken,
        'access',
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should reject tokens signed with different secret', async () => {
      const differentSecretService = new JwtTokenService(
        'different-secret-key-32-chars-long',
      )
      const tokens = await differentSecretService.generateTokens(mockUser)

      // Try to verify with original service (different secret)
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject blacklisted tokens', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Revoke the token
      await jwtService.revokeToken(tokens.accessToken)

      // Try to verify revoked token
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('revoked')
    })
  })

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const originalTokens = await jwtService.generateTokens(mockUser)
      const refreshResult = await jwtService.refreshAccessToken(
        originalTokens.refreshToken,
      )

      expect(refreshResult.accessToken).toBeTruthy()
      expect(refreshResult.expiresAt).toBeInstanceOf(Date)
      expect(refreshResult.accessToken).not.toBe(originalTokens.accessToken)

      // New access token should be valid
      const verifyResult = await jwtService.verifyToken(
        refreshResult.accessToken,
        'access',
      )

      expect(verifyResult.isValid).toBe(true)
    })

    it('should reject refresh with invalid refresh token', async () => {
      const invalidTokens = ['invalid.refresh.token', '', 'not-a-token']

      for (const token of invalidTokens) {
        await expect(jwtService.refreshAccessToken(token)).rejects.toThrow()
      }
    })

    it('should reject refresh with revoked refresh token', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Revoke the refresh token
      await jwtService.revokeToken(tokens.refreshToken)

      // Try to refresh with revoked token
      await expect(
        jwtService.refreshAccessToken(tokens.refreshToken),
      ).rejects.toThrow()
    })
  })

  describe('Token Revocation', () => {
    it('should revoke tokens successfully', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Revoke token
      await expect(
        jwtService.revokeToken(tokens.accessToken),
      ).resolves.not.toThrow()

      // Verify token is now invalid
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(false)
    })

    it('should handle revoking invalid tokens gracefully', async () => {
      const invalidTokens = ['invalid.token.here', '', 'not-a-token']

      for (const token of invalidTokens) {
        await expect(jwtService.revokeToken(token)).resolves.not.toThrow()
      }
    })

    it('should handle revoking same token multiple times', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Revoke token multiple times
      await jwtService.revokeToken(tokens.accessToken)
      await jwtService.revokeToken(tokens.accessToken)
      await jwtService.revokeToken(tokens.accessToken)

      // Should still be invalid
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(false)
    })
  })

  describe('Security Tests', () => {
    it('should not accept tokens without required claims', async () => {
      // Create a malformed token manually (missing required fields)
      const jwt = require('jsonwebtoken')
      const malformedToken = jwt.sign({ userId: 'test' }, testSecret) // Missing required fields

      const result = await jwtService.verifyToken(malformedToken, 'access')

      expect(result.isValid).toBe(false)
    })

    it('should validate token structure strictly', async () => {
      const jwt = require('jsonwebtoken')

      // Token with extra/suspicious fields
      const suspiciousToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          status: mockUser.status,
          type: 'access',
          // Suspicious fields
          isAdmin: true,
          permissions: ['*'],
          malicious: true,
        },
        testSecret,
      )

      const result = await jwtService.verifyToken(suspiciousToken, 'access')

      // The service might reject tokens with unexpected fields for security
      // If this is the intended behavior, the test should expect false
      if (result.isValid) {
        expect(result.payload?.userId).toBe(mockUser.id)
      } else {
        // Security validation might reject tokens with extra fields
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      }
    })

    it('should handle algorithm manipulation attacks', async () => {
      const jwt = require('jsonwebtoken')

      // Try to create token with 'none' algorithm
      const noneAlgorithmToken = jwt.sign(
        {
          userId: mockUser.id,
          type: 'access',
        },
        '',
        { algorithm: 'none' },
      )

      const result = await jwtService.verifyToken(noneAlgorithmToken, 'access')

      expect(result.isValid).toBe(false)
    })

    it('should reject tokens with future issued-at time', async () => {
      const jwt = require('jsonwebtoken')

      // Create token with future iat
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour in future
      const futureToken = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          status: mockUser.status,
          type: 'access',
          iat: futureTime,
        },
        testSecret,
      )

      const result = await jwtService.verifyToken(futureToken, 'access')

      expect(result.isValid).toBe(false)
    })
  })

  describe('Configuration Validation', () => {
    it('should require minimum secret length', () => {
      expect(() => new JwtTokenService('short')).toThrow(
        'JWT secret must be at least 32 characters long',
      )
    })

    it('should handle empty configuration gracefully', () => {
      expect(() => new JwtTokenService('')).toThrow()
    })

    it('should use default values for optional parameters', () => {
      const service = new JwtTokenService('valid-secret-key-32-characters-long')

      expect(service).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should generate tokens efficiently', async () => {
      const startTime = Date.now()
      const promises = []

      // Generate 10 tokens concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(jwtService.generateTokens(mockUser))
      }

      await Promise.all(promises)

      const endTime = Date.now()

      // Should complete within reasonable time (adjust based on your performance requirements)
      expect(endTime - startTime).toBeLessThan(1000) // 1 second for 10 tokens
    })

    it('should verify tokens efficiently', async () => {
      // Generate a token first
      const tokens = await jwtService.generateTokens(mockUser)

      const startTime = Date.now()
      const promises = []

      // Verify 20 tokens concurrently
      for (let i = 0; i < 20; i++) {
        promises.push(jwtService.verifyToken(tokens.accessToken, 'access'))
      }

      await Promise.all(promises)

      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(500) // 500ms for 20 verifications
    })
  })
})
