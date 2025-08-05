import type { User } from '@pika/types'
import { mapUserRole, mapUserStatus } from '@pika/types'

/**
 * Document type that matches the Prisma User schema
 * Use type definitions rather than importing Prisma models directly
 * to maintain separation of infrastructure from domain
 */
type UserDocument = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  emailVerified: boolean
  phoneVerified: boolean
  role: any // Prisma enum type
  status: any // Prisma enum type
  avatarUrl: string | null
  password: string | null
  lastLoginAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
  // Add any other fields from the Prisma schema
}

/**
 * Maps a Prisma User document to a domain User object
 * This handles the mapping between Prisma's enum types and our application's enum types
 */
export function mapUserToDomain(userDoc: UserDocument): User {
  return {
    id: userDoc.id,
    email: userDoc.email,
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    phoneNumber: userDoc.phoneNumber,
    emailVerified: userDoc.emailVerified,
    phoneVerified: userDoc.phoneVerified,
    avatarUrl: userDoc.avatarUrl,
    // Map Prisma enum string to our application enum
    role: mapUserRole(userDoc.role),
    status: mapUserStatus(userDoc.status),
    lastLoginAt: userDoc.lastLoginAt,
    createdAt: userDoc.createdAt || new Date(),
    updatedAt: userDoc.updatedAt || new Date(),
    deletedAt: userDoc.deletedAt,
  }
}

// Role and status mapping functions are now imported from @pika/types
