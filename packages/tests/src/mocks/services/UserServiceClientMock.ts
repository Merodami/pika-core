import { UserServiceClient } from '@pika/shared'
import { UserStatus } from '@pika/types'
import type { User } from '@prisma/client'
import { vi } from 'vitest'

/**
 * Shared mock for UserServiceClient used across integration tests
 * Provides consistent user data structures for testing
 */
export class UserServiceClientMock implements Partial<UserServiceClient> {
  // Default test users
  static readonly TEST_USER: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$9Erjm5.hmByB.mD99PAvb.0fJF38j2JZSVNHHjE4vY.cRdHdOovzW', // Password123!
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneNumber: '+1234567890',
    avatarUrl: null,
    dateOfBirth: new Date('1990-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  static readonly ADMIN_USER: Partial<User> = {
    ...UserServiceClientMock.TEST_USER,
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  }

  // Mock methods
  createUser = vi.fn()
  getUserAuthDataByEmail = vi.fn()
  getUserAuthData = vi.fn()
  getUser = vi.fn()
  getUserByEmail = vi.fn()
  updateUser = vi.fn()
  verifyEmail = vi.fn()
  emailExists = vi.fn()
  phoneExists = vi.fn()
  updateLastLogin = vi.fn()
  updatePassword = vi.fn()
  createPasswordResetToken = vi.fn()
  validatePasswordResetToken = vi.fn()
  invalidatePasswordResetToken = vi.fn()
  createEmailVerificationToken = vi.fn()
  validateEmailVerificationToken = vi.fn()

  /**
   * Configure mock for successful authentication
   */
  setupAuthSuccess(user: Partial<User> = UserServiceClientMock.TEST_USER) {
    // Auth data includes isActive as a function
    const authData = {
      ...user,
      isActive: () => user.status === UserStatus.ACTIVE,
    }

    this.getUserAuthDataByEmail.mockResolvedValue(authData)
    this.getUserAuthData.mockResolvedValue(authData)
    this.getUserByEmail.mockResolvedValue(user)
    this.getUser.mockResolvedValue(user)
    this.updateLastLogin.mockResolvedValue(undefined)

    return this
  }

  /**
   * Configure mock for user not found
   */
  setupUserNotFound() {
    this.getUserAuthDataByEmail.mockResolvedValue(null)
    this.getUserAuthData.mockResolvedValue(null)
    this.getUserByEmail.mockResolvedValue(null)
    this.getUser.mockResolvedValue(null)

    return this
  }

  /**
   * Configure mock for inactive user
   */
  setupInactiveUser(user: Partial<User> = UserServiceClientMock.TEST_USER) {
    const inactiveUser = {
      ...user,
      status: UserStatus.SUSPENDED,
      isActive: () => false,
    }

    this.getUserAuthDataByEmail.mockResolvedValue(inactiveUser)
    this.getUserByEmail.mockResolvedValue({
      ...user,
      status: UserStatus.SUSPENDED,
    })

    return this
  }

  /**
   * Reset all mocks
   */
  reset() {
    vi.clearAllMocks()

    return this
  }
}
