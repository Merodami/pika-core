/**
 * User Service Test Helpers
 *
 * Shared test utilities and data factories for user integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper user roles and statuses
 * - Supports various user states (active/inactive, verified/unverified)
 * - Provides shared test data for efficient test execution
 * - Handles password hashing and proper user data structure
 */

import { UserRole, UserStatus } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuid } from 'uuid'

/**
 * Helper to generate user status based on index and flags
 */
function generateUserStatus(
  index: number,
  generateUnconfirmed: boolean,
  generateInactive: boolean,
): UserStatus {
  if (generateUnconfirmed && index % 3 === 0) {
    return UserStatus.UNCONFIRMED
  }
  if (generateInactive && index % 2 === 0) {
    return UserStatus.SUSPENDED
  }

  return UserStatus.ACTIVE
}

/**
 * Helper to generate verification status
 */
function generateVerificationStatus(
  index: number,
  generateUnverified: boolean,
): { emailVerified: boolean; phoneVerified: boolean } {
  return {
    emailVerified: generateUnverified ? index % 2 === 0 : true,
    phoneVerified: generateUnverified ? index % 3 === 0 : false,
  }
}

export interface UserTestData {
  users: any[]
  adminUsers?: any[]
  businessUsers?: any[]
  customerUsers?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedUserTestData {
  // Users by role
  adminUsers: any[]
  businessUsers: any[]
  customerUsers: any[]

  // Users by status
  activeUsers: any[]
  suspendedUsers: any[]
  unconfirmedUsers: any[]

  // Users by verification state
  emailVerifiedUsers: any[]
  emailUnverifiedUsers: any[]
  phoneVerifiedUsers: any[]
  phoneUnverifiedUsers: any[]

  // Quick access
  allUsers: any[]
  userById: Map<string, any>
  userByEmail: Map<string, any>
}

export interface SeedUserOptions {
  generateInactive?: boolean
  generateUnverified?: boolean
  generateUnconfirmed?: boolean
  count?: number
  role?: UserRole
  includePassword?: boolean
}

/**
 * Factory function to create test users with proper data
 *
 * @param prismaClient - Prisma client instance
 * @param options - Options for generating test data
 * @returns Object containing created users organized by type
 */
export async function seedTestUsers(
  prismaClient: PrismaClient,
  options: SeedUserOptions = {},
): Promise<UserTestData> {
  const {
    generateInactive = false,
    generateUnverified = false,
    generateUnconfirmed = false,
    count = 5,
    role = UserRole.CUSTOMER,
    includePassword = true,
  } = options

  const users = []
  const adminUsers = []
  const businessUsers = []
  const customerUsers = []

  // Generate test users
  for (let i = 0; i < count; i++) {
    const userRole =
      role === UserRole.CUSTOMER && i === 0 ? UserRole.ADMIN : role
    const timestamp = Date.now()

    const userData = {
      id: uuid(),
      email: `testuser${timestamp}-${i}@example.com`,
      firstName: `Test${i}`,
      lastName: `User${i}`,
      phoneNumber: `+123456789${i}${timestamp.toString().slice(-3)}`,
      role: userRole,
      status: generateUserStatus(i, generateUnconfirmed, generateInactive),
      ...generateVerificationStatus(i, generateUnverified),
      ...(includePassword && {
        password: await bcrypt.hash('TestPassword123!', 10),
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt:
        i % 2 === 0 ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
    }

    const user = await prismaClient.user.create({
      data: userData as any,
    })

    users.push(user)

    // Organize by role
    switch (userRole) {
      case UserRole.ADMIN:
        adminUsers.push(user)
        break
      case UserRole.BUSINESS:
        businessUsers.push(user)
        break
      case UserRole.CUSTOMER:
        customerUsers.push(user)
        break
    }
  }

  return { users, adminUsers, businessUsers, customerUsers }
}

/**
 * Factory function to create a single test user
 */
export async function createTestUser(
  prismaClient: PrismaClient,
  options: {
    email?: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
    role?: UserRole
    status?: UserStatus
    emailVerified?: boolean
    phoneVerified?: boolean
    includePassword?: boolean
    password?: string
  } = {},
) {
  const timestamp = Date.now()
  const {
    email = `user${timestamp}@test.com`,
    firstName = 'Test',
    lastName = 'User',
    phoneNumber = `+1234567${timestamp.toString().slice(-3)}`,
    role = UserRole.CUSTOMER,
    status = UserStatus.ACTIVE,
    emailVerified = true,
    phoneVerified = false,
    includePassword = true,
    password = 'TestPassword123!',
  } = options

  const userData = {
    id: uuid(),
    email,
    firstName,
    lastName,
    phoneNumber,
    role,
    status,
    emailVerified,
    phoneVerified,
    ...(includePassword && {
      password: await bcrypt.hash(password, 10),
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return await prismaClient.user.create({
    data: userData as any,
  })
}

/**
 * Generic factory function to create user with specific role
 */
function createTestUserWithRole(role: UserRole, defaultEmailVerified = true) {
  return async (
    prismaClient: PrismaClient,
    options: Partial<Parameters<typeof createTestUser>[1]> = {},
  ) => {
    const defaults: Partial<Parameters<typeof createTestUser>[1]> = {
      role,
    }

    if (defaultEmailVerified && role !== UserRole.CUSTOMER) {
      defaults.emailVerified = true
    }

    return createTestUser(prismaClient, {
      ...defaults,
      ...options,
    })
  }
}

/**
 * Factory function to create admin user
 */
export const createTestAdminUser = createTestUserWithRole(UserRole.ADMIN, true)

/**
 * Factory function to create business user
 */
export const createTestBusinessUser = createTestUserWithRole(
  UserRole.BUSINESS,
  true,
)

/**
 * Factory function to create customer user
 */
export const createTestCustomerUser = createTestUserWithRole(
  UserRole.CUSTOMER,
  false,
)

/**
 * Clean up test data - useful for afterEach hooks
 */
export async function cleanupUserTestData(
  prismaClient: PrismaClient,
  options: {
    preserveE2EUsers?: boolean
    preserveSharedUsers?: boolean
  } = {},
) {
  if (!options.preserveE2EUsers && !options.preserveSharedUsers) {
    // Delete all test users
    await prismaClient.user.deleteMany({})

    return
  }

  // Preserve specific users
  const emailsToPreserve = []

  if (options.preserveE2EUsers) {
    emailsToPreserve.push(
      'admin@e2etest.com',
      'user@e2etest.com',
      'business@e2etest.com',
    )
  }

  if (options.preserveSharedUsers) {
    emailsToPreserve.push(
      ...Array.from({ length: 10 }, (_, i) => `shared-user-${i}@test.com`),
    )
  }

  // Delete users not in preserve list
  await prismaClient.user.deleteMany({
    where: {
      email: {
        notIn: emailsToPreserve,
      },
    },
  })
}

/**
 * Generate test user data without persisting to database
 * Useful for testing DTOs and mappers
 */
export function generateUserTestData(
  options: {
    count?: number
    includeInactive?: boolean
    includeUnverified?: boolean
    role?: UserRole
  } = {},
) {
  const {
    count = 5,
    includeInactive = false,
    includeUnverified = false,
    role = UserRole.CUSTOMER,
  } = options
  const users = []

  for (let i = 0; i < count; i++) {
    const timestamp = Date.now()

    users.push({
      id: uuid(),
      email: `test${timestamp}-${i}@example.com`,
      firstName: `Test${i}`,
      lastName: `User${i}`,
      phoneNumber: `+123456789${i}`,
      role: i === 0 && role === UserRole.CUSTOMER ? UserRole.ADMIN : role,
      status: generateUserStatus(i, false, includeInactive),
      ...generateVerificationStatus(i, includeUnverified),
      password: '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt:
        i % 2 === 0 ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
      deletedAt: null,
    })
  }

  return users
}

/**
 * Create comprehensive shared test data for all tests
 * This creates a variety of users in different states that can be reused
 */
export async function createSharedUserTestData(
  prismaClient: PrismaClient,
): Promise<SharedUserTestData> {
  const adminUsers: any[] = []
  const businessUsers: any[] = []
  const customerUsers: any[] = []
  const activeUsers: any[] = []
  const suspendedUsers: any[] = []
  const unconfirmedUsers: any[] = []
  const emailVerifiedUsers: any[] = []
  const emailUnverifiedUsers: any[] = []
  const phoneVerifiedUsers: any[] = []
  const phoneUnverifiedUsers: any[] = []
  const allUsers: any[] = []
  const userById = new Map<string, any>()
  const userByEmail = new Map<string, any>()

  // Create admin users
  for (let i = 0; i < 2; i++) {
    const user = await createTestAdminUser(prismaClient, {
      email: `admin-shared-${i}@test.com`,
      firstName: `Admin${i}`,
      lastName: 'Shared',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: i === 0,
    })

    adminUsers.push(user)
    activeUsers.push(user)
    emailVerifiedUsers.push(user)
    if (i === 0) phoneVerifiedUsers.push(user)
    else phoneUnverifiedUsers.push(user)
    allUsers.push(user)
    userById.set(user.id, user)
    userByEmail.set(user.email, user)
  }

  // Create business users
  for (let i = 0; i < 3; i++) {
    const user = await createTestBusinessUser(prismaClient, {
      email: `business-shared-${i}@test.com`,
      firstName: `Business${i}`,
      lastName: 'Shared',
      status: i === 2 ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      emailVerified: i !== 1,
      phoneVerified: i === 0,
    })

    businessUsers.push(user)
    if (i !== 2) activeUsers.push(user)
    else suspendedUsers.push(user)
    if (i !== 1) emailVerifiedUsers.push(user)
    else emailUnverifiedUsers.push(user)
    if (i === 0) phoneVerifiedUsers.push(user)
    else phoneUnverifiedUsers.push(user)
    allUsers.push(user)
    userById.set(user.id, user)
    userByEmail.set(user.email, user)
  }

  // Create customer users
  for (let i = 0; i < 5; i++) {
    const user = await createTestCustomerUser(prismaClient, {
      email: `customer-shared-${i}@test.com`,
      firstName: `Customer${i}`,
      lastName: 'Shared',
      status:
        i === 0
          ? UserStatus.UNCONFIRMED
          : i === 4
            ? UserStatus.SUSPENDED
            : UserStatus.ACTIVE,
      emailVerified: i !== 2,
      phoneVerified: i === 1 || i === 3,
    })

    customerUsers.push(user)
    if (i === 0) unconfirmedUsers.push(user)
    else if (i === 4) suspendedUsers.push(user)
    else activeUsers.push(user)
    if (i !== 2) emailVerifiedUsers.push(user)
    else emailUnverifiedUsers.push(user)
    if (i === 1 || i === 3) phoneVerifiedUsers.push(user)
    else phoneUnverifiedUsers.push(user)
    allUsers.push(user)
    userById.set(user.id, user)
    userByEmail.set(user.email, user)
  }

  return {
    adminUsers,
    businessUsers,
    customerUsers,
    activeUsers,
    suspendedUsers,
    unconfirmedUsers,
    emailVerifiedUsers,
    emailUnverifiedUsers,
    phoneVerifiedUsers,
    phoneUnverifiedUsers,
    allUsers,
    userById,
    userByEmail,
  }
}

/**
 * Create test users for authentication/authorization testing
 */
export async function createAuthTestUsers(prismaClient: PrismaClient) {
  const adminUser = await createTestAdminUser(prismaClient, {
    email: 'auth-admin@test.com',
    firstName: 'Auth',
    lastName: 'Admin',
  })

  const businessUser = await createTestBusinessUser(prismaClient, {
    email: 'auth-business@test.com',
    firstName: 'Auth',
    lastName: 'Business',
  })

  const customerUser = await createTestCustomerUser(prismaClient, {
    email: 'auth-customer@test.com',
    firstName: 'Auth',
    lastName: 'Customer',
  })

  const inactiveUser = await createTestCustomerUser(prismaClient, {
    email: 'auth-inactive@test.com',
    firstName: 'Auth',
    lastName: 'Inactive',
    status: UserStatus.SUSPENDED,
  })

  return {
    adminUser,
    businessUser,
    customerUser,
    inactiveUser,
  }
}

/**
 * Create test data for verification scenarios
 */
export async function createVerificationTestUsers(prismaClient: PrismaClient) {
  const unverifiedEmailUser = await createTestCustomerUser(prismaClient, {
    email: 'unverified-email@test.com',
    firstName: 'Unverified',
    lastName: 'Email',
    emailVerified: false,
    status: UserStatus.UNCONFIRMED,
  })

  const unverifiedPhoneUser = await createTestCustomerUser(prismaClient, {
    email: 'unverified-phone@test.com',
    firstName: 'Unverified',
    lastName: 'Phone',
    emailVerified: true,
    phoneVerified: false,
  })

  const fullyVerifiedUser = await createTestCustomerUser(prismaClient, {
    email: 'fully-verified@test.com',
    firstName: 'Fully',
    lastName: 'Verified',
    emailVerified: true,
    phoneVerified: true,
    status: UserStatus.ACTIVE,
  })

  return {
    unverifiedEmailUser,
    unverifiedPhoneUser,
    fullyVerifiedUser,
  }
}
