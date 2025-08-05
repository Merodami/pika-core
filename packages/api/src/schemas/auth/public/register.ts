import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'
import { DateOnlyString, PhoneNumber } from '../../shared/primitives.js'

/**
 * User registration schemas for public API
 */

// ============= Registration =============

/**
 * Registration request
 */
export const RegisterRequest = openapi(
  z.object({
    email: Email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .describe('Password must meet security requirements'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .regex(
        /^[a-zA-Z\s\-']+$/,
        'First name can only contain letters, spaces, hyphens, and apostrophes',
      ),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(
        /^[a-zA-Z\s\-']+$/,
        'Last name can only contain letters, spaces, hyphens, and apostrophes',
      ),
    phoneNumber: PhoneNumber.optional(),
    dateOfBirth: DateOnlyString.optional().describe(
      'Date of birth in YYYY-MM-DD format',
    ),
    acceptTerms: z
      .literal(true)
      .refine((value) => value === true, {
        message: 'You must accept the terms and conditions',
      })
      .describe('User must accept terms and conditions'),
    marketingConsent: z
      .boolean()
      .optional()
      .default(false)
      .describe('User consent for marketing emails'),
  }),
  {
    description: 'New user registration data (avatar uploaded separately)',
    example: {
      email: 'newuser@example.com' as any,
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890' as any,
      acceptTerms: true,
      marketingConsent: true,
    },
  },
)

export type RegisterRequest = z.infer<typeof RegisterRequest>

/**
 * Registration response
 */
export const RegisterResponse = openapi(
  z.object({
    message: z
      .string()
      .default(
        'Registration successful. Please check your email to verify your account.',
      ),
    userId: UserId.describe('Newly created user ID'),
    emailSent: z
      .boolean()
      .describe('Whether verification email was sent successfully'),
  }),
  {
    description: 'Registration success response',
  },
)

export type RegisterResponse = z.infer<typeof RegisterResponse>

// ============= Email Verification =============

/**
 * Email verification request
 */
export const VerifyEmailRequest = openapi(
  z.object({
    token: z
      .string()
      .min(1)
      .describe('Email verification token from email link'),
  }),
  {
    description: 'Email verification token',
  },
)

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequest>

/**
 * Email verification response
 */
export const VerifyEmailResponse = openapi(
  z.object({
    message: z.string().default('Email verified successfully'),
    emailVerified: z.boolean().default(true),
  }),
  {
    description: 'Email verification success response',
  },
)

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponse>

/**
 * Resend verification email request
 */
export const ResendVerificationRequest = openapi(
  z.object({
    email: Email,
  }),
  {
    description: 'Request to resend verification email',
  },
)

export type ResendVerificationRequest = z.infer<
  typeof ResendVerificationRequest
>

/**
 * Resend verification response
 */
export const ResendVerificationResponse = openapi(
  z.object({
    message: z
      .string()
      .default(
        'If an account exists with this email, a verification link has been sent.',
      ),
    // Don't reveal whether email exists for security
  }),
  {
    description: 'Resend verification email response',
  },
)

export type ResendVerificationResponse = z.infer<
  typeof ResendVerificationResponse
>
