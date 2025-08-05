import {
  API_GATEWAY_BASE_URL,
  API_PREFIX,
  REDIS_DEFAULT_TTL,
} from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { type UserDomain } from '@pika/sdk'
import {
  CommunicationServiceClient,
  ErrorFactory,
  FileStoragePort,
  isUuidV4,
  logger,
} from '@pika/shared'
import {
  EmailTemplateId,
  mapUserRole,
  mapUserStatus,
  type PaginatedResult,
  UserRole,
  UserStatus,
  VerificationType,
} from '@pika/types'
import type {
  IUserRepository,
  UserSearchParams,
} from '@user/repositories/UserRepository.js'
import type { IInternalUserService } from '@user/services/InternalUserService.js'
import bcrypt from 'bcrypt'
import { randomInt } from 'crypto'

// Unified verification system using proper enums
export interface VerificationRequest {
  type: VerificationType
  token?: string // For email/confirmation tokens
  code?: string // For phone/SMS codes
  userId?: string // For user-specific verification
  email?: string // For email verification lookup
  phoneNumber?: string // For phone verification lookup
}

export interface ResendRequest {
  type: Exclude<VerificationType, VerificationType.ACCOUNT_CONFIRMATION> // Can't resend account confirmation
  userId?: string
  email?: string
  phoneNumber?: string
}

export interface IUserService {
  getAllUsers(params: UserSearchParams): Promise<PaginatedResult<UserDomain>>
  getUserById(id: string): Promise<UserDomain>
  getUserByEmail(email: string): Promise<UserDomain>
  getUserBySubToken(subToken: string): Promise<UserDomain>
  createUser(data: any): Promise<UserDomain>
  createAdminUser(data: any): Promise<UserDomain>
  updateUser(id: string, data: any): Promise<UserDomain>
  deleteUser(id: string): Promise<void>
  updateUserStatus(id: string, status: string): Promise<UserDomain>
  banUser(
    id: string,
    options?: { reason?: string; duration?: number; notifyUser?: boolean },
  ): Promise<UserDomain>
  unbanUser(
    id: string,
    options?: { reason?: string; notifyUser?: boolean },
  ): Promise<UserDomain>
  uploadUserAvatar(userId: string, file: any): Promise<string>

  // Unified verification system
  verify(request: VerificationRequest): Promise<UserDomain>
  resendVerification(request: ResendRequest): Promise<void>
}

export class UserService implements IUserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly cache: ICacheService,
    private readonly fileStorage?: FileStoragePort,
    private readonly internalUserService?: IInternalUserService,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:users',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllUsers(
    params: UserSearchParams,
  ): Promise<PaginatedResult<UserDomain>> {
    try {
      const result = await this.repository.findAll(params)

      return result
    } catch (error) {
      logger.error('Failed to get all users', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:user',
    keyGenerator: (id) => id,
  })
  async getUserById(id: string): Promise<UserDomain> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid user ID format')
      }

      const user = await this.repository.findById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      return user
    } catch (error) {
      logger.error('Failed to get user by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:user:email',
    keyGenerator: (email) => email,
  })
  async getUserByEmail(email: string): Promise<UserDomain> {
    try {
      const user = await this.repository.findByEmail(email)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', email)
      }

      return user
    } catch (error) {
      logger.error('Failed to get user by email', { error, email })
      throw ErrorFactory.fromError(error)
    }
  }

  async createUser(data: any): Promise<UserDomain> {
    try {
      // Check if user with email already exists
      const existing = await this.repository.findByEmail(data.email)

      if (existing) {
        throw ErrorFactory.businessRuleViolation(
          'User with this email already exists',
          'Email must be unique',
        )
      }

      // Hash password if provided
      let password: string | undefined

      if (data.password) {
        password = await bcrypt.hash(data.password, 10)
      }

      const user = await this.repository.create({
        ...data,
        password,
        role: data.role ? mapUserRole(data.role) : UserRole.CUSTOMER,
        status: data.status
          ? mapUserStatus(data.status)
          : UserStatus.UNCONFIRMED,
      })

      // Invalidate cache
      await this.invalidateCache()

      return user
    } catch (error) {
      logger.error('Failed to create user', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async createAdminUser(data: any): Promise<UserDomain> {
    try {
      // Check if user with email already exists
      const existing = await this.repository.findByEmail(data.email)

      if (existing) {
        throw ErrorFactory.businessRuleViolation(
          'User with this email already exists',
          'Email must be unique',
        )
      }

      // Admin creation - map schema fields to database fields
      const userData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        role: data.role ? mapUserRole(data.role) : UserRole.CUSTOMER,
        status: data.status
          ? mapUserStatus(data.status)
          : UserStatus.UNCONFIRMED,
      }

      const user = await this.repository.create(userData)

      // Invalidate cache
      await this.invalidateCache()

      logger.info('Admin user created successfully', {
        email: data.email,
        role: data.role,
        status: data.status,
      })

      return user
    } catch (error) {
      logger.error('Failed to create admin user', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateUser(id: string, data: any): Promise<UserDomain> {
    try {
      // Validate user exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      // Check email uniqueness if changing
      if (data.email && data.email !== existing.email) {
        const emailExists = await this.repository.findByEmail(data.email)

        if (emailExists) {
          throw ErrorFactory.businessRuleViolation(
            'Email already in use',
            'Email must be unique',
          )
        }
      }

      // Alias feature removed

      const user = await this.repository.update(id, data)

      // Invalidate cache
      await this.invalidateCache(id)

      return user
    } catch (error) {
      logger.error('Failed to update user', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Validate user exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      // Soft delete the user
      await this.repository.delete(id)

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('User deleted successfully', { id })
    } catch (error) {
      logger.error('Failed to delete user', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:user:subtoken',
    keyGenerator: (subToken) => subToken,
  })
  async getUserBySubToken(subToken: string): Promise<UserDomain> {
    try {
      const user = await this.repository.findBySubToken(subToken)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', subToken)
      }

      return user
    } catch (error) {
      logger.error('Failed to get user by sub token', { error, subToken })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateUserStatus(id: string, status: string): Promise<UserDomain> {
    try {
      // Validate user exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      const user = await this.repository.updateStatus(id, status)

      // Invalidate cache
      await this.invalidateCache(id)

      return user
    } catch (error) {
      logger.error('Failed to update user status', { error, id, status })
      throw ErrorFactory.fromError(error)
    }
  }

  async banUser(
    id: string,
    options?: { reason?: string; duration?: number; notifyUser?: boolean },
  ): Promise<UserDomain> {
    try {
      logger.debug(`Banning user ${id}`, options)

      // Update user status to banned
      const user = await this.updateUserStatus(id, UserStatus.BANNED)

      // Send notification if requested
      if (options?.notifyUser && this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            subject: 'Account Suspended',
            templateId: EmailTemplateId.ACCOUNT_BANNED,
            templateParams: {
              reason: options.reason || 'Terms of Service violation',
              duration: options.duration,
            },
          })
          .catch((error) => {
            logger.error('Failed to send ban notification:', error)
            // Don't fail the ban operation if notification fails
          })
      }

      return user
    } catch (error) {
      logger.error(`Error banning user ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Failed to ban user')
    }
  }

  async unbanUser(
    id: string,
    options?: { reason?: string; notifyUser?: boolean },
  ): Promise<UserDomain> {
    try {
      logger.debug(`Unbanning user ${id}`, options)

      // Update user status to active
      const user = await this.updateUserStatus(id, UserStatus.ACTIVE)

      // Send notification if requested
      if (options?.notifyUser && this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            subject: 'Account Reinstated',
            templateId: EmailTemplateId.ACCOUNT_UNBANNED,
            templateParams: {
              reason: options.reason || 'Your account has been reinstated',
            },
          })
          .catch((error) => {
            logger.error('Failed to send unban notification:', error)
            // Don't fail the unban operation if notification fails
          })
      }

      return user
    } catch (error) {
      logger.error(`Error unbanning user ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Failed to unban user')
    }
  }

  async uploadUserAvatar(userId: string, file: any): Promise<string> {
    try {
      if (!this.fileStorage) {
        throw ErrorFactory.serviceUnavailable(
          'File storage service is not available',
          {
            source: 'UserService.uploadUserAvatar',
          },
        )
      }

      // Validate user exists
      const user = await this.repository.findById(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Upload file with user context for service-to-service call
      const uploadResult = await this.fileStorage.saveFile(
        file,
        `users/${userId}`,
        {
          context: {
            userId,
            userEmail: user.email,
            userRole: user.role,
          },
        },
      )

      // Update user with new avatar URL
      await this.repository.update(userId, { avatarUrl: uploadResult.url })

      // Invalidate cache
      await this.invalidateCache(userId)

      return uploadResult.url
    } catch (error) {
      logger.error('Failed to upload user avatar', { error, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Unified verification method - handles all verification types
   */
  async verify(request: VerificationRequest): Promise<UserDomain> {
    try {
      logger.info('Processing verification request', {
        type: request.type,
        userId: request.userId,
        email: request.email,
      })

      switch (request.type) {
        case VerificationType.EMAIL:
          return await this.verifyEmail(request)

        case VerificationType.PHONE:
          return await this.verifyPhone(request)

        case VerificationType.ACCOUNT_CONFIRMATION:
          return await this.confirmAccount(request)

        default:
          throw ErrorFactory.badRequest(
            `Unsupported verification type: ${request.type}`,
          )
      }
    } catch (error) {
      logger.error('Verification failed', { error, request })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Unified resend verification method
   */
  async resendVerification(request: ResendRequest): Promise<void> {
    try {
      logger.info('Processing resend verification request', {
        type: request.type,
        userId: request.userId,
        email: request.email,
      })

      switch (request.type) {
        case VerificationType.EMAIL:
          await this.resendEmailVerification(request)
          break

        case VerificationType.PHONE:
          await this.resendPhoneVerification(request)
          break

        default:
          throw ErrorFactory.badRequest(
            `Unsupported resend type: ${request.type}`,
          )
      }
    } catch (error) {
      logger.error('Resend verification failed', { error, request })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Email verification implementation
   */
  private async verifyEmail(request: VerificationRequest): Promise<UserDomain> {
    let userId: string

    // Admin verification path: direct verification by userId
    if (request.userId) {
      userId = request.userId

      // Verify email directly for admin
      if (!this.internalUserService) {
        throw ErrorFactory.serviceUnavailable(
          'Internal user service not available',
        )
      }

      await this.internalUserService.verifyEmail(userId)
    }
    // User self-verification path: token-based
    else if (request.token) {
      if (!this.internalUserService) {
        throw ErrorFactory.serviceUnavailable(
          'Internal user service not available',
        )
      }

      // Validate token and get user ID
      userId = await this.internalUserService.validateEmailVerificationToken(
        request.token,
      )

      // Verify email using internal service
      await this.internalUserService.verifyEmail(userId)
    } else {
      throw ErrorFactory.badRequest(
        'Email verification requires either a token or userId',
      )
    }

    // Get updated user
    const updatedUser = await this.repository.findById(userId)

    if (!updatedUser) {
      throw ErrorFactory.resourceNotFound('User', userId)
    }

    await this.invalidateCache(userId)

    return updatedUser
  }

  /**
   * Phone verification implementation
   */
  private async verifyPhone(request: VerificationRequest): Promise<UserDomain> {
    if (!request.userId) {
      throw ErrorFactory.badRequest(
        'User ID is required for phone verification',
      )
    }

    const user = await this.repository.findById(request.userId)

    if (!user) {
      throw ErrorFactory.resourceNotFound('User', request.userId)
    }

    // Admin verification path: Direct verification by userId (no code required)
    if (request.userId && !request.code) {
      // Admin can verify phone directly without code validation
      logger.info('Admin phone verification - bypassing code validation', {
        userId: request.userId,
      })

      // Update user as phone verified
      const updatedUser = await this.repository.update(request.userId, {
        phoneVerified: true,
      })

      await this.invalidateCache(request.userId)

      return updatedUser
    }

    // User self-verification path: Requires code validation
    if (!request.code) {
      throw ErrorFactory.badRequest(
        'Phone verification requires a verification code',
      )
    }

    // Validate phone verification code from Redis
    const cacheKey = `phone-verification:${request.userId}`
    const storedCode = await this.cache.get<string>(cacheKey)

    if (!storedCode || storedCode !== request.code) {
      throw ErrorFactory.unauthorized('Invalid or expired verification code')
    }

    // Delete the code after successful validation
    await this.cache.del(cacheKey)

    // Update user as phone verified
    const updatedUser = await this.repository.update(request.userId, {
      phoneVerified: true,
    })

    await this.invalidateCache(request.userId)

    return updatedUser
  }

  /**
   * Account confirmation implementation
   */
  private async confirmAccount(
    request: VerificationRequest,
  ): Promise<UserDomain> {
    if (!request.userId) {
      throw ErrorFactory.badRequest(
        'User ID is required for account confirmation',
      )
    }

    const user = await this.repository.findById(request.userId)

    if (!user) {
      throw ErrorFactory.resourceNotFound('User', request.userId)
    }

    const updatedUser = await this.repository.update(request.userId, {
      status: UserStatus.ACTIVE,
    })

    await this.invalidateCache(request.userId)

    return updatedUser
  }

  /**
   * Resend email verification implementation
   */
  private async resendEmailVerification(request: ResendRequest): Promise<void> {
    let user: UserDomain | null = null

    if (request.userId) {
      user = await this.repository.findById(request.userId)
    } else if (request.email) {
      user = await this.repository.findByEmail(request.email)
    } else {
      throw ErrorFactory.badRequest('Either userId or email is required')
    }

    if (!user) {
      throw ErrorFactory.resourceNotFound(
        'User',
        request.userId || request.email!,
      )
    }

    if (!this.internalUserService || !this.communicationClient) {
      throw ErrorFactory.serviceUnavailable('Required services not available')
    }

    // Create new verification token
    const token = await this.internalUserService.createEmailVerificationToken(
      user.id,
    )

    // Build verification URL
    const verificationUrl = `${API_GATEWAY_BASE_URL}${API_PREFIX}/auth/verify-email/${token}`

    // Send verification email using communication service
    await this.communicationClient.sendEmail({
      to: user.email,
      templateId: EmailTemplateId.EMAIL_VERIFICATION,
      templateParams: {
        firstName: user.firstName,
        verificationUrl,
      },
    })

    logger.info('Email verification resent', {
      userId: user.id,
      email: user.email,
    })
  }

  /**
   * Resend phone verification implementation
   */
  private async resendPhoneVerification(request: ResendRequest): Promise<void> {
    let user: UserDomain | null = null

    if (request.userId) {
      user = await this.repository.findById(request.userId)
    } else if (request.phoneNumber) {
      // TODO: Add findByPhoneNumber method to repository
      throw ErrorFactory.businessRuleViolation(
        'Phone lookup not implemented',
        'Finding users by phone number is not yet implemented',
      )
    } else {
      throw ErrorFactory.badRequest('Either userId or phoneNumber is required')
    }

    if (!user) {
      throw ErrorFactory.resourceNotFound('User', request.userId!)
    }

    if (!user.phoneNumber) {
      throw ErrorFactory.badRequest('User does not have a phone number')
    }

    if (!this.communicationClient) {
      throw ErrorFactory.serviceUnavailable(
        'Communication service not available',
      )
    }

    // Generate 6-digit verification code
    const verificationCode = randomInt(100000, 999999).toString()

    // Store code in Redis with 5 minute TTL
    const cacheKey = `phone-verification:${user.id}`

    await this.cache.set(cacheKey, verificationCode, 300) // 5 minutes

    // TODO: Send SMS using communication service once SMS support is added
    // For now, just log the code - in production this would send an SMS
    logger.info('Phone verification code generated', {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      code: verificationCode, // Remove this in production!
    })

    logger.info('Phone verification resent', {
      userId: user.id,
      phoneNumber: user.phoneNumber,
    })
  }

  private async invalidateCache(userId?: string): Promise<void> {
    try {
      // Invalidate specific user cache if ID provided
      if (userId) {
        await this.cache.del(`service:user:${userId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:users:*')
      await this.cache.delPattern?.('users:*')
      await this.cache.delPattern?.('user:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}
