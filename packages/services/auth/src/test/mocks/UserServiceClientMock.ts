import { UserServiceClient } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'

interface MockUser {
  id: string
  email: string
  password?: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  phoneNumber?: string
  dateOfBirth?: string
  avatarUrl?: string
}

export class UserServiceClientMock extends UserServiceClient {
  private users: Map<string, MockUser> = new Map()
  private emailToUserId: Map<string, string> = new Map()
  private passwordResetTokens: Map<string, string> = new Map()
  private emailVerificationTokens: Map<string, string> = new Map()

  constructor() {
    // Initialize with empty URL since we won't make HTTP calls
    super()
    this.initializeMockData()
  }

  private initializeMockData(): void {
    // Predefined test users with hashed passwords
    const testPassword =
      '$2b$10$m3.YrysIB6FA8kkJAZRCjelwB7m1zhK1RatTx45xlS3I0I21gOURe' // Password123! (bcrypt hash)

    const testUsers: MockUser[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        email: 'test@example.com',
        password: testPassword,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        email: 'admin@example.com',
        password: testPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        email: 'inactive@example.com',
        password: testPassword,
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.SUSPENDED,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174004',
        email: 'oauth@example.com',
        password: undefined, // OAuth-only account
        firstName: 'OAuth',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174005',
        email: 'active1@example.com',
        password: testPassword,
        firstName: 'Active',
        lastName: 'One',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174006',
        email: 'active2@example.com',
        password: testPassword,
        firstName: 'Active',
        lastName: 'Two',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]

    // Populate the maps
    testUsers.forEach((user) => {
      this.users.set(user.id, user)
      this.emailToUserId.set(user.email.toLowerCase(), user.id)
    })
  }

  // Override UserServiceClient methods
  async getUser(userId: string): Promise<any> {
    const user = this.users.get(userId)

    if (!user) {
      throw new Error('User not found')
    }

    return this.mapUserToResponse(user)
  }

  async getUserByEmail(email: string): Promise<any> {
    const userId = this.emailToUserId.get(email.toLowerCase())

    if (!userId) {
      return null
    }

    const user = this.users.get(userId)

    return user ? this.mapUserToResponse(user) : null
  }

  // Methods used by UserServiceClientAdapter
  async getUserAuthDataByEmail(email: string): Promise<any> {
    const userId = this.emailToUserId.get(email.toLowerCase())

    if (!userId) {
      return null
    }

    const user = this.users.get(userId)

    return user ? this.mapUserToAuthData(user) : null
  }

  async getUserAuthData(userId: string): Promise<any> {
    const user = this.users.get(userId)

    if (!user) {
      return null
    }

    return this.mapUserToAuthData(user)
  }

  async createUser(data: any): Promise<any> {
    const newUser: MockUser = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: data.email,
      password: data.passwordHash || data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      avatarUrl: data.avatarUrl,
    }

    this.users.set(newUser.id, newUser)
    this.emailToUserId.set(newUser.email.toLowerCase(), newUser.id)

    return this.mapUserToAuthData(newUser)
  }

  async updateUser(userId: string, data: any): Promise<any> {
    const user = this.users.get(userId)

    if (!user) {
      throw new Error('User not found')
    }

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    }

    this.users.set(userId, updatedUser)

    return this.mapUserToResponse(updatedUser)
  }

  async updateLastLogin(
    userId: string,
    data: { lastLoginAt: string },
  ): Promise<void> {
    const user = this.users.get(userId)

    if (user) {
      user.lastLoginAt = new Date(data.lastLoginAt)
      user.updatedAt = new Date()
    }
  }

  async emailExists(email: string): Promise<boolean> {
    return this.emailToUserId.has(email.toLowerCase())
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    // Simple check - in real implementation would be more sophisticated
    return Array.from(this.users.values()).some(
      (user) => user.phoneNumber === phoneNumber,
    )
  }

  async updatePassword(data: {
    userId: string
    passwordHash: string
  }): Promise<void> {
    const user = this.users.get(data.userId)

    if (user) {
      user.password = data.passwordHash
      user.updatedAt = new Date()
    }
  }

  async verifyEmail(data: { userId: string }): Promise<void> {
    const user = this.users.get(data.userId)

    if (user) {
      user.emailVerified = true
      user.updatedAt = new Date()
    }
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.passwordResetTokens.set(token, userId)

    return token
  }

  async validatePasswordResetToken(data: {
    token: string
  }): Promise<string | null> {
    return this.passwordResetTokens.get(data.token) || null
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    this.passwordResetTokens.delete(token)
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.emailVerificationTokens.set(token, userId)

    return token
  }

  async validateEmailVerificationToken(token: string): Promise<string | null> {
    return this.emailVerificationTokens.get(token) || null
  }

  // Helper method to map internal user to response format
  private mapUserToResponse(user: MockUser): any {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
      isActive: () => user.status === UserStatus.ACTIVE,
    }
  }

  // Helper method to map internal user to auth data format (used by adapter)
  private mapUserToAuthData(user: MockUser): any {
    const authData = {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
    }

    return authData
  }

  // Method to add test users dynamically if needed
  addTestUser(user: Partial<MockUser> & { email: string }): MockUser {
    const newUser: MockUser = {
      id: user.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: user.email,
      password: user.password,
      firstName: user.firstName || 'Test',
      lastName: user.lastName || 'User',
      role: user.role || UserRole.CUSTOMER,
      status: user.status || UserStatus.ACTIVE,
      emailVerified: user.emailVerified ?? true,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
      lastLoginAt: user.lastLoginAt,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      avatarUrl: user.avatarUrl,
    }

    this.users.set(newUser.id, newUser)
    this.emailToUserId.set(newUser.email.toLowerCase(), newUser.id)

    return newUser
  }

  // Method to clear all data (useful for test cleanup)
  clearAll(): void {
    this.users.clear()
    this.emailToUserId.clear()
    this.passwordResetTokens.clear()
    this.emailVerificationTokens.clear()
    this.initializeMockData()
  }
}
