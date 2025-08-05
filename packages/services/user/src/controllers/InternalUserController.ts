import { userInternal } from '@pika/api'
import { validateResponse } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import type { IInternalUserService } from '@user/services/InternalUserService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles internal user operations for service-to-service communication
 */
export class InternalUserController {
  constructor(private readonly internalUserService: IInternalUserService) {
    // Bind methods to preserve 'this' context
    this.getUserAuthDataByEmail = this.getUserAuthDataByEmail.bind(this)
    this.getUserAuthData = this.getUserAuthData.bind(this)
    this.createUser = this.createUser.bind(this)
    this.updateLastLogin = this.updateLastLogin.bind(this)
    this.checkEmailExists = this.checkEmailExists.bind(this)
    this.checkPhoneExists = this.checkPhoneExists.bind(this)
    this.updatePassword = this.updatePassword.bind(this)
    this.verifyEmail = this.verifyEmail.bind(this)
    this.createPasswordResetToken = this.createPasswordResetToken.bind(this)
    this.validatePasswordResetToken = this.validatePasswordResetToken.bind(this)
    this.invalidatePasswordResetToken =
      this.invalidatePasswordResetToken.bind(this)
    this.createEmailVerificationToken =
      this.createEmailVerificationToken.bind(this)
    this.validateEmailVerificationToken =
      this.validateEmailVerificationToken.bind(this)
  }

  /**
   * GET /internal/users/auth/by-email/:email
   * Get user authentication data by email
   */
  async getUserAuthDataByEmail(
    req: Request<userInternal.EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params
      const user = await this.internalUserService.getUserAuthDataByEmail(email)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      const validatedResponse = validateResponse(
        userInternal.UserAuthData,
        user,
        'InternalUserController.getUserAuthDataByEmail',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/auth/:id
   * Get user authentication data by ID
   */
  async getUserAuthData(
    req: Request<userInternal.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const user = await this.internalUserService.getUserAuthData(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      const validatedResponse = validateResponse(
        userInternal.UserAuthData,
        user,
        'InternalUserController.getUserAuthData',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users
   * Create new user for registration
   */
  async createUser(
    req: Request<{}, {}, userInternal.CreateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body
      const user = await this.internalUserService.createUser(data)

      const validatedResponse = validateResponse(
        userInternal.UserAuthData,
        user,
        'InternalUserController.getUserAuthData',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/last-login
   * Update user's last login timestamp
   */
  async updateLastLogin(
    req: Request<
      userInternal.UserIdParam,
      {},
      userInternal.UpdateLastLoginRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.internalUserService.updateLastLogin(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/check-email/:email
   * Check if email already exists
   */
  async checkEmailExists(
    req: Request<userInternal.EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params
      const exists = await this.internalUserService.checkEmailExists(email)

      const response = { exists }
      const validatedResponse = validateResponse(
        userInternal.ExistsResponse,
        response,
        'InternalUserController.checkEmail',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/check-phone/:phone
   * Check if phone number already exists
   */
  async checkPhoneExists(
    req: Request<userInternal.PhoneParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { phone } = req.params
      const exists = await this.internalUserService.checkPhoneExists(phone)

      const response = { exists }
      const validatedResponse = validateResponse(
        userInternal.ExistsResponse,
        response,
        'InternalUserController.checkPhone',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/password
   * Update user's hashed password
   */
  async updatePassword(
    req: Request<
      userInternal.UserIdParam,
      {},
      userInternal.UpdatePasswordRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { passwordHash } = req.body

      await this.internalUserService.updatePassword(id, passwordHash)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/verify-email
   * Mark user's email as verified
   */
  async verifyEmail(
    req: Request<userInternal.UserIdParam, {}, userInternal.VerifyEmailRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.internalUserService.verifyEmail(id)

      const response = { success: true }
      const validatedResponse = validateResponse(
        userInternal.SuccessResponse,
        response,
        'InternalUserController.verifyEmail',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/password-reset-token
   * Create password reset token for user
   */
  async createPasswordResetToken(
    req: Request<
      userInternal.UserIdParam,
      {},
      userInternal.CreatePasswordResetTokenRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const tokenData =
        await this.internalUserService.createPasswordResetToken(id)

      const response = {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt.toISOString(),
      }
      const validatedResponse = validateResponse(
        userInternal.TokenResponse,
        response,
        'InternalUserController.createPasswordResetToken',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/validate-password-reset-token
   * Validate password reset token and return user ID
   */
  async validatePasswordResetToken(
    req: Request<{}, {}, userInternal.ValidatePasswordResetTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body
      const userId =
        await this.internalUserService.validatePasswordResetToken(token)

      const response = { valid: true, userId }
      const validatedResponse = validateResponse(
        userInternal.ValidateTokenResponse,
        response,
        'InternalUserController.validatePasswordResetToken',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/invalidate-password-reset-token
   * Invalidate password reset token after use
   */
  async invalidatePasswordResetToken(
    req: Request<{}, {}, userInternal.ValidatePasswordResetTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body

      await this.internalUserService.invalidatePasswordResetToken(token)

      const response = { success: true }
      const validatedResponse = validateResponse(
        userInternal.SuccessResponse,
        response,
        'InternalUserController.invalidatePasswordResetToken',
      )

      res.status(200).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/email-verification-token
   * Create email verification token for user
   */
  async createEmailVerificationToken(
    req: Request<
      userInternal.UserIdParam,
      {},
      userInternal.CreateEmailVerificationTokenRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const tokenData =
        await this.internalUserService.createEmailVerificationToken(id)

      const response = {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt.toISOString(),
      }
      const validatedResponse = validateResponse(
        userInternal.TokenResponse,
        response,
        'InternalUserController.createEmailVerificationToken',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/validate-email-verification-token
   * Validate email verification token and return user ID
   */
  async validateEmailVerificationToken(
    req: Request<{}, {}, userInternal.ValidateEmailVerificationTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body
      const userId =
        await this.internalUserService.validateEmailVerificationToken(token)

      const response = { valid: true, userId }
      const validatedResponse = validateResponse(
        userInternal.ValidateTokenResponse,
        response,
        'InternalUserController.validateEmailVerificationToken',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
