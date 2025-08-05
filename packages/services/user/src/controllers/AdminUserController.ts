import { userAdmin, userPublic } from '@pika/api'
import { adaptMulterFile, RequestContext, validateResponse } from '@pika/http'
import { UserMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { IUserService } from '@user/services/UserService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin user management operations
 */
export class AdminUserController {
  constructor(private readonly userService: IUserService) {
    // Bind methods to preserve 'this' context
    this.verifyUser = this.verifyUser.bind(this)
    this.resendVerification = this.resendVerification.bind(this)
    this.uploadUserAvatar = this.uploadUserAvatar.bind(this)
    this.getMyProfile = this.getMyProfile.bind(this)
    this.updateMyProfile = this.updateMyProfile.bind(this)
    this.getUserVerificationStatus = this.getUserVerificationStatus.bind(this)
    this.getUserById = this.getUserById.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
  }

  /**
   * POST /admin/users/verify
   * Admin verifies any user account (email, phone, or account confirmation)
   */
  async verifyUser(
    req: Request<{}, {}, userPublic.UnifiedVerificationRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const verificationRequest = req.body

      // Ensure userId is provided for admin verification
      if (!verificationRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin verification',
        )
      }

      await this.userService.verify(verificationRequest)

      // No content response - verification operations don't need response body
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/resend-verification
   * Admin resends verification (email or phone) for any user
   */
  async resendVerification(
    req: Request<{}, {}, userPublic.UnifiedResendVerificationRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const resendRequest = req.body

      // Ensure userId is provided for admin resend
      if (!resendRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin resend verification',
        )
      }

      await this.userService.resendVerification(resendRequest)

      const response = {
        success: true,
        message: `Verification resent successfully`,
      }
      const validatedResponse = validateResponse(
        userAdmin.ResendVerificationResponse,
        response,
        'AdminUserController.resendVerification',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/:id/avatar
   * Admin uploads avatar for any user
   */
  async uploadUserAvatar(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      // Get the uploaded file from Multer
      const file = req.file

      if (!file) {
        throw ErrorFactory.badRequest('No file uploaded')
      }

      // Adapt the multer file to our FileUpload format
      const adaptedFile = adaptMulterFile(file)

      const url = await this.userService.uploadUserAvatar(userId, adaptedFile)

      const response = { avatarUrl: url }
      const validatedResponse = validateResponse(
        userPublic.UploadAvatarResponse,
        response,
        'AdminUserController.uploadUserAvatar',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/:id
   * Get user by ID with admin details
   */
  async getUserById(
    req: Request<userAdmin.UserIdParam>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      const user = await this.userService.getUserById(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(user)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getUserById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/me
   * Get current admin user profile
   */
  async getMyProfile(
    req: Request,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User ID not found in context')
      }

      const user = await this.userService.getUserById(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(user)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getMyProfile',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/users/me
   * Update current admin user profile
   */
  async updateMyProfile(
    req: Request<{}, {}, userAdmin.UpdateAdminProfileRequest>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User ID not found in context')
      }

      const updateData = req.body

      // Update user profile
      const updatedUser = await this.userService.updateUser(userId, {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        dateOfBirth: updateData.dateOfBirth,
        avatarUrl: updateData.avatarUrl,
      })

      // TODO: Handle adminNotes update separately if needed

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(updatedUser)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getMyProfile',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/:id/verification-status
   * Get user verification status
   */
  async getUserVerificationStatus(
    req: Request<userAdmin.UserIdParam>,
    res: Response<userAdmin.UserVerificationStatusResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const user = await this.userService.getUserById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      // Use toAdminDTO to get proper types
      const dto = UserMapper.toAdminDTO(user)

      const verificationStatus: userAdmin.UserVerificationStatusResponse = {
        userId: dto.id,
        emailVerified: dto.emailVerified,
        phoneVerified: dto.phoneVerified,
        verificationDate:
          dto.emailVerified && dto.updatedAt ? dto.updatedAt : undefined,
      }

      const validatedResponse = validateResponse(
        userAdmin.UserVerificationStatusResponse,
        verificationStatus,
        'AdminUserController.getUserVerificationStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/users/:id
   * Delete user by ID (soft delete)
   */
  async deleteUser(
    req: Request<userAdmin.UserIdParam>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      await this.userService.deleteUser(userId)

      // No content response
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
