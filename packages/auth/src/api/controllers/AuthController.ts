import { UserRole } from '@pika/types'
import { Request, Response } from 'express'

import { LoginUseCase } from '../../application/use_cases/LoginUseCase.js'
import { LogoutUseCase } from '../../application/use_cases/LogoutUseCase.js'
import { RefreshTokenUseCase } from '../../application/use_cases/RefreshTokenUseCase.js'
import { RegisterUseCase } from '../../application/use_cases/RegisterUseCase.js'

export interface LoginRequest {
  Body: {
    email: string
    password: string
    rememberMe?: boolean
  }
}

export interface RegisterRequest {
  Body: {
    email: string
    password: string
    firstName: string
    lastName: string
    phoneNumber?: string
    dateOfBirth?: string
    description?: string
    specialties?: string[]
    acceptTerms: boolean
    marketingConsent?: boolean
    role: UserRole
    avatarUrl?: string
  }
}

export interface RefreshTokenRequest {
  Body: {
    refreshToken: string
  }
}

export interface LogoutRequest {
  Headers: {
    authorization?: string
  }
}

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 * Part of auth package's API layer
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  /**
   * POST /auth/login
   * Authenticate user with email/password
   */
  async login(
    request: Request<{}, {}, LoginRequest['Body']>,
    reply: Response,
  ): Promise<void> {
    const { email, password, rememberMe } = request.body

    const result = await this.loginUseCase.execute({
      email,
      password,
      rememberMe,
      source: 'api',
    })

    if (!result.success) {
      reply.status(401).send({
        error: 'AUTHENTICATION_FAILED',
        message: result.error,
        status_code: 401,
      })

      return
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.user || !result.tokens) {
      reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Authentication succeeded but response data is incomplete',
        status_code: 500,
      })

      return
    }

    // Calculate expires_in from expiresAt timestamp
    const expiresIn = Math.floor(
      (result.tokens.expiresAt.getTime() - Date.now()) / 1000,
    )

    reply.status(200).send({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        phoneNumber: (result.user as any).phoneNumber || null,
        phoneVerified: false, // Default value
        avatarUrl: (result.user as any).avatarUrl || null,
        emailVerified: result.user.emailVerified,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.createdAt.toISOString(), // Use createdAt for consistency
        lastLoginAt: result.user.lastLoginAt?.toISOString() || null,
        status: 'ACTIVE',
      },
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: expiresIn,
      },
    })
  }

  /**
   * POST /auth/register
   * Register new user account
   */
  async register(
    request: Request<{}, {}, RegisterRequest['Body']>,
    reply: Response,
  ): Promise<void> {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      description,
      specialties,
      acceptTerms,
      marketingConsent,
      role,
      avatarUrl,
    } = request.body

    const result = await this.registerUseCase.execute({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      description,
      specialties,
      acceptTerms,
      marketingConsent,
      role,
      avatarUrl,
      source: 'api',
    })

    if (!result.success) {
      reply.status(400).send({
        error: 'REGISTRATION_FAILED',
        message: result.error,
        status_code: 400,
      })

      return
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.user || !result.tokens) {
      reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Registration succeeded but response data is incomplete',
        status_code: 500,
      })

      return
    }

    const responseData = {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        phoneNumber: (result.user as any).phoneNumber || null,
        phoneVerified: false, // Default for new registrations
        avatarUrl: (result.user as any).avatarUrl || null,
        emailVerified: result.user.emailVerified,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.createdAt.toISOString(), // Use createdAt as initial updatedAt
        lastLoginAt: result.user.lastLoginAt?.toISOString() || null,
        status: 'ACTIVE',
      },
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: Math.floor(
          (result.tokens.expiresAt.getTime() - Date.now()) / 1000,
        ),
      },
    }

    reply.status(201).send(responseData)
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(
    request: Request<{}, {}, RefreshTokenRequest['Body']>,
    reply: Response,
  ): Promise<void> {
    const { refreshToken } = request.body

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
      source: 'api',
    })

    if (!result.success) {
      reply.status(401).send({
        error: 'TOKEN_REFRESH_FAILED',
        message: result.error,
        status_code: 401,
      })

      return
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.tokens) {
      reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Token refresh succeeded but response data is incomplete',
        status_code: 500,
      })

      return
    }

    reply.status(200).send({
      success: true,
      data: {
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.expiresAt.toISOString(),
          refreshExpiresAt: result.tokens.refreshExpiresAt.toISOString(),
        },
      },
    })
  }

  /**
   * POST /auth/logout
   * Logout user and invalidate tokens
   */
  async logout(request: Request, reply: Response): Promise<void> {
    // Extract user from JWT token (would be set by auth middleware)
    const user = (request as any).user
    const authorization = request.headers.authorization

    if (!user) {
      reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        status_code: 401,
      })

      return
    }

    const token = authorization?.replace('Bearer ', '')

    await this.logoutUseCase.execute({
      userId: user.id,
      token,
      source: 'api',
    })

    reply.status(200).send({
      message: 'Logged out successfully',
    })
  }
}
