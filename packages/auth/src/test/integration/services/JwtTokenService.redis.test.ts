import { ICacheService } from '@pika/redis'
import { UserRole, UserStatus } from '@pika/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtTokenService, User } from '../../../services/JwtTokenService.js'

describe('JwtTokenService Redis Integration', () => {
  let tokenService: JwtTokenService
  let mockCacheService: ICacheService
  let mockUser: User

  beforeEach(() => {
    // Mock cache service
    mockCacheService = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(true),
      exists: vi.fn().mockResolvedValue(false),
      getTTL: vi.fn(),
      updateTTL: vi.fn(),
      del: vi.fn().mockResolvedValue(true),
      delPattern: vi.fn().mockResolvedValue(5),
      clearAll: vi.fn(),
    }

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isActive: () => true,
    }

    tokenService = new JwtTokenService(
      'test-secret-key-32-characters-long-for-testing',
      '15m',
      '7d',
      'pika-test',
      'pikaest-app',
      mockCacheService,
    )
  })

  describe('Token Generation with Redis', () => {
    it('should store refresh token metadata in Redis when generating tokens', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      expect(tokens.accessToken).toBeTruthy()
      expect(tokens.refreshToken).toBeTruthy()
      expect(mockCacheService.set).toHaveBeenCalled()

      // Verify refresh token metadata was stored
      const setCall = vi.mocked(mockCacheService.set).mock.calls[0]

      expect(setCall[0]).toMatch(/^auth:refresh:user-123:/)
      expect(setCall[1]).toMatchObject({
        userId: 'user-123',
        jti: expect.stringMatching(/user-123.*-refresh/),
        issuedAt: expect.any(String),
        expiresAt: expect.any(String),
      })
    })
  })

  describe('Token Blacklisting with Redis', () => {
    it('should store blacklisted tokens in Redis when revoking', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      await tokenService.revokeToken(tokens.accessToken)

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:blacklist:/),
        true,
        expect.any(Number),
      )
    })

    it('should check Redis for blacklisted tokens during verification', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      // Mock Redis to return that token is blacklisted
      vi.mocked(mockCacheService.exists).mockResolvedValue(true)

      const result = await tokenService.verifyToken(tokens.accessToken)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Token has been revoked')
      expect(mockCacheService.exists).toHaveBeenCalledWith(
        expect.stringMatching(/^auth:blacklist:/),
      )
    })

    it('should fall back to memory when Redis is unavailable', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      // Mock Redis to throw error
      vi.mocked(mockCacheService.exists).mockRejectedValue(
        new Error('Redis unavailable'),
      )

      const result = await tokenService.verifyToken(tokens.accessToken)

      // Should still work with in-memory fallback
      expect(result.isValid).toBe(true)
    })
  })

  describe('User Session Management', () => {
    it('should revoke all user tokens using Redis pattern matching', async () => {
      await tokenService.revokeAllUserTokens('user-123')

      expect(mockCacheService.delPattern).toHaveBeenCalledWith(
        'auth:user_tokens:user-123:*',
      )
      expect(mockCacheService.delPattern).toHaveBeenCalledWith(
        'auth:refresh:user-123:*',
      )
    })

    it('should handle Redis unavailable gracefully for user token revocation', async () => {
      // Create service without Redis
      const tokenServiceNoRedis = new JwtTokenService(
        'test-secret-key-32-characters-long-for-testing',
      )

      // Should not throw
      await expect(
        tokenServiceNoRedis.revokeAllUserTokens('user-123'),
      ).resolves.not.toThrow()
    })
  })

  describe('Token Refresh with Redis', () => {
    it('should work with Redis-stored refresh token metadata', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      // Refresh should work normally
      const refreshResult = await tokenService.refreshAccessToken(
        tokens.refreshToken,
      )

      expect(refreshResult.accessToken).toBeTruthy()
      expect(refreshResult.expiresAt).toBeInstanceOf(Date)
    })
  })

  describe('Cache Service Error Handling', () => {
    it('should handle Redis set failures gracefully during token generation', async () => {
      vi.mocked(mockCacheService.set).mockRejectedValue(
        new Error('Redis set failed'),
      )

      // Should still generate tokens successfully
      const tokens = await tokenService.generateTokens(mockUser)

      expect(tokens.accessToken).toBeTruthy()
      expect(tokens.refreshToken).toBeTruthy()
    })

    it('should handle Redis errors during token revocation gracefully', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      vi.mocked(mockCacheService.set).mockRejectedValue(
        new Error('Redis error'),
      )

      // Should not throw
      await expect(
        tokenService.revokeToken(tokens.accessToken),
      ).resolves.not.toThrow()
    })
  })

  describe('Token Hashing', () => {
    it('should use jti from token for Redis key when available', async () => {
      const tokens = await tokenService.generateTokens(mockUser)

      await tokenService.revokeToken(tokens.accessToken)

      const setCall = vi
        .mocked(mockCacheService.set)
        .mock.calls.find((call) => call[0].startsWith('auth:blacklist:'))

      expect(setCall).toBeTruthy()
      expect(setCall![0]).toMatch(/^auth:blacklist:user-123-.*-access$/)
    })
  })
})
