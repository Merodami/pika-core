import { authPublic, userAdmin, userCommon, userPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { adaptMulterFile } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { UserMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { UserRole } from '@pika/types'
import type { IUserService } from '@user/services/UserService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles user management operations
 */
export class UserController {
  constructor(private readonly userService: IUserService) {
    // Bind methods to preserve 'this' context
    this.getAllUsers = this.getAllUsers.bind(this)
    this.getUserById = this.getUserById.bind(this)
    this.getUserByEmail = this.getUserByEmail.bind(this)
    this.getUserBySubToken = this.getUserBySubToken.bind(this)
    this.createUser = this.createUser.bind(this)
    this.createAdminUser = this.createAdminUser.bind(this)
    this.updateUser = this.updateUser.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)
    this.banUser = this.banUser.bind(this)
    this.unbanUser = this.unbanUser.bind(this)
    this.uploadAvatar = this.uploadAvatar.bind(this)
    this.getMe = this.getMe.bind(this)
    this.updateMe = this.updateMe.bind(this)
    this.uploadMyAvatar = this.uploadMyAvatar.bind(this)
  }

  /**
   * GET /users
   * Get all users with filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'users',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<userAdmin.AdminUserQueryParams>(req)

      // Map API query to service params
      const params = {
        email: query.email,
        role: query.role,
        status: query.status,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: userCommon.adminUserSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder?.toLowerCase() as 'asc' | 'desc' | undefined,
        // Additional admin search params
        emailVerified: query.emailVerified,
        phoneVerified: query.phoneVerified,
        registeredFrom: query.registeredFrom,
        registeredTo: query.registeredTo,
        lastLoginFrom: query.lastLoginFrom,
        lastLoginTo: query.lastLoginTo,
        minSpent: query.minSpent,
        maxSpent: query.maxSpent,
        hasReports: query.hasReports,
      }

      const result = await this.userService.getAllUsers(params)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, UserMapper.toDTO)
      const validatedResponse = validateResponse(
        userAdmin.AdminUserListResponse,
        response,
        'UserController.getAllUsers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/:user_id
   * Get user by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserById(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      const user = await this.userService.getUserById(userId)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.getUserById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/email/:email
   * Get user by email address
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user:email',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserByEmail(
    req: Request<userAdmin.EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params

      const user = await this.userService.getUserByEmail(email)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.getUserByEmail',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users
   * Create new user
   */
  async createUser(
    req: Request<{}, {}, authPublic.RegisterRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const user = await this.userService.createUser(data)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.createUser',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users (admin)
   * Create new user via admin interface
   */
  async createAdminUser(
    req: Request<{}, {}, userAdmin.AdminCreateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const user = await this.userService.createAdminUser(data)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.createAdminUser',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /users/:user_id
   * Update user information
   */
  async updateUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.AdminUpdateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const data = req.body

      const user = await this.userService.updateUser(userId, data)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.updateUser',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /users/:user_id
   * Delete user account
   */
  async deleteUser(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      await this.userService.deleteUser(userId)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users/:user_id/avatar
   * Upload user avatar image
   */
  async uploadAvatar(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const context = RequestContext.getContext(req)
      const authenticatedUserId = context.userId

      // Authorization check: Users can only upload their own avatars (unless admin)
      if (authenticatedUserId !== userId && context.role !== UserRole.ADMIN) {
        throw ErrorFactory.forbidden('You can only upload your own avatar')
      }

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
        'UserController.uploadAvatar',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/sub/:sub_token
   * Get user by subscription token
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user:subtoken',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserBySubToken(
    req: Request<userAdmin.SubTokenParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { subToken } = req.params
      const user = await this.userService.getUserBySubToken(subToken)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.getUserBySubToken',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/status
   * Update user account status
   */
  async updateUserStatus(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.UpdateUserStatusRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { status } = req.body
      const user = await this.userService.updateUserStatus(userId, status)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.updateUserStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/ban
   * Ban user account
   */
  async banUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.BanUserRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      const { reason, duration, notifyUser } = req.body

      await this.userService.banUser(userId, { reason, duration, notifyUser })

      // No content response
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/unban
   * Unban user account
   */
  async unbanUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.UnbanUserRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      const { reason, notifyUser } = req.body

      await this.userService.unbanUser(userId, { reason, notifyUser })

      // No content response
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me
   * Get current authenticated user profile
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const user = await this.userService.getUserById(userId)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.getMe',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/me
   * Update current authenticated user profile
   */
  async updateMe(
    req: Request<{}, {}, userPublic.UpdateProfileRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const user = await this.userService.updateUser(userId, req.body)

      const dto = UserMapper.toDTO(user)
      const validatedResponse = validateResponse(
        userPublic.UserProfileResponse,
        dto,
        'UserController.updateMe',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users/me/avatar
   * Upload avatar for current authenticated user
   */
  async uploadMyAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

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
        'UserController.uploadMyAvatar',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
