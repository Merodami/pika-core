import {
  JWT_ACCESS_EXPIRY,
  JWT_ACCESS_SECRET,
  JWT_ISSUER,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_SECRET,
} from '@pika/environment'
import { logger } from '@pika/shared'
import jwt, { SignOptions } from 'jsonwebtoken'

export interface JwtTokenPayload {
  userId: string
  email: string
  role: string
}

export interface JwtTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface JwtTokenResult {
  success: boolean
  data?: JwtTokens
  error?: string
}

export interface JwtTokenValidationResult {
  success: boolean
  payload?: JwtTokenPayload
  error?: string
}

export interface RefreshTokenValidationResult {
  success: boolean
  userId?: string
  error?: string
}

export class JwtTokenService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string
  private readonly issuer: string

  constructor() {
    // Get configuration from environment variables
    this.accessTokenSecret = JWT_ACCESS_SECRET
    this.refreshTokenSecret = JWT_REFRESH_SECRET
    this.accessTokenExpiry = JWT_ACCESS_EXPIRY
    this.refreshTokenExpiry = JWT_REFRESH_EXPIRY
    this.issuer = JWT_ISSUER

    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
      logger.warn(
        'JWT secrets not configured properly. Using default values for development.',
      )
    }
  }

  async generateTokens(payload: JwtTokenPayload): Promise<JwtTokenResult> {
    try {
      logger.debug('Generating JWT tokens', {
        userId: payload.userId,
        role: payload.role,
      })

      // Generate access token
      const accessTokenOptions = {
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        subject: payload.userId,
        audience: 'pika-api',
      } as SignOptions

      const accessToken = jwt.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          type: 'access',
        },
        this.accessTokenSecret,
        accessTokenOptions,
      )

      // Generate refresh token
      const refreshTokenOptions = {
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        subject: payload.userId,
        audience: 'pikauth',
      } as SignOptions

      const refreshToken = jwt.sign(
        {
          userId: payload.userId,
          type: 'refresh',
        },
        this.refreshTokenSecret,
        refreshTokenOptions,
      )

      // Calculate expiry time in seconds
      const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry)

      logger.info('Successfully generated JWT tokens', {
        userId: payload.userId,
        expiresIn,
      })

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn,
        },
      }
    } catch (error) {
      logger.error('Failed to generate JWT tokens', {
        userId: payload.userId,
        error,
      })

      return {
        success: false,
        error: `JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async verifyAccessToken(token: string): Promise<JwtTokenValidationResult> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: 'pikapi',
      }) as any

      if (decoded.type !== 'access') {
        return {
          success: false,
          error: 'Invalid token type',
        }
      }

      const payload: JwtTokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      }

      return {
        success: true,
        payload,
      }
    } catch (error) {
      logger.warn('Access token verification failed', { error })

      return {
        success: false,
        error: `JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<RefreshTokenValidationResult> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: 'pikauth',
      }) as any

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type',
        }
      }

      return {
        success: true,
        userId: decoded.userId,
      }
    } catch (error) {
      logger.warn('Refresh token verification failed', { error })

      return {
        success: false,
        error: `JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  private parseExpiryToSeconds(expiry: string): number {
    // Parse expressions like '15m', '1h', '7d' to seconds
    const match = expiry.match(/^(\d+)([smhd])$/)

    if (!match) {
      return 900 // Default 15 minutes
    }

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's':
        return value
      case 'm':
        return value * 60
      case 'h':
        return value * 60 * 60
      case 'd':
        return value * 60 * 60 * 24
      default:
        return 900
    }
  }
}
