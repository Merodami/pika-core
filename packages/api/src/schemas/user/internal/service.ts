import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'
import { DateOnlyString, DateTime } from '../../shared/primitives.js'
import { UserRoleSchema, UserStatusSchema } from '../common/enums.js'

/**
 * Internal user service schemas for service-to-service communication
 */

// ============= User Data for Services =============

/**
 * Internal user data
 */
export const InternalUserData = openapi(
  z.object({
    id: UserId,
    email: Email,
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    role: UserRoleSchema,
    createdAt: DateTime,

    // Service-specific flags
    canMakePayments: z.boolean().default(true),
    canBookSessions: z.boolean().default(true),
    hasValidSubscription: z.boolean().default(false),

    // Stripe info
    stripeCustomerId: z.string().optional(),

    // Settings
    language: z.string().length(2).default('en'),
    timezone: z.string().default('UTC'),
    notificationPreferences: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }),
  }),
  {
    description: 'Internal user data for services',
  },
)

export type InternalUserData = z.infer<typeof InternalUserData>

// ============= User Verification =============

/**
 * Verify user request
 */
export const VerifyUserRequest = openapi(
  z.object({
    userId: UserId,
    verificationType: z.enum(['EMAIL', 'PHONE', 'IDENTITY']),
  }),
  {
    description: 'Verify user for internal services',
  },
)

export type VerifyUserRequest = z.infer<typeof VerifyUserRequest>

/**
 * Verify user response
 */
export const VerifyUserResponse = openapi(
  z.object({
    userId: UserId,
    exists: z.boolean(),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    verificationLevel: z.enum(['NONE', 'EMAIL', 'PHONE', 'FULL']),
  }),
  {
    description: 'User verification response',
  },
)

export type VerifyUserResponse = z.infer<typeof VerifyUserResponse>

// ============= Batch User Operations =============

/**
 * Get multiple users request
 */
export const GetUsersRequest = openapi(
  z.object({
    userIds: z.array(UserId).min(1).max(100),
    fields: z
      .array(z.string())
      .optional()
      .describe('Specific fields to return'),
  }),
  {
    description: 'Get multiple users by ID',
  },
)

export type GetUsersRequest = z.infer<typeof GetUsersRequest>

/**
 * Get multiple users response
 */
export const GetUsersResponse = openapi(
  z.object({
    users: z.array(InternalUserData),
    notFound: z.array(UserId).optional(),
  }),
  {
    description: 'Multiple users data',
  },
)

export type GetUsersResponse = z.infer<typeof GetUsersResponse>

// ============= User Credit Operations =============

/**
 * Update user credits request
 */
export const UpdateUserCreditsRequest = openapi(
  z.object({
    userId: UserId,
    amount: z.number().int(),
    operation: z.enum(['ADD', 'SUBTRACT', 'SET']),
    reason: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Update user credit balance',
  },
)

export type UpdateUserCreditsRequest = z.infer<typeof UpdateUserCreditsRequest>

/**
 * Update user credits response
 */
export const UpdateUserCreditsResponse = openapi(
  z.object({
    userId: UserId,
    previousBalance: z.number().int().nonnegative(),
    newBalance: z.number().int().nonnegative(),
    operation: z.string(),
    timestamp: DateTime,
  }),
  {
    description: 'Credit update result',
  },
)

export type UpdateUserCreditsResponse = z.infer<
  typeof UpdateUserCreditsResponse
>

// ============= User Permissions =============

/**
 * Check user permission request
 */
export const CheckUserPermissionRequest = openapi(
  z.object({
    userId: UserId,
    resource: z.string(),
    action: z.enum(['READ', 'CREATE', 'UPDATE', 'DELETE']),
    resourceId: z.string().optional(),
  }),
  {
    description: 'Check user permission',
  },
)

export type CheckUserPermissionRequest = z.infer<
  typeof CheckUserPermissionRequest
>

/**
 * Check user permission response
 */
export const CheckUserPermissionResponse = openapi(
  z.object({
    allowed: z.boolean(),
    reason: z.string().optional(),
  }),
  {
    description: 'Permission check result',
  },
)

export type CheckUserPermissionResponse = z.infer<
  typeof CheckUserPermissionResponse
>

// ============= User Subscription Status =============

/**
 * Get user subscription status
 */
export const GetUserSubscriptionStatusRequest = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Get user subscription status',
  },
)

export type GetUserSubscriptionStatusRequest = z.infer<
  typeof GetUserSubscriptionStatusRequest
>

/**
 * User subscription status response
 */
export const UserSubscriptionStatusResponse = openapi(
  z.object({
    userId: UserId,
    hasActiveSubscription: z.boolean(),
    subscriptionType: z.string().optional(),
    expiresAt: DateTime.optional(),
    creditsRemaining: z.number().int().nonnegative(),
    canBookSessions: z.boolean(),
  }),
  {
    description: 'User subscription status',
  },
)

export type UserSubscriptionStatusResponse = z.infer<
  typeof UserSubscriptionStatusResponse
>

// ============= Auth-Related User Operations =============

/**
 * Get user auth data by email request (internal)
 */
export const GetUserAuthDataByEmailRequest = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Get user auth data by email for authentication',
  },
)

export type GetUserAuthDataByEmailRequest = z.infer<
  typeof GetUserAuthDataByEmailRequest
>

/**
 * User auth data response
 */
export const UserAuthData = openapi(
  z.object({
    id: UserId,
    email: Email,
    password: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    role: UserRoleSchema,
    status: UserStatusSchema,
    emailVerified: z.boolean(),
    createdAt: DateTime,
    lastLoginAt: DateTime.optional(),
  }),
  {
    description: 'User data for authentication',
  },
)

export type UserAuthData = z.infer<typeof UserAuthData>

/**
 * Create user request (for registration)
 */
export const CreateUserRequest = openapi(
  z.object({
    email: Email,
    passwordHash: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnlyString.optional(),
    acceptTerms: z.boolean(),
    marketingConsent: z.boolean().optional(),
    role: UserRoleSchema,
    avatarUrl: z.string().url().optional(),
  }),
  {
    description: 'Create new user for registration with full profile data',
  },
)

export type CreateUserRequest = z.infer<typeof CreateUserRequest>

/**
 * Update last login request
 */
export const UpdateLastLoginRequest = openapi(
  z.object({
    loginTime: DateTime.optional(),
  }),
  {
    description: 'Update user last login timestamp',
  },
)

export type UpdateLastLoginRequest = z.infer<typeof UpdateLastLoginRequest>

/**
 * Password reset token request
 */
export const CreatePasswordResetTokenRequest = openapi(z.object({}), {
  description: 'Create password reset token',
})

export type CreatePasswordResetTokenRequest = z.infer<
  typeof CreatePasswordResetTokenRequest
>

/**
 * Password reset token response
 */
export const PasswordResetTokenResponse = openapi(
  z.object({
    token: z.string(),
    expiresAt: DateTime,
  }),
  {
    description: 'Password reset token',
  },
)

export type PasswordResetTokenResponse = z.infer<
  typeof PasswordResetTokenResponse
>

/**
 * Validate password reset token request
 */
export const ValidatePasswordResetTokenRequest = openapi(
  z.object({
    token: z.string(),
  }),
  {
    description: 'Validate password reset token',
  },
)

export type ValidatePasswordResetTokenRequest = z.infer<
  typeof ValidatePasswordResetTokenRequest
>

/**
 * Update password request
 */
export const UpdatePasswordRequest = openapi(
  z.object({
    userId: UserId,
    passwordHash: z.string(),
  }),
  {
    description: 'Update user password',
  },
)

export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequest>

/**
 * Email verification token request
 */
export const CreateEmailVerificationTokenRequest = openapi(z.object({}), {
  description: 'Create email verification token',
})

export type CreateEmailVerificationTokenRequest = z.infer<
  typeof CreateEmailVerificationTokenRequest
>

/**
 * Email verification token response
 */
export const EmailVerificationTokenResponse = openapi(
  z.object({
    token: z.string(),
    expiresAt: DateTime,
  }),
  {
    description: 'Email verification token',
  },
)

export type EmailVerificationTokenResponse = z.infer<
  typeof EmailVerificationTokenResponse
>

/**
 * Validate email verification token request
 */
export const ValidateEmailVerificationTokenRequest = openapi(
  z.object({
    token: z.string(),
  }),
  {
    description: 'Validate email verification token',
  },
)

export type ValidateEmailVerificationTokenRequest = z.infer<
  typeof ValidateEmailVerificationTokenRequest
>

/**
 * Verify email request
 */
export const VerifyEmailRequest = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Mark user email as verified',
  },
)

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequest>

/**
 * Check email/phone exists requests
 */
export const CheckEmailExistsRequest = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Check if email already exists',
  },
)

export type CheckEmailExistsRequest = z.infer<typeof CheckEmailExistsRequest>

export const CheckPhoneExistsRequest = openapi(
  z.object({
    phoneNumber: z.string(),
  }),
  {
    description: 'Check if phone number already exists',
  },
)

export type CheckPhoneExistsRequest = z.infer<typeof CheckPhoneExistsRequest>

export const ExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
  }),
  {
    description: 'Resource exists response',
  },
)

export type ExistsResponse = z.infer<typeof ExistsResponse>

/**
 * Common path parameters
 */
export const UserIdParam = openapi(
  z.object({
    id: UserId,
  }),
  {
    description: 'User ID path parameter',
  },
)

export type UserIdParam = z.infer<typeof UserIdParam>

export const EmailParam = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Email path parameter',
  },
)

export type EmailParam = z.infer<typeof EmailParam>

export const PhoneParam = openapi(
  z.object({
    phone: z.string(),
  }),
  {
    description: 'Phone number path parameter',
  },
)

export type PhoneParam = z.infer<typeof PhoneParam>

// ============= Additional Missing Schemas =============

/**
 * Token response for password reset/email verification
 */
export const TokenResponse = openapi(
  z.object({
    token: z.string(),
    expiresAt: DateTime,
  }),
  {
    description: 'Token response',
  },
)

export type TokenResponse = z.infer<typeof TokenResponse>

/**
 * Validate token response
 */
export const ValidateTokenResponse = openapi(
  z.object({
    valid: z.boolean(),
    userId: UserId.optional(),
  }),
  {
    description: 'Token validation response',
  },
)

export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponse>

/**
 * Success response for operations
 */
export const SuccessResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
  }),
  {
    description: 'Success response',
  },
)

export type SuccessResponse = z.infer<typeof SuccessResponse>
