import { z } from 'zod'

/**
 * Common auth patterns and validators shared across all auth tiers
 */

// ============= Password Validation =============

/**
 * Standard password validation schema used across registration, reset, and change operations
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .describe('Password meeting security requirements')

export type PasswordSchema = z.infer<typeof PasswordSchema>

// ============= Name Validation =============

/**
 * Standard name validation for first/last names
 */
export const NameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must not exceed 50 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes',
  )

export type NameSchema = z.infer<typeof NameSchema>

// ============= Auth User Roles =============
// User roles are now imported from @pika/api/shared/enums.js

// ============= Token Types =============
// Token types and grant types are now imported from ./enums.js

// ============= Common Auth Responses =============

/**
 * Standard auth success message patterns
 */
export const AuthMessages = {
  REGISTRATION_SUCCESS:
    'Registration successful. Please check your email to verify your account.',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET_SENT:
    'If an account exists with this email, a password reset link has been sent.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  TOKEN_REVOKED: 'Token revoked successfully',
  VERIFICATION_SENT:
    'If an account exists with this email, a verification link has been sent.',
} as const

// ============= Common Validation Helpers =============

/**
 * Email verification token validation
 */
export const VerificationTokenSchema = z
  .string()
  .min(1)
  .describe('Verification token from email link')

/**
 * Terms acceptance validation
 */
export const TermsAcceptanceSchema = z
  .literal(true)
  .refine((value) => value === true, {
    message: 'You must accept the terms and conditions',
  })
  .describe('User must accept terms and conditions')
