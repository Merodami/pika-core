import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email } from '../../shared/branded.js'

/**
 * Password management schemas for public API
 */

// ============= Forgot Password =============

/**
 * Forgot password request
 */
export const ForgotPasswordRequest = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Request password reset email',
  },
)

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>

/**
 * Forgot password response
 */
export const ForgotPasswordResponse = openapi(
  z.object({
    message: z
      .string()
      .default(
        'If an account exists with this email, a password reset link has been sent.',
      ),
    // Don't reveal whether email exists for security
  }),
  {
    description: 'Password reset email sent response',
  },
)

export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponse>

// ============= Reset Password =============

/**
 * Reset password request
 */
export const ResetPasswordRequest = openapi(
  z.object({
    token: z.string().min(1).describe('Password reset token from email'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .describe('New password meeting security requirements'),
  }),
  {
    description: 'Reset password with token',
  },
)

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>

/**
 * Reset password response
 */
export const ResetPasswordResponse = openapi(
  z.object({
    message: z.string().default('Password reset successfully'),
  }),
  {
    description: 'Password reset success response',
  },
)

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponse>

// ============= Change Password =============

/**
 * Change password request (for logged-in users)
 */
export const ChangePasswordRequest = openapi(
  z
    .object({
      currentPassword: z
        .string()
        .min(1)
        .describe('Current password for verification'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/\d/, 'Password must contain at least one number')
        .describe('New password meeting security requirements'),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
  {
    description: 'Change password for authenticated user',
  },
)

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequest>

/**
 * Change password response
 */
export const ChangePasswordResponse = openapi(
  z.object({
    message: z.string().default('Password changed successfully'),
  }),
  {
    description: 'Password change success response',
  },
)

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponse>
