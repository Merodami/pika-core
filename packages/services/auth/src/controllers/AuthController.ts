import { authPublic, shared } from '@pika/api'
import type { z } from 'zod'

type ChangePasswordRequest = z.infer<typeof authPublic.ChangePasswordRequest>
type ForgotPasswordRequest = z.infer<typeof authPublic.ForgotPasswordRequest>
type IntrospectRequest = z.infer<typeof authPublic.IntrospectRequest>
type RegisterRequest = z.infer<typeof authPublic.RegisterRequest>
type ResetPasswordRequest = z.infer<typeof authPublic.ResetPasswordRequest>
type RevokeTokenRequest = z.infer<typeof authPublic.RevokeTokenRequest>
type TokenRequest = z.infer<typeof authPublic.TokenRequest>
type VerifyEmailRequest = z.infer<typeof authPublic.VerifyEmailRequest>

import { AuthMapper } from '@auth-service/mappers/AuthMapper.js'
import type { IAuthService } from '@auth-service/services/AuthService.js'
import { RequestContext, validateResponse } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { UserMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { mapRoleToPermissions, UserRole } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles authentication-related operations
 */
export class AuthController {
  constructor(private readonly authService: IAuthService) {
    // Bind all methods to preserve 'this' context
    this.register = this.register.bind(this)
    this.forgotPassword = this.forgotPassword.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
    this.verifyEmail = this.verifyEmail.bind(this)
    this.resendVerificationEmail = this.resendVerificationEmail.bind(this)
    this.changePassword = this.changePassword.bind(this)
    // OAuth endpoints
    this.token = this.token.bind(this)
    this.introspect = this.introspect.bind(this)
    this.revoke = this.revoke.bind(this)
    this.userinfo = this.userinfo.bind(this)
  }

  /**
   * POST /auth/register
   * Register new user account
   */
  async register(
    request: Request<{}, {}, RegisterRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        acceptTerms,
        marketingConsent,
      } = request.body

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        acceptTerms,
        marketingConsent,
        role: UserRole.CUSTOMER, // Default role for new registrations
      })

      // If email verification is required, return success message without tokens
      if (!result.accessToken || !result.refreshToken) {
        const responseData = {
          message:
            result.message ||
            'Registration successful. Please check your email to verify your account.',
          userId: result.user.id,
          emailSent: result.emailSent ?? true, // Use actual email sending status from service
        }
        const validatedResponse = validateResponse(
          authPublic.RegisterResponse,
          responseData,
          'AuthController.register',
        )

        response.status(201).json(validatedResponse)
      } else {
        const dto = AuthMapper.toAuthResponse(
          result.user,
          result.accessToken,
          result.refreshToken,
        )
        const validatedResponse = validateResponse(
          authPublic.AuthUserResponse,
          dto,
          'AuthController.register',
        )

        response.status(201).json(validatedResponse)
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/forgot-password
   * Send password reset email
   */
  async forgotPassword(
    request: Request<{}, {}, ForgotPasswordRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = request.body

      const result = await this.authService.forgotPassword(email)

      const responseData = {
        message:
          result.message ||
          'If an account exists with this email, a password reset link has been sent.',
      }
      const validatedResponse = validateResponse(
        shared.MessageResponse,
        responseData,
        'AuthController.forgotPassword',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/reset-password
   * Reset password with token
   */
  async resetPassword(
    request: Request<{}, {}, ResetPasswordRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token, newPassword } = request.body

      const result = await this.authService.resetPassword(token, newPassword)

      if (!result.success) {
        throw ErrorFactory.badRequest(
          result.message || 'Failed to reset password',
        )
      }

      const responseData = {
        message: result.message || 'Password reset successfully',
      }
      const validatedResponse = validateResponse(
        shared.MessageResponse,
        responseData,
        'AuthController.resetPassword',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /auth/verify-email/:token
   * Verify email with token
   */
  async verifyEmail(
    request: Request<VerifyEmailRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = request.params

      const result = await this.authService.verifyEmail(token)

      if (!result.success) {
        throw ErrorFactory.badRequest('Invalid or expired verification token')
      }

      const responseData = {
        message: 'Email verified successfully',
        userId: result.userId,
      }
      const validatedResponse = validateResponse(
        authPublic.VerifyEmailResponse,
        responseData,
        'AuthController.verifyEmail',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/resend-verification
   * Resend email verification
   */
  async resendVerificationEmail(
    request: Request<{}, {}, ForgotPasswordRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = request.body

      const result = await this.authService.resendVerificationEmail(email)

      const responseData = {
        message:
          result.message ||
          'If an account exists with this email, a verification link has been sent.',
      }
      const validatedResponse = validateResponse(
        shared.MessageResponse,
        responseData,
        'AuthController.resendVerificationEmail',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/change-password
   * Change user password
   */
  async changePassword(
    request: Request<{}, {}, ChangePasswordRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = request.body

      // Get user from request context (set by auth middleware)
      const context = RequestContext.getContext(request)
      const userId = context.userId

      const result = await this.authService.changePassword(
        userId,
        currentPassword,
        newPassword,
      )

      if (!result.success) {
        throw ErrorFactory.badRequest('Failed to change password')
      }

      const responseData = {
        message: 'Password changed successfully',
      }
      const validatedResponse = validateResponse(
        shared.MessageResponse,
        responseData,
        'AuthController.changePassword',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  // ============= OAuth 2.0 Compatible Endpoints =============

  /**
   * POST /auth/token
   * OAuth 2.0 compatible token endpoint
   */
  async token(
    request: Request<{}, {}, TokenRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { grantType } = request.body

      if (grantType === 'password') {
        const { username, password } = request.body
        const result = await this.authService.login(username, password)

        // Transform to OAuth response format
        const oauthResponse = {
          accessToken: result.accessToken,
          tokenType: 'Bearer' as const,
          expiresIn: 900, // 15 minutes
          refreshToken: result.refreshToken,
          scope: 'read write',
          user: AuthMapper.toUserResponse(result.user),
        }

        const validatedResponse = validateResponse(
          authPublic.TokenResponse,
          oauthResponse,
          'AuthController.token',
        )

        response.json(validatedResponse)
      } else if (grantType === 'refreshToken') {
        const { refreshToken } = request.body
        const result = await this.authService.refreshToken(refreshToken)

        const oauthResponse = {
          accessToken: result.accessToken,
          tokenType: 'Bearer' as const,
          expiresIn: 900, // 15 minutes
          refreshToken: result.refreshToken,
          scope: 'read write',
        }

        const validatedResponse = validateResponse(
          authPublic.TokenResponse,
          oauthResponse,
          'AuthController.token',
        )

        response.json(validatedResponse)
      } else {
        throw ErrorFactory.badRequest('Unsupported grant type')
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /auth/introspect
   * Validate and get information about a token
   */
  async introspect(
    request: Request<{}, {}, IntrospectRequest>,
    response: Response,
  ): Promise<void> {
    try {
      const { token } = request.body

      const result = await this.authService.introspectToken(token)

      if (!result.valid) {
        const responseData = { active: false }
        const validatedResponse = validateResponse(
          authPublic.IntrospectResponse,
          responseData,
          'AuthController.introspect',
        )

        response.json(validatedResponse)

        return
      }

      const responseData = {
        active: true,
        scope: 'read write',
        username: result.payload?.email,
        tokenType: 'Bearer' as const,
        exp: result.payload?.exp,
        iat: result.payload?.iat,
        sub: result.payload?.userId,
        userId: result.payload?.userId,
        userEmail: result.payload?.email,
        userRole: result.payload?.role,
      }
      const validatedResponse = validateResponse(
        authPublic.IntrospectResponse,
        responseData,
        'AuthController.introspect',
      )

      response.json(validatedResponse)
    } catch {
      // For introspection, always return active: false for invalid tokens
      const responseData = { active: false }
      const validatedResponse = validateResponse(
        authPublic.IntrospectResponse,
        responseData,
        'AuthController.introspect',
      )

      response.json(validatedResponse)
    }
  }

  /**
   * POST /auth/revoke
   * Revoke a token
   */
  async revoke(
    request: Request<{}, {}, RevokeTokenRequest>,
    response: Response,
  ): Promise<void> {
    try {
      const { token, allDevices } = request.body

      if (allDevices) {
        // For allDevices, we need to extract userId from the token itself
        // since auth middleware is bypassed for /auth/* endpoints
        const introspection = await this.authService.introspectToken(token)

        if (introspection.valid && introspection.payload) {
          await this.authService.logout(introspection.payload.userId, token)

          const responseData = {
            success: true,
            message: 'All tokens revoked successfully',
          }
          const validatedResponse = validateResponse(
            authPublic.RevokeTokenResponse,
            responseData,
            'AuthController.revoke',
          )

          response.json(validatedResponse)
        } else {
          // Even if token is invalid, return success per OAuth spec
          // But still honor the allDevices flag for consistent messaging
          const responseData = {
            success: true,
            message: 'All tokens revoked successfully',
          }
          const validatedResponse = validateResponse(
            authPublic.RevokeTokenResponse,
            responseData,
            'AuthController.revoke',
          )

          response.json(validatedResponse)
        }
      } else {
        // Revoke specific token
        await this.authService.revokeToken(token)

        const responseData = {
          success: true,
          message: 'Token revoked successfully',
        }
        const validatedResponse = validateResponse(
          authPublic.RevokeTokenResponse,
          responseData,
          'AuthController.revoke',
        )

        response.json(validatedResponse)
      }
    } catch {
      // For revocation, always return success (OAuth 2.0 spec)
      response.json({
        success: true,
        message: 'Token revoked successfully',
      })
    }
  }

  /**
   * GET /auth/userinfo
   * Get user information from access token
   */
  @Cache({
    ttl: 300, // 5 minutes for user info
    prefix: 'userinfo',
    keyGenerator: httpRequestKeyGenerator,
  })
  async userinfo(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.authorization

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw ErrorFactory.unauthorized(
          'Missing or invalid authorization header',
        )
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Validate the token
      const introspection = await this.authService.introspectToken(token)

      if (!introspection.valid || !introspection.payload) {
        throw ErrorFactory.unauthorized('Invalid or expired token')
      }

      const userId = introspection.payload.userId
      const user = await this.authService.getUserInfo(userId)

      // Get permissions based on user role
      const permissions = mapRoleToPermissions(user.role)

      // Convert to DTO using mapper for proper date formatting
      const userDTO = UserMapper.toDTO(user)

      const userInfo = {
        id: userDTO.id,
        email: userDTO.email,
        emailVerified: userDTO.emailVerified,
        firstName: userDTO.firstName,
        lastName: userDTO.lastName,
        fullName: `${userDTO.firstName} ${userDTO.lastName}`,
        profilePicture: userDTO.avatarUrl,
        role: userDTO.role,
        permissions,
        // Note: locale omitted - would require TranslationClient.getUserLanguage(userId)
        // TODO: Add translation client dependency to auth service for proper locale support
        createdAt: userDTO.createdAt,
        updatedAt: userDTO.updatedAt,
      }

      const validatedResponse = validateResponse(
        authPublic.UserInfoResponse,
        userInfo,
        'AuthController.userinfo',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  // Role to permissions mapping is now imported from @pika/types
}
