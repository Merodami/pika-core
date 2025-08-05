/**
 * Auth Service Test Helpers
 *
 * Shared test utilities and data factories for auth integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test users with proper password hashing
 * - Supports various user states (active/inactive, verified/unverified)
 * - Provides shared test data for efficient test execution
 * - Handles OAuth-only users (no password)
 */

import { UserRole, UserStatus } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

export interface AuthTestData {
  users: any[]
  passwordPlaintext: string
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedAuthTestData {
  // Users by type
  activeUsers: any[]
  inactiveUsers: any[]
  adminUsers: any[]
  oauthUsers: any[]

  // Specific test users
  testUser: any
  adminUser: any
  inactiveUser: any
  oauthOnlyUser: any

  // Quick access
  allUsers: any[]
  userById: Map<string, any>
  userByEmail: Map<string, any>

  // Test password (plaintext)
  testPassword: string
}

export interface SeedAuthUsersOptions {
  count?: number
  includeInactive?: boolean
  includeOAuthOnly?: boolean
  includeAdmin?: boolean
  password?: string
}

/**
 * Factory function to create test users with proper password hashing
 *
 * @param prismaClient - Prisma client instance
 * @param options - Options for generating test data
 * @returns Object containing created users and plaintext password
 */
export async function seedTestAuthUsers(
  prismaClient: PrismaClient,
  options: SeedAuthUsersOptions = {},
): Promise<AuthTestData> {
  const {
    count = 3,
    includeInactive = false,
    includeOAuthOnly = false,
    includeAdmin = false,
    password = 'Password123!',
  } = options

  const hashedPassword = await bcrypt.hash(password, 10)
  const users = []

  // Generate regular active users
  for (let i = 0; i < count; i++) {
    const user = await prismaClient.user.create({
      data: {
        id: uuid(),
        email: `user${i + 1}@test.com`,
        password: hashedPassword,
        firstName: 'Test',
        lastName: `User ${i + 1}`,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    users.push(user)
  }

  // Add inactive user if requested
  if (includeInactive) {
    const inactiveUser = await prismaClient.user.create({
      data: {
        id: uuid(),
        email: 'inactive@test.com',
        password: hashedPassword,
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.SUSPENDED,
        emailVerified: true,
      },
    })

    users.push(inactiveUser)
  }

  // Add OAuth-only user if requested
  if (includeOAuthOnly) {
    const oauthUser = await prismaClient.user.create({
      data: {
        id: uuid(),
        email: 'oauth@test.com',
        firstName: 'OAuth',
        lastName: 'User',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        // No password field
      },
    })

    users.push(oauthUser)
  }

  // Add admin user if requested
  if (includeAdmin) {
    const adminUser = await prismaClient.user.create({
      data: {
        id: uuid(),
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    users.push(adminUser)
  }

  return {
    users,
    passwordPlaintext: password,
  }
}

/**
 * Factory function to create shared auth test data
 * This creates a comprehensive set of test users for all auth tests
 */
export async function createSharedAuthTestData(
  prismaClient: PrismaClient,
): Promise<SharedAuthTestData> {
  const testPassword = 'Password123!'
  const hashedPassword = await bcrypt.hash(testPassword, 10)

  // Create specific test users
  const testUser = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  })

  const adminUser = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  })

  const inactiveUser = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: 'inactive@example.com',
      password: hashedPassword,
      firstName: 'Inactive',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      status: UserStatus.SUSPENDED,
      emailVerified: true,
    },
  })

  const oauthOnlyUser = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: 'oauth@example.com',
      firstName: 'OAuth',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      // No password
    },
  })

  // Create additional test users
  const additionalActiveUsers = []

  for (let i = 0; i < 3; i++) {
    const user = await prismaClient.user.create({
      data: {
        id: uuid(),
        email: `active${i + 1}@example.com`,
        password: hashedPassword,
        firstName: 'Active',
        lastName: `User ${i + 1}`,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    additionalActiveUsers.push(user)
  }

  // Organize users by type
  const activeUsers = [testUser, ...additionalActiveUsers]
  const inactiveUsers = [inactiveUser]
  const adminUsers = [adminUser]
  const oauthUsers = [oauthOnlyUser]
  const allUsers = [
    ...activeUsers,
    ...inactiveUsers,
    ...adminUsers,
    ...oauthUsers,
  ]

  // Create lookup maps
  const userById = new Map(allUsers.map((user) => [user.id, user]))
  const userByEmail = new Map(allUsers.map((user) => [user.email, user]))

  return {
    // Users by type
    activeUsers,
    inactiveUsers,
    adminUsers,
    oauthUsers,

    // Specific test users
    testUser,
    adminUser,
    inactiveUser,
    oauthOnlyUser,

    // Quick access
    allUsers,
    userById,
    userByEmail,

    // Test password
    testPassword,
  }
}

/**
 * Factory function to create a single test user
 */
export async function createTestUser(
  prismaClient: PrismaClient,
  options: {
    email?: string
    password?: string
    role?: string
    status?: string
    emailVerified?: boolean
  } = {},
) {
  const {
    email = `test-${uuid()}@example.com`,
    password = 'Password123!',
    role = UserRole.CUSTOMER,
    status = UserStatus.ACTIVE,
    emailVerified = true,
  } = options

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined

  return await prismaClient.user.create({
    data: {
      id: uuid(),
      email,
      ...(hashedPassword && { password: hashedPassword }),
      firstName: 'Test',
      lastName: 'User',
      role,
      status,
      emailVerified,
    },
  })
}

/**
 * Helper to clean up test users (if needed)
 * Note: Usually not needed if using test database cleanup
 */
export async function cleanupTestUsers(
  prismaClient: PrismaClient,
  userIds: string[],
) {
  if (userIds.length === 0) return

  await prismaClient.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  })
}
