import { UserRole, UserStatus } from '@pika/types'

import type { UserServiceUser } from '../strategies/LocalAuthStrategy.js'

/**
 * Maps user data to UserServiceUser interface
 */
export function mapToUserServiceUser(user: {
  id: string
  email: string
  password?: string | null
  firstName: string
  lastName: string
  role: string | UserRole
  status: string | UserStatus
  emailVerified: boolean
  createdAt: Date | string
  lastLoginAt?: Date | string | null
}): UserServiceUser {
  return {
    id: user.id,
    email: user.email,
    password: user.password ?? undefined,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    emailVerified: user.emailVerified,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt
        : new Date(user.createdAt),
    lastLoginAt: user.lastLoginAt
      ? user.lastLoginAt instanceof Date
        ? user.lastLoginAt
        : new Date(user.lastLoginAt)
      : undefined,
    isActive: () => user.status === UserStatus.ACTIVE,
  }
}
