import {
  AccountFlag as AccountFlagEnum,
  AdminNoteCategory as AdminNoteCategoryEnum,
  AdminUserSortBy as AdminUserSortByEnum,
  SortOrder as SortOrderEnum,
  UserActivityCategory as UserActivityCategoryEnum,
  UserRole as UserRoleEnum,
  UserSortBy as UserSortByEnum,
  UserStatus as UserStatusEnum,
  VerificationStatus as VerificationStatusEnum,
  VerificationType as VerificationTypeEnum,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * User-specific enum schemas
 * Following the standardized pattern with Schema suffix
 */

// User sort by schema
export const UserSortBySchema = openapi(createZodEnum(UserSortByEnum), {
  description: 'Field to sort users by',
  example: UserSortByEnum.NAME,
})

// User role schema
export const UserRoleSchema = openapi(createZodEnum(UserRoleEnum), {
  description: 'User role in the system',
  example: UserRoleEnum.CUSTOMER,
})

// User status schema
export const UserStatusSchema = openapi(createZodEnum(UserStatusEnum), {
  description: 'User account status',
  example: UserStatusEnum.ACTIVE,
})

// API-specific status filter (includes composite filters)
export const UserStatusFilter = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending_verification',
])

export const UserStatusFilterSchema = openapi(UserStatusFilter, {
  description: 'Filter users by status (includes composite filters)',
  example: 'active',
})

// Verification status schema
export const VerificationStatusSchema = openapi(
  createZodEnum(VerificationStatusEnum),
  {
    description: 'Verification status',
    example: VerificationStatusEnum.VERIFIED,
  },
)

// Verification type schema
export const VerificationTypeSchema = openapi(
  createZodEnum(VerificationTypeEnum),
  {
    description: 'Type of verification',
    example: VerificationTypeEnum.EMAIL,
  },
)

// Account flag schema
export const AccountFlagSchema = openapi(createZodEnum(AccountFlagEnum), {
  description: 'Account flag or special property',
  example: AccountFlagEnum.VERIFIED,
})

// Admin user sort by schema
export const AdminUserSortBySchema = openapi(
  createZodEnum(AdminUserSortByEnum),
  {
    description: 'Field to sort users by (admin view)',
    example: AdminUserSortByEnum.CREATED_AT,
  },
)

// Sort order schema
export const SortOrderSchema = openapi(createZodEnum(SortOrderEnum), {
  description: 'Sort order direction',
  example: SortOrderEnum.ASC,
})

// Admin note category schema
export const AdminNoteCategorySchema = openapi(
  createZodEnum(AdminNoteCategoryEnum),
  {
    description: 'Category for admin notes',
    example: AdminNoteCategoryEnum.GENERAL,
  },
)

// User activity category schema
export const UserActivityCategorySchema = openapi(
  createZodEnum(UserActivityCategoryEnum),
  {
    description: 'Category for user activities',
    example: UserActivityCategoryEnum.AUTH,
  },
)

// ============= Profile Enums =============

import {
  CreditOperation as CreditOperationEnum,
  ImageFormat as ImageFormatEnum,
  PermissionAction as PermissionActionEnum,
  ProfileVisibility as ProfileVisibilityEnum,
  Theme as ThemeEnum,
  VerificationLevel as VerificationLevelEnum,
} from '@pika/types'

// Image format schema
export const ImageFormatSchema = openapi(createZodEnum(ImageFormatEnum), {
  description: 'Supported image formats',
  example: ImageFormatEnum.JPEG,
})

// Theme schema
export const ThemeSchema = openapi(createZodEnum(ThemeEnum), {
  description: 'UI theme preference',
  example: ThemeEnum.SYSTEM,
})

// Profile visibility schema
export const ProfileVisibilitySchema = openapi(
  createZodEnum(ProfileVisibilityEnum),
  {
    description: 'Profile visibility setting',
    example: ProfileVisibilityEnum.PUBLIC,
  },
)

// ============= Internal Service Enums =============

// Keep internal verification type as is since it's different from domain VerificationType
export const InternalVerificationType = z.enum(['email', 'phone', 'identity'])

export const InternalVerificationTypeSchema = openapi(
  InternalVerificationType,
  {
    description: 'Internal verification type for services',
    example: 'email',
  },
)

// Verification level schema
export const VerificationLevelSchema = openapi(
  createZodEnum(VerificationLevelEnum),
  {
    description: 'Account verification level',
    example: VerificationLevelEnum.EMAIL,
  },
)

// Credit operation schema
export const CreditOperationSchema = openapi(
  createZodEnum(CreditOperationEnum),
  {
    description: 'Credit balance operation type',
    example: CreditOperationEnum.ADD,
  },
)

// Permission action schema
export const PermissionActionSchema = openapi(
  createZodEnum(PermissionActionEnum),
  {
    description: 'Permission action for access control',
    example: PermissionActionEnum.READ,
  },
)
