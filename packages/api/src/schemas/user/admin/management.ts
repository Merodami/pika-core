import {
  UserRole as UserRoleEnum,
  UserStatus as UserStatusEnum,
} from '@pika/types'
import { AdminUserSortBy as AdminUserSortByEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateOnly, DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { UserRoleSchema, UserStatusSchema } from '../common/enums.js'
import { AdminUserSortBySchema } from '../common/enums.js'

/**
 * Admin user management schemas
 */

// ============= Enums =============
// Note: UserRole and UserStatus are now imported from common/schemas/enums.ts

export const AccountFlag = z.enum([
  'VERIFIED',
  'PREMIUM',
  'SUSPICIOUS',
  'REPORTED',
  'VIP',
])
export type AccountFlag = z.infer<typeof AccountFlag>

// ============= Admin User View =============

/**
 * Detailed user information for admin
 */
export const AdminUserDetailResponse = openapi(
  withTimestamps({
    id: UserId,
    email: Email,
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    avatarUrl: z.string().url().optional(),
    status: UserStatusSchema,
    role: UserRoleSchema,

    // Verification info (only fields that exist in database)
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),

    // Account info (only fields that exist in database)
    lastLoginAt: DateTime.optional(),
  }),
  {
    description: 'Detailed user information for admin',
  },
)

export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponse>

// ============= User Search =============

/**
 * Admin user search parameters
 */
export const AdminUserQueryParams = z.object({
  search: z.string().optional().describe('Search in name, email, phone'),
  email: Email.optional(),
  status: UserStatusSchema.optional(),
  role: UserRoleSchema.optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  registeredFrom: DateTime.optional(),
  registeredTo: DateTime.optional(),
  lastLoginFrom: DateTime.optional(),
  lastLoginTo: DateTime.optional(),
  minSpent: z.number().nonnegative().optional(),
  maxSpent: z.number().nonnegative().optional(),
  hasReports: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: AdminUserSortBySchema.default(AdminUserSortByEnum.CREATED_AT),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type AdminUserQueryParams = z.infer<typeof AdminUserQueryParams>

/**
 * Admin user list response
 */
export const AdminUserListResponse = paginatedResponse(AdminUserDetailResponse)

export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>

// ============= User Actions =============

/**
 * Update user status request
 */
export const UpdateUserStatusRequest = openapi(
  z.object({
    status: UserStatusSchema,
    reason: z.string().max(500).optional(),
    duration: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Suspension duration in days'),
    notifyUser: z.boolean().default(true).optional(),
  }),
  {
    description: 'Update user account status',
  },
)

export type UpdateUserStatusRequest = z.infer<typeof UpdateUserStatusRequest>

/**
 * Update user role request
 */
export const UpdateUserRoleRequest = openapi(
  z.object({
    role: UserRoleSchema,
    reason: z.string().max(500),
  }),
  {
    description: 'Update user role',
  },
)

export type UpdateUserRoleRequest = z.infer<typeof UpdateUserRoleRequest>

/**
 * Add user flag request
 */
export const AddUserFlagRequest = openapi(
  z.object({
    flag: AccountFlag,
    reason: z.string().max(500).optional(),
  }),
  {
    description: 'Add flag to user account',
  },
)

export type AddUserFlagRequest = z.infer<typeof AddUserFlagRequest>

/**
 * Admin note request
 */
export const AddAdminNoteRequest = openapi(
  z.object({
    note: z.string().max(2000),
    category: z.enum(['GENERAL', 'SECURITY', 'SUPPORT', 'BILLING']).optional(),
  }),
  {
    description: 'Add admin note to user',
  },
)

export type AddAdminNoteRequest = z.infer<typeof AddAdminNoteRequest>

// ============= User Activity =============

/**
 * User activity log
 */
export const UserActivityLog = z.object({
  id: UUID,
  userId: UserId,
  action: z.string(),
  category: z.enum(['AUTH', 'PROFILE', 'PAYMENT', 'OTHER']),
  details: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: DateTime,
})

export type UserActivityLog = z.infer<typeof UserActivityLog>

/**
 * User activity response
 */
export const UserActivityResponse = paginatedResponse(UserActivityLog)

export type UserActivityResponse = z.infer<typeof UserActivityResponse>

// ============= Bulk Operations =============

/**
 * Bulk user update request
 */
export const BulkUserUpdateRequest = openapi(
  z.object({
    userIds: z.array(UserId).min(1).max(100),
    updates: z.object({
      status: UserStatusSchema.optional(),
      role: UserRoleSchema.optional(),
    }),
    reason: z.string().max(500),
  }),
  {
    description: 'Update multiple users at once',
  },
)

export type BulkUserUpdateRequest = z.infer<typeof BulkUserUpdateRequest>

/**
 * Bulk operation response
 */
export const BulkOperationResponse = z.object({
  successful: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        userId: UserId,
        error: z.string(),
      }),
    )
    .optional(),
})

export type BulkOperationResponse = z.infer<typeof BulkOperationResponse>

// Missing schemas for admin-api.ts
export const AdminCreateUserRequest = openapi(
  z.object({
    email: Email,
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    phoneNumber: z.string().min(1),
    dateOfBirth: DateOnly.optional(),
    role: UserRoleSchema.default(UserRoleEnum.CUSTOMER),
    status: UserStatusSchema.default(UserStatusEnum.UNCONFIRMED),
    appVersion: z.string().optional(),
    alias: z.string().optional(),
  }),
  {
    description: 'Create a new user (admin only)',
  },
)

export type AdminCreateUserRequest = z.infer<typeof AdminCreateUserRequest>

export const AdminUpdateUserRequest = openapi(
  z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    appVersion: z.string().optional(),
    alias: z.string().optional(),
    activeMembership: z.boolean().optional(),
    // For PROFESSIONAL role
    description: z.string().optional(),
    specialties: z.array(z.string()).optional(),
  }),
  {
    description: 'Update user information (admin)',
  },
)

export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequest>

export const BanUserRequest = openapi(
  z
    .object({
      reason: z.string().min(1).max(500).optional(),
      duration: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Ban duration in days'),
      notifyUser: z.boolean().default(true).optional(),
    })
    .optional()
    .default({}),
  {
    description: 'Ban a user',
  },
)

export type BanUserRequest = z.infer<typeof BanUserRequest>

export const UnbanUserRequest = openapi(
  z
    .object({
      reason: z.string().min(1).max(500).optional(),
      notifyUser: z.boolean().default(true).optional(),
    })
    .optional()
    .default({}),
  {
    description: 'Unban a user',
  },
)

export type UnbanUserRequest = z.infer<typeof UnbanUserRequest>

export const AdminUploadUserAvatarRequest = openapi(
  z.object({
    file: z.any().describe('Avatar image file (multipart/form-data)'),
  }),
  {
    description: 'Upload avatar for a user (admin only)',
  },
)

export type AdminUploadUserAvatarRequest = z.infer<
  typeof AdminUploadUserAvatarRequest
>

export const AdminUploadUserAvatarResponse = openapi(
  z.object({
    avatarUrl: z.string().url().describe('URL of the uploaded avatar'),
  }),
  {
    description: 'Avatar upload response',
  },
)

export type AdminUploadUserAvatarResponse = z.infer<
  typeof AdminUploadUserAvatarResponse
>

/**
 * Update current admin user profile request
 */
export const UpdateAdminProfileRequest = openapi(
  z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    avatarUrl: z.string().url().optional(),
    // Admin-specific fields
  }),
  {
    description: 'Update current admin user profile',
  },
)

export type UpdateAdminProfileRequest = z.infer<
  typeof UpdateAdminProfileRequest
>

export const UserStatsResponse = openapi(
  z.object({
    userId: UserId,
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    totalBookings: z.number().int().nonnegative(),
    creditsBalance: z.number().int().nonnegative(),
    friendsCount: z.number().int().nonnegative(),
    followersCount: z.number().int().nonnegative(),
    reportsCount: z.number().int().nonnegative(),
    activityScore: z.number().min(0).max(100),
    lastActiveDate: DateTime.optional(),
  }),
  {
    description: 'User statistics for admin view',
  },
)

export type UserStatsResponse = z.infer<typeof UserStatsResponse>

export const BulkUserActionRequest = BulkUserUpdateRequest
export type BulkUserActionRequest = z.infer<typeof BulkUserActionRequest>

// ============= Verification Status =============

/**
 * User verification status response
 */
export const UserVerificationStatusResponse = openapi(
  z.object({
    userId: UserId,
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    verificationDate: DateTime.optional(),
  }),
  {
    description: 'User verification status information',
  },
)

export type UserVerificationStatusResponse = z.infer<
  typeof UserVerificationStatusResponse
>

// ============= Additional Missing Schemas =============

/**
 * Verify user response for admin operations
 */
export const VerifyUserResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
    user: AdminUserDetailResponse.optional(),
  }),
  {
    description: 'User verification response',
  },
)

export type VerifyUserResponse = z.infer<typeof VerifyUserResponse>

/**
 * Resend verification response
 */
export const ResendVerificationResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().default('Verification email sent'),
  }),
  {
    description: 'Resend verification response',
  },
)

export type ResendVerificationResponse = z.infer<
  typeof ResendVerificationResponse
>
