import { UserRole, UserStatus } from '@pika/types'

import {
  CreateUserData,
  UserService,
  UserServiceUser,
} from '../strategies/LocalAuthStrategy.js'
import { mapToUserServiceUser } from './UserMapper.js'

/**
 * Adapter to bridge auth package with user service
 * Implements UserService interface for LocalAuthStrategy
 * This allows the auth package to interact with user data without tight coupling
 */
export class UserServiceAdapter implements UserService {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async findByEmail(email: string): Promise<UserServiceUser | null> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) return null

    return mapToUserServiceUser(user)
  }

  async createUser(data: CreateUserData): Promise<UserServiceUser> {
    const user = await this.userRepository.create(data)

    return mapToUserServiceUser(user)
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    await this.userRepository.updateLastLogin(userId, loginTime)
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.userRepository.emailExists(email)
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    return await this.userRepository.phoneExists(phoneNumber)
  }

  async findById(userId: string): Promise<UserServiceUser | null> {
    const user = await this.userRepository.findById(userId)

    if (!user) return null

    return mapToUserServiceUser(user)
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.updatePassword(userId, passwordHash)
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.verifyEmail(userId)
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    return this.userRepository.createPasswordResetToken(userId)
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    return this.userRepository.validatePasswordResetToken(token)
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await this.userRepository.invalidatePasswordResetToken(token)
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    return this.userRepository.createEmailVerificationToken(userId)
  }

  async validateEmailVerificationToken(token: string): Promise<string | null> {
    return this.userRepository.validateEmailVerificationToken(token)
  }
}

/**
 * Interface for user repository that the adapter requires
 * This defines the minimal contract needed from the user service
 */
export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(userId: string): Promise<UserEntity | null>
  create(data: CreateUserData): Promise<UserEntity>
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

/**
 * Minimal user entity interface for the adapter
 */
export interface UserEntity {
  id: string
  email: string
  password?: string | null
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: Date
  lastLoginAt?: Date | null
}
