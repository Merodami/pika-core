import {
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'
import jwt from 'jsonwebtoken'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  isActive(): boolean
}

export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  status: UserStatus
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  jti?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  refreshExpiresAt: Date
}

export interface TokenValidationResult {
  isValid: boolean
  payload?: TokenPayload
  error?: string
}

/**
 * JWT Token Service
 * Handles JWT token generation, verification, and refresh operations
 * Part of @pikaage for proper separation of concerns
 */
export class JwtTokenService {
  private readonly jwtSecret: string
  private readonly jwtPrivateKey: string
  private readonly jwtPublicKey: string
  private readonly algorithm: jwt.Algorithm
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string
  private readonly issuer: string
  private readonly audience: string
  private readonly cacheService?: ICacheService

  // In-memory token blacklist (fallback when Redis is not available)
  private readonly blacklistedTokens = new Set<string>()

  // Redis key prefixes for organized token management
  private readonly TOKEN_BLACKLIST_PREFIX = 'auth:blacklist:'
  private readonly USER_TOKEN_PREFIX = 'auth:user_tokens:'
  private readonly REFRESH_TOKEN_PREFIX = 'auth:refresh:'

  constructor(
    jwtSecret: string,
    accessTokenExpiry: string = '15m',
    refreshTokenExpiry: string = '7d',
    issuer: string = 'pika-api',
    audience: string = 'pikapp',
    cacheService?: ICacheService,
    algorithm: jwt.Algorithm = 'HS256',
    jwtPrivateKey?: string,
    jwtPublicKey?: string,
  ) {
    this.jwtSecret = jwtSecret
    this.algorithm = algorithm
    this.jwtPrivateKey = jwtPrivateKey || ''
    this.jwtPublicKey = jwtPublicKey || ''
    this.accessTokenExpiry = accessTokenExpiry
    this.refreshTokenExpiry = refreshTokenExpiry
    this.issuer = issuer
    this.audience = audience
    this.cacheService = cacheService

    // Validate based on algorithm type
    if (algorithm.startsWith('HS')) {
      if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error(
          'JWT secret must be at least 32 characters long for HMAC algorithms',
        )
      }
    } else if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
      if (!jwtPrivateKey || !jwtPublicKey) {
        throw new Error(
          `Private and public keys are required for ${algorithm} algorithm`,
        )
      }
    } else {
      throw new Error(`Unsupported JWT algorithm: ${algorithm}`)
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      // Validate user status
      if (!user.isActive()) {
        throw new Error('Cannot generate tokens for inactive user')
      }

      const jti = this.generateJti(user.id)

      // Generate access token
      const accessPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        type: 'access',
      }

      // Use appropriate key based on algorithm
      const signingKey = this.getSigningKey()

      const accessToken = jwt.sign(accessPayload, signingKey, {
        algorithm: this.algorithm,
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: user.id,
        jwtid: `${jti}-access`,
      } as jwt.SignOptions)

      // Generate refresh token
      const refreshPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        type: 'refresh',
      }

      const refreshToken = jwt.sign(refreshPayload, signingKey, {
        algorithm: this.algorithm,
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: user.id,
        jwtid: `${jti}-refresh`,
      } as jwt.SignOptions)

      // Calculate expiration dates
      const accessExpiresAt = this.calculateExpirationDate(
        this.accessTokenExpiry,
      )
      const refreshExpiresAt = this.calculateExpirationDate(
        this.refreshTokenExpiry,
      )

      // Store refresh token metadata in Redis for session management
      await this.storeRefreshTokenMetadata(
        user.id,
        `${jti}-refresh`,
        refreshExpiresAt,
      )

      return {
        accessToken,
        refreshToken,
        expiresAt: accessExpiresAt,
        refreshExpiresAt: refreshExpiresAt,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('inactive user')) {
        throw error
      }

      throw new Error(
        `Failed to generate tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(
    token: string,
    expectedType?: 'access' | 'refresh',
  ): Promise<TokenValidationResult> {
    try {
      // Check if token is blacklisted (Redis first, fallback to memory)
      const isBlacklisted = await this.isTokenBlacklisted(token)

      if (isBlacklisted) {
        return {
          isValid: false,
          error: 'Token has been revoked',
        }
      }

      // Verify token signature and claims
      const verifyKey = this.getVerifyKey()

      const decoded = jwt.verify(token, verifyKey, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience,
      }) as TokenPayload

      // Validate token type if specified
      if (expectedType && decoded.type !== expectedType) {
        return {
          isValid: false,
          error: `Expected ${expectedType} token, but got ${decoded.type}`,
        }
      }

      // Validate required claims
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return {
          isValid: false,
          error: 'Token missing required claims',
        }
      }

      return {
        isValid: true,
        payload: decoded,
      }
    } catch (error) {
      let errorMessage = 'Invalid token'

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired'
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token format'
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not active yet'
      }

      return {
        isValid: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresAt: Date }> {
    try {
      // Verify refresh token
      const validation = await this.verifyToken(refreshToken, 'refresh')

      if (!validation.isValid || !validation.payload) {
        throw new Error(validation.error || 'Invalid refresh token')
      }

      const { payload } = validation

      // Generate new access token
      const jti = this.generateJti(payload.userId)

      const accessPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        type: 'access',
      }

      const signingKey = this.getSigningKey()

      const accessToken = jwt.sign(accessPayload, signingKey, {
        algorithm: this.algorithm,
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        jwtid: `${jti}-access-refresh`,
      } as jwt.SignOptions)

      const expiresAt = this.calculateExpirationDate(this.accessTokenExpiry)

      return {
        accessToken,
        expiresAt,
      }
    } catch (error) {
      throw new Error(
        `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Blacklist a token (revoke it)
   */
  async revokeToken(token: string): Promise<void> {
    // Add token to in-memory blacklist (always succeeds)
    this.blacklistedTokens.add(token)

    // Store in Redis with expiration if available (non-critical operation)
    if (this.cacheService) {
      try {
        const decoded = this.decodeTokenUnsafe(token)

        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000)

          if (ttl > 0) {
            const tokenId = this.getTokenId(token)
            const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${tokenId}`

            await this.cacheService.set(blacklistKey, true, ttl)
          }
        }
      } catch (error) {
        logger.warn(
          'Failed to store token blacklist in Redis, using memory fallback',
          error as Error,
          {
            component: 'jwt-service',
            operation: 'blacklist-token',
            fallback: 'memory',
          },
        )
        // Don't throw - token is already blacklisted in memory
      }
    }
  }

  /**
   * Revoke all tokens for a user (useful for logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      if (this.cacheService) {
        // Delete all user tokens using pattern matching
        const userTokenPattern = `${this.USER_TOKEN_PREFIX}${userId}:*`
        const deletedCount =
          await this.cacheService.delPattern(userTokenPattern)

        // Also delete all refresh tokens for the user
        const refreshTokenPattern = `${this.REFRESH_TOKEN_PREFIX}${userId}:*`

        await this.cacheService.delPattern(refreshTokenPattern)

        logger.info('Revoked user tokens', {
          component: 'jwt-service',
          operation: 'revoke-all-tokens',
          userId,
          tokenCount: deletedCount,
        })
      } else {
        logger.warn('Redis not available - cannot revoke all user tokens', {
          component: 'jwt-service',
          operation: 'revoke-all-tokens',
          fallback: 'none',
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to revoke user tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get token information without verification (for debugging)
   */
  decodeTokenUnsafe(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload
    } catch {
      return null
    }
  }

  /**
   * Check if token is expired (without verification)
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload

      if (!decoded?.exp) return true

      return Date.now() >= decoded.exp * 1000
    } catch {
      return true
    }
  }

  /**
   * Calculate expiration date from expiry string
   */
  private calculateExpirationDate(expiry: string): Date {
    const now = new Date()

    // Parse expiry string (e.g., "15m", "7d", "1h")
    const match = expiry.match(/^(\d+)([smhd])$/)

    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const [, amount, unit] = match
    const value = parseInt(amount, 10)

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000)
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000)
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000)
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000)
      default:
        throw new Error(`Unsupported time unit: ${unit}`)
    }
  }

  /**
   * Get token statistics (for monitoring)
   */
  getTokenStats(): { blacklistedCount: number } {
    return {
      blacklistedCount: this.blacklistedTokens.size,
    }
  }

  /**
   * Clean up expired blacklisted tokens (should be called periodically)
   */
  cleanupExpiredTokens(): void {
    const expiredTokens: string[] = []

    for (const token of this.blacklistedTokens) {
      if (this.isTokenExpired(token)) {
        expiredTokens.push(token)
      }
    }

    expiredTokens.forEach((token) => this.blacklistedTokens.delete(token))
  }

  /**
   * Check if a token is blacklisted (Redis first, memory fallback)
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    // Check Redis first if available
    if (this.cacheService) {
      try {
        const decoded = this.decodeTokenUnsafe(token)

        if (decoded?.jti) {
          const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${decoded.jti}`

          // Check if the cache service has the exists method
          if (typeof this.cacheService.exists === 'function') {
            const isBlacklisted = await this.cacheService.exists(blacklistKey)

            if (isBlacklisted) {
              return true
            }
          } else {
            // Fallback: try to get the value if exists method is not available
            const value = await this.cacheService.get(blacklistKey)

            if (value !== null) {
              return true
            }
          }
        }
      } catch (error) {
        logger.warn(
          'Redis blacklist check failed, falling back to memory',
          error as Error,
          {
            component: 'jwt-service',
            operation: 'check-blacklist',
            fallback: 'memory',
          },
        )
      }
    }

    // Fallback to in-memory blacklist
    return this.blacklistedTokens.has(token)
  }

  /**
   * Generate a unique JWT ID for token tracking
   */
  private generateJti(userId: string): string {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Get the JWT ID from token for Redis storage
   */
  private getTokenId(token: string): string {
    const decoded = this.decodeTokenUnsafe(token)

    if (!decoded?.jti) {
      throw new Error('Token missing JWT ID')
    }

    return decoded.jti
  }

  /**
   * Get the appropriate signing key based on algorithm
   */
  private getSigningKey(): string | Buffer {
    if (this.algorithm.startsWith('HS')) {
      return this.jwtSecret
    }

    return this.jwtPrivateKey
  }

  /**
   * Get the appropriate verification key based on algorithm
   */
  private getVerifyKey(): string | Buffer {
    if (this.algorithm.startsWith('HS')) {
      return this.jwtSecret
    }

    return this.jwtPublicKey
  }

  /**
   * Store refresh token metadata in Redis for tracking
   */
  private async storeRefreshTokenMetadata(
    userId: string,
    jti: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.cacheService) return

    try {
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${userId}:${jti}`
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000)

      if (ttl > 0) {
        await this.cacheService.set(
          refreshKey,
          {
            userId,
            jti,
            issuedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
          },
          ttl,
        )
      }
    } catch (error) {
      logger.warn('Failed to store refresh token metadata', error as Error, {
        component: 'jwt-service',
        operation: 'store-refresh-metadata',
      })
    }
  }
}

/**
 * Create token service instance with environment configuration
 */
export function createJwtTokenService(
  cacheService?: ICacheService,
): JwtTokenService {
  return new JwtTokenService(
    JWT_SECRET,
    JWT_ACCESS_TOKEN_EXPIRY,
    JWT_REFRESH_TOKEN_EXPIRY,
    JWT_ISSUER,
    JWT_AUDIENCE,
    cacheService,
    JWT_ALGORITHM as jwt.Algorithm,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
  )
}
