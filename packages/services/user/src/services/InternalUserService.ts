import { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'
import type { IUserRepository } from '@user/repositories/UserRepository.js'
import { randomBytes } from 'crypto'

// Domain interface for auth-specific data
interface UserAuthData {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface IInternalUserService {
  getUserAuthDataByEmail(email: string): Promise<UserAuthData | null>
  getUserAuthData(id: string): Promise<UserAuthData | null>
  createUser(data: any): Promise<UserAuthData>
  updateLastLogin(id: string): Promise<void>
  checkEmailExists(email: string): Promise<boolean>
  checkPhoneExists(phone: string): Promise<boolean>
  updatePassword(id: string, hashedPassword: string): Promise<void>
  verifyEmail(id: string): Promise<void>
  createPasswordResetToken(
    id: string,
  ): Promise<{ token: string; expiresAt: Date }>
  validatePasswordResetToken(token: string): Promise<string>
  invalidatePasswordResetToken(token: string): Promise<void>
  createEmailVerificationToken(
    id: string,
  ): Promise<{ token: string; expiresAt: Date }>
  validateEmailVerificationToken(token: string): Promise<string>
}

const PASSWORD_RESET_TOKEN_TTL = 86400 // 24 hours
const EMAIL_VERIFICATION_TOKEN_TTL = 604800 // 7 days

export class InternalUserService implements IInternalUserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly cache: ICacheService,
  ) {}

  async getUserAuthDataByEmail(email: string): Promise<UserAuthData | null> {
    try {
      const user = await this.repository.getRawUserByEmail(
        email.toLowerCase().trim(),
      )

      if (!user) {
        return null
      }

      // Map database user to UserAuthData
      const authData: UserAuthData = {
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      }

      return authData
    } catch (error) {
      logger.error('Failed to get user auth data by email', { error, email })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserAuthData(id: string): Promise<UserAuthData | null> {
    try {
      const user = await this.repository.getRawUserById(id)

      if (!user) {
        return null
      }

      // Map database user to UserAuthData
      const authData: UserAuthData = {
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        role: user.role as UserRole,
        status: user.status as UserStatus,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
      }

      return authData
    } catch (error) {
      logger.error('Failed to get user auth data by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async createUser(data: any): Promise<UserAuthData> {
    try {
      // Check if user with email already exists
      const existing = await this.repository.findByEmail(data.email)

      if (existing) {
        throw ErrorFactory.resourceConflict(
          'User',
          `Email already exists: ${data.email}`,
        )
      }

      // Only accept passwordHash - internal APIs should not handle plain passwords
      if (!data.passwordHash) {
        throw ErrorFactory.validationError({
          passwordHash: ['passwordHash is required'],
        })
      }

      // Extract passwordHash and rename it to password for the create method
      const { passwordHash, ...userData } = data

      const user = await this.repository.create({
        ...userData,
        password: passwordHash,
        emailVerified: false,
        status: UserStatus.UNCONFIRMED,
      })

      // After creating, fetch the raw user data to get the password
      const rawUser = await this.repository.getRawUserById(user.id)

      if (!rawUser) {
        throw ErrorFactory.databaseError(
          'create',
          'Failed to retrieve created user',
        )
      }

      // Map raw user to UserAuthData
      const authData: UserAuthData = {
        id: rawUser.id,
        email: rawUser.email,
        password: rawUser.password,
        firstName: rawUser.firstName,
        lastName: rawUser.lastName,
        phoneNumber: rawUser.phoneNumber || undefined,
        role: rawUser.role as UserRole,
        status: rawUser.status as UserStatus,
        emailVerified: rawUser.emailVerified,
        createdAt: rawUser.createdAt.toISOString(),
        lastLoginAt: rawUser.lastLoginAt?.toISOString(),
      }

      return authData
    } catch (error) {
      logger.error('Failed to create user', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.repository.update(id, {
        lastLoginAt: new Date(),
      })
    } catch (error) {
      logger.error('Failed to update last login', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const user = await this.repository.findByEmail(email.toLowerCase().trim())

      return !!user
    } catch (error) {
      logger.error('Failed to check email exists', { error, email })
      throw ErrorFactory.fromError(error)
    }
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const user = await this.repository.findByPhone(phone)

      return !!user
    } catch (error) {
      logger.error('Failed to check phone exists', { error, phone })
      throw ErrorFactory.fromError(error)
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      await this.repository.update(id, {
        password: hashedPassword,
      })
    } catch (error) {
      logger.error('Failed to update password', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async verifyEmail(id: string): Promise<void> {
    try {
      await this.repository.update(id, {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      })
    } catch (error) {
      logger.error('Failed to verify email', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async createPasswordResetToken(
    id: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    try {
      // Check if user exists first
      const user = await this.repository.getRawUserById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      const token = randomBytes(32).toString('hex')
      const key = `password-reset:${token}`
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL * 1000)

      await this.cache.set(key, id, PASSWORD_RESET_TOKEN_TTL)

      return { token, expiresAt }
    } catch (error) {
      logger.error('Failed to create password reset token', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async validatePasswordResetToken(token: string): Promise<string> {
    try {
      const key = `password-reset:${token}`
      const userId = await this.cache.get<string>(key)

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Invalid or expired password reset token',
        )
      }

      return userId
    } catch (error) {
      logger.error('Failed to validate password reset token', { error, token })
      throw ErrorFactory.fromError(error)
    }
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    try {
      const key = `password-reset:${token}`

      await this.cache.del(key)
    } catch (error) {
      logger.error('Failed to invalidate password reset token', {
        error,
        token,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async createEmailVerificationToken(
    id: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    try {
      // Check if user exists first
      const user = await this.repository.getRawUserById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      const token = randomBytes(32).toString('hex')
      const key = `email-verification:${token}`
      const expiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_TOKEN_TTL * 1000,
      )

      await this.cache.set(key, id, EMAIL_VERIFICATION_TOKEN_TTL)

      return { token, expiresAt }
    } catch (error) {
      logger.error('Failed to create email verification token', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async validateEmailVerificationToken(token: string): Promise<string> {
    try {
      const key = `email-verification:${token}`
      const userId = await this.cache.get<string>(key)

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Invalid or expired email verification token',
        )
      }

      // Delete the token after validation
      await this.cache.del(key)

      return userId
    } catch (error) {
      logger.error('Failed to validate email verification token', {
        error,
        token,
      })
      throw ErrorFactory.fromError(error)
    }
  }
}
