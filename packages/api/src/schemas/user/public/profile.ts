import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'
import {
  DateOnly,
  DateTime,
  LanguageCode,
  PhoneNumber,
} from '../../shared/primitives.js'
import { UserRoleSchema, UserStatusSchema } from '../common/enums.js'

/**
 * User profile schemas for public API
 */

// ============= Public User Profile =============

/**
 * Public user profile (excludes sensitive fields)
 */
export const PublicUserProfile = openapi(
  z.object({
    id: UserId,
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    displayName: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    // Public fields only - no email, phone, role, status
    createdAt: DateTime,
  }),
  {
    description: 'Public user profile information',
  },
)

export type PublicUserProfile = z.infer<typeof PublicUserProfile>

// ============= Current User Profile =============

/**
 * Current user profile (includes private fields for the authenticated user)
 */
export const CurrentUserProfile = openapi(
  z.object({
    id: UserId,
    email: Email,
    firstName: z.string().max(50),
    lastName: z.string().max(50),
    displayName: z.string().max(100).optional(),
    phoneNumber: PhoneNumber.optional(),
    avatarUrl: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    dateOfBirth: DateOnly.optional(),
    preferredLanguage: LanguageCode.optional(),
    role: UserRoleSchema,
    status: UserStatusSchema,
    emailVerified: z.boolean(),
    phoneVerified: z.boolean().optional(),
    createdAt: DateTime,
    updatedAt: DateTime,
    lastLoginAt: DateTime.optional(),
  }),
  {
    description: "Authenticated user's complete profile",
  },
)

export type CurrentUserProfile = z.infer<typeof CurrentUserProfile>

// ============= Update Profile =============

/**
 * Update profile request
 */
export const UpdateProfileRequest = openapi(
  z
    .object({
      firstName: z.string().max(50).optional(),
      lastName: z.string().max(50).optional(),
      displayName: z.string().max(100).optional(),
      phoneNumber: PhoneNumber.optional(),
      bio: z.string().max(500).optional(),
      dateOfBirth: DateOnly.optional(),
      preferredLanguage: LanguageCode.optional(),
    })
    .refine((data) => Object.values(data).some((val) => val !== undefined), {
      message: 'At least one field must be provided',
    }),
  {
    description: 'Fields that can be updated by the user',
  },
)

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequest>

/**
 * User profile response (alias for current user profile)
 */
export const UserProfileResponse = CurrentUserProfile

export type UserProfileResponse = z.infer<typeof UserProfileResponse>

// ============= Avatar Upload =============

/**
 * Upload avatar request
 */
export const UploadAvatarRequest = openapi(
  z.object({
    avatar: z.string().describe('Base64 encoded image data or file upload'),
    format: z.enum(['JPEG', 'PNG', 'WEBP']).optional().describe('Image format'),
  }),
  {
    description: 'Upload user avatar/profile picture',
  },
)

export type UploadAvatarRequest = z.infer<typeof UploadAvatarRequest>

/**
 * Upload avatar response
 */
export const UploadAvatarResponse = openapi(
  z.object({
    avatarUrl: z.string().url().describe('URL of the uploaded avatar'),
    message: z.string().default('Avatar uploaded successfully'),
  }),
  {
    description: 'Avatar upload result',
  },
)

export type UploadAvatarResponse = z.infer<typeof UploadAvatarResponse>

// ============= User Preferences =============

/**
 * User preferences
 */
export const UserPreferencesResponse = openapi(
  z.object({
    notifications: z.object({
      email: z.object({
        marketing: z.boolean().default(false),
        bookingReminders: z.boolean().default(true),
        sessionUpdates: z.boolean().default(true),
        friendRequests: z.boolean().default(true),
      }),
      push: z.object({
        bookingReminders: z.boolean().default(true),
        sessionUpdates: z.boolean().default(true),
        friendRequests: z.boolean().default(true),
      }),
    }),
    privacy: z.object({
      profileVisibility: z
        .enum(['PUBLIC', 'FRIENDS', 'PRIVATE'])
        .default('FRIENDS'),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false),
    }),
    display: z.object({
      theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).default('SYSTEM'),
      language: LanguageCode.optional(),
      timezone: z.string().optional(),
    }),
  }),
  {
    description: 'User preferences and settings',
  },
)

export type UserPreferencesResponse = z.infer<typeof UserPreferencesResponse>

/**
 * Update preferences request
 */
export const UpdatePreferencesRequest = openapi(
  z.object({
    notifications: z
      .object({
        email: z
          .object({
            marketing: z.boolean().optional(),
            bookingReminders: z.boolean().optional(),
            sessionUpdates: z.boolean().optional(),
            friendRequests: z.boolean().optional(),
          })
          .optional(),
        push: z
          .object({
            bookingReminders: z.boolean().optional(),
            sessionUpdates: z.boolean().optional(),
            friendRequests: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
    privacy: z
      .object({
        profileVisibility: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
        showEmail: z.boolean().optional(),
        showPhone: z.boolean().optional(),
      })
      .optional(),
    display: z
      .object({
        theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
        language: LanguageCode.optional(),
        timezone: z.string().optional(),
      })
      .optional(),
  }),
  {
    description: 'Update user preferences',
  },
)

export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequest>

// ============= Account Management =============

/**
 * Delete account request
 */
export const DeleteAccountRequest = openapi(
  z.object({
    password: z.string().min(1).describe('Current password for verification'),
    reason: z
      .string()
      .max(500)
      .optional()
      .describe('Optional reason for account deletion'),
    confirmDeletion: z
      .literal(true)
      .refine((val) => val === true, {
        message: 'Must confirm deletion',
      })
      .describe('Must be true to confirm deletion'),
  }),
  {
    description: 'Account deletion request',
  },
)

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequest>

/**
 * Account deletion response
 */
export const DeleteAccountResponse = openapi(
  z.object({
    message: z
      .string()
      .default(
        'Account deletion scheduled. You will receive a confirmation email.',
      ),
    deletionDate: DateTime.describe(
      'When the account will be permanently deleted',
    ),
  }),
  {
    description: 'Account deletion confirmation',
  },
)

export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponse>

// ============= Additional Missing Schemas =============

/**
 * User response for public endpoints
 */
export const UserResponse = CurrentUserProfile

export type UserResponse = z.infer<typeof UserResponse>

/**
 * User friends response
 */
export const UserFriendsResponse = openapi(
  z.object({
    friends: z.array(PublicUserProfile),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'User friends list',
  },
)

export type UserFriendsResponse = z.infer<typeof UserFriendsResponse>
