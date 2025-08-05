import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, JWTToken, UserId } from '../../shared/branded.js'
import { DateTime, UUID } from '../../shared/primitives.js'

/**
 * Internal auth service schemas for service-to-service communication
 */

// ============= Token Validation =============

/**
 * Validate token request
 */
export const ValidateTokenRequest = openapi(
  z.object({
    token: JWTToken,
    checkExpiry: z.boolean().default(true),
    requiredRoles: z.array(z.string()).optional(),
  }),
  {
    description: 'Validate JWT token',
  },
)

export type ValidateTokenRequest = z.infer<typeof ValidateTokenRequest>

/**
 * Token validation response
 */
export const TokenValidationResponse = openapi(
  z.object({
    valid: z.boolean(),
    userId: UserId.optional(),
    email: Email.optional(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    expiresAt: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Token validation result',
  },
)

export type TokenValidationResponse = z.infer<typeof TokenValidationResponse>

// ============= User Lookup =============

/**
 * Get user by email request
 */
export const GetUserByEmailRequest = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Get user by email',
  },
)

export type GetUserByEmailRequest = z.infer<typeof GetUserByEmailRequest>

/**
 * Auth user response
 */
export const AuthUserResponse = openapi(
  z.object({
    id: UserId,
    email: Email,
    emailVerified: z.boolean(),
    roles: z.array(z.string()),
    active: z.boolean(),
    lastLoginAt: DateTime.optional(),
    createdAt: DateTime,
  }),
  {
    description: 'Auth user details',
  },
)

export type AuthUserResponse = z.infer<typeof AuthUserResponse>

// ============= Password Reset =============

/**
 * Initiate password reset request
 */
export const InitiatePasswordResetRequest = openapi(
  z.object({
    email: Email,
    callbackUrl: z.string().url().optional(),
  }),
  {
    description: 'Initiate password reset',
  },
)

export type InitiatePasswordResetRequest = z.infer<
  typeof InitiatePasswordResetRequest
>

/**
 * Password reset response
 */
export const PasswordResetResponse = openapi(
  z.object({
    resetToken: z.string(),
    expiresAt: DateTime,
    emailSent: z.boolean(),
  }),
  {
    description: 'Password reset initiated',
  },
)

export type PasswordResetResponse = z.infer<typeof PasswordResetResponse>

/**
 * Confirm password reset request
 */
export const ConfirmPasswordResetRequest = openapi(
  z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  }),
  {
    description: 'Confirm password reset',
  },
)

export type ConfirmPasswordResetRequest = z.infer<
  typeof ConfirmPasswordResetRequest
>

// ============= Account Verification =============

/**
 * Verify account request
 */
export const VerifyAccountRequest = openapi(
  z.object({
    token: z.string(),
  }),
  {
    description: 'Verify account with token',
  },
)

export type VerifyAccountRequest = z.infer<typeof VerifyAccountRequest>

/**
 * Account verification response
 */
export const AccountVerificationResponse = openapi(
  z.object({
    verified: z.boolean(),
    userId: UserId.optional(),
    message: z.string().optional(),
  }),
  {
    description: 'Account verification result',
  },
)

export type AccountVerificationResponse = z.infer<
  typeof AccountVerificationResponse
>

// ============= Session Management =============

/**
 * Create service session request
 */
export const CreateServiceSessionRequest = openapi(
  z.object({
    userId: UserId,
    serviceName: z.string(),
    expiresIn: z.number().int().positive().default(3600),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Create a service-to-service session',
  },
)

export type CreateServiceSessionRequest = z.infer<
  typeof CreateServiceSessionRequest
>

/**
 * Service session response
 */
export const ServiceSessionResponse = openapi(
  z.object({
    sessionId: UUID,
    token: JWTToken,
    expiresAt: DateTime,
  }),
  {
    description: 'Service session details',
  },
)

export type ServiceSessionResponse = z.infer<typeof ServiceSessionResponse>

// ============= Role Management =============

/**
 * Check user role request
 */
export const CheckUserRoleRequest = openapi(
  z.object({
    userId: UserId,
    roles: z.array(z.string()).min(1),
    requireAll: z.boolean().default(false),
  }),
  {
    description: 'Check if user has specified roles',
  },
)

export type CheckUserRoleRequest = z.infer<typeof CheckUserRoleRequest>

/**
 * Role check response
 */
export const RoleCheckResponse = openapi(
  z.object({
    hasRole: z.boolean(),
    userRoles: z.array(z.string()),
    missingRoles: z.array(z.string()).optional(),
  }),
  {
    description: 'Role check result',
  },
)

export type RoleCheckResponse = z.infer<typeof RoleCheckResponse>

// ============= Service Authentication =============

/**
 * Validate service key request
 */
export const ValidateServiceKeyRequest = openapi(
  z.object({
    apiKey: z.string(),
    serviceName: z.string(),
  }),
  {
    description: 'Validate service API key',
  },
)

export type ValidateServiceKeyRequest = z.infer<
  typeof ValidateServiceKeyRequest
>

/**
 * Service key validation response
 */
export const ServiceKeyValidationResponse = openapi(
  z.object({
    valid: z.boolean(),
    serviceName: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    rateLimit: z
      .object({
        limit: z.number().int().positive(),
        remaining: z.number().int().nonnegative(),
        resetAt: DateTime,
      })
      .optional(),
  }),
  {
    description: 'Service key validation result',
  },
)

export type ServiceKeyValidationResponse = z.infer<
  typeof ServiceKeyValidationResponse
>
