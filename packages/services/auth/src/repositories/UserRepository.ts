import type { ICacheService } from '@pika/redis'
import { ErrorFactory } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'
import { PrismaClient, User } from '@prisma/client'
import crypto from 'crypto'

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: UpdateUserInput): Promise<User>
  delete(id: string): Promise<void>
  updateLastLogin(userId: string, loginTime: Date): Promise<void>
  emailExists(email: string): Promise<boolean>
  phoneExists(phoneNumber: string): Promise<boolean>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  verifyEmail(userId: string): Promise<void>
  createPasswordResetToken(userId: string): Promise<string>
  validatePasswordResetToken(token: string): Promise<string | null>
  invalidatePasswordResetToken(token: string): Promise<void>
  createEmailVerificationToken(userId: string): Promise<string>
  validateEmailVerificationToken(token: string): Promise<string | null>
}

export interface CreateUserInput {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: UserRole
  avatarUrl?: string
}

export interface UpdateUserInput {
  email?: string
  passwordHash?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role?: UserRole
  avatarUrl?: string
  status?: UserStatus
}

export class UserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      })

      return user
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByEmail',
        'Failed to find user by email',
        error,
      )
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      // Try cache first
      if (this.cache) {
        const cached = await this.cache.get<User>(`user:${id}`)

        if (cached) return cached
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      })

      // Cache for future requests
      if (user && this.cache) {
        await this.cache.set(`user:${id}`, user, 300) // Cache for 5 minutes
      }

      return user
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find user by id',
        error,
      )
    }
  }

  async create(data: CreateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          role: data.role as any,
          avatarUrl: data.avatarUrl,
          status: UserStatus.ACTIVE,
          emailVerified: false,
        },
      })

      return user
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw ErrorFactory.uniqueConstraintViolation(
          'User',
          'email',
          data.email,
        )
      }
      throw ErrorFactory.databaseError('create', 'Failed to create user', error)
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: data as any,
      })

      // Invalidate cache
      if (this.cache) {
        await this.cache.del(`user:${id}`)
      }

      return user
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('User', id)
      }
      if (error?.code === 'P2002') {
        throw ErrorFactory.uniqueConstraintViolation(
          'User',
          'email',
          data.email || '',
        )
      }
      throw ErrorFactory.databaseError('update', 'Failed to update user', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      })

      // Invalidate cache
      if (this.cache) {
        await this.cache.del(`user:${id}`)
      }
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('User', id)
      }
      throw ErrorFactory.databaseError('delete', 'Failed to delete user', error)
    }
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: loginTime },
      })

      // Invalidate cache
      if (this.cache) {
        await this.cache.del(`user:${userId}`)
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'updateLastLogin',
        'Failed to update last login',
        error,
      )
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email },
      })

      return count > 0
    } catch (error) {
      throw ErrorFactory.databaseError(
        'emailExists',
        'Failed to check email existence',
        error,
      )
    }
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { phoneNumber },
      })

      return count > 0
    } catch (error) {
      throw ErrorFactory.databaseError(
        'phoneExists',
        'Failed to check phone existence',
        error,
      )
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: passwordHash },
      })

      // Invalidate cache
      if (this.cache) {
        await this.cache.del(`user:${userId}`)
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'updatePassword',
        'Failed to update password',
        error,
      )
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      })

      // Invalidate cache
      if (this.cache) {
        await this.cache.del(`user:${userId}`)
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'verifyEmail',
        'Failed to verify email',
        error,
      )
    }
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex')

      // Store token in cache with expiration
      if (this.cache) {
        await this.cache.set(
          `password-reset:${token}`,
          userId,
          24 * 60 * 60, // 24 hours in seconds
        )
      } else {
        // If no cache, we could store in database
        // For now, throw error as cache is required
        throw new Error('Cache service required for password reset')
      }

      return token
    } catch (error) {
      throw ErrorFactory.databaseError(
        'createPasswordResetToken',
        'Failed to create password reset token',
        error,
      )
    }
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    try {
      if (!this.cache) {
        throw new Error('Cache service required for password reset')
      }

      const userId = await this.cache.get<string>(`password-reset:${token}`)

      return userId
    } catch (error) {
      throw ErrorFactory.databaseError(
        'validatePasswordResetToken',
        'Failed to validate password reset token',
        error,
      )
    }
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    try {
      if (!this.cache) {
        throw new Error('Cache service required for password reset')
      }

      await this.cache.del(`password-reset:${token}`)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'invalidatePasswordResetToken',
        'Failed to invalidate password reset token',
        error,
      )
    }
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    try {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex')

      // Store token in cache with expiration (7 days)
      if (this.cache) {
        await this.cache.set(
          `email-verification:${token}`,
          userId,
          7 * 24 * 60 * 60, // 7 days in seconds
        )
      } else {
        throw new Error('Cache service required for email verification')
      }

      return token
    } catch (error) {
      throw ErrorFactory.databaseError(
        'createEmailVerificationToken',
        'Failed to create email verification token',
        error,
      )
    }
  }

  async validateEmailVerificationToken(token: string): Promise<string | null> {
    try {
      if (!this.cache) {
        throw new Error('Cache service required for email verification')
      }

      const userId = await this.cache.get<string>(`email-verification:${token}`)

      return userId
    } catch (error) {
      throw ErrorFactory.databaseError(
        'validateEmailVerificationToken',
        'Failed to validate email verification token',
        error,
      )
    }
  }
}
