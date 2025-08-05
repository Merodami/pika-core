import {
  UserRole as UserRoleEnum,
  UserStatus as UserStatusEnum,
} from '@pika/types'
import { z } from 'zod'

import { CreateBusinessRequest } from '../../business/admin/management.js'
// Note: Not using openapi() wrapper for frontend schemas as they don't need OpenAPI examples
import { Email } from '../../shared/branded.js'
import { SecurePassword } from '../../shared/primitives.js'
// Import admin schemas we need to extend
import { AdminCreateUserRequest } from '../../user/admin/management.js'
import { TokenRequest } from '../public/oauth.js'
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../public/password.js'
import { RegisterRequest } from '../public/register.js'

/**
 * Frontend-optimized authentication schemas
 * These extend the backend API schemas with UI-specific concerns
 *
 * Architecture Pattern: Backend Schema → .extend() → Frontend Schema
 * Benefits: Single source of truth, automatic consistency, type safety
 */

// ============= Login Form =============

/**
 * Simple login form that maps to TokenRequest with password grant
 * Extends the OAuth TokenRequest for better UX
 */
export const LoginFormSchema = z.object({
  email: Email, // Using branded Email - form will handle with z.input/z.output types
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Admin/Business login form - extends base with stricter validation
 */
export const AdminBusinessLoginFormSchema = LoginFormSchema.extend({
  password: z
    .string()
    .min(12, 'Admin/Business passwords must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters'),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>
export type AdminBusinessLoginFormData = z.infer<
  typeof AdminBusinessLoginFormSchema
>

/**
 * Transform login form data to backend TokenRequest format
 */
export function transformLoginToTokenRequest(
  loginData: LoginFormData,
): Extract<z.infer<typeof TokenRequest>, { grantType: 'password' }> {
  return {
    grantType: 'password' as const,
    username: loginData.email as any, // Cast to any to bypass brand type checking
    password: loginData.password,
    // Note: rememberMe would be handled by token expiration logic
  }
}

// ============= Registration Form =============

/**
 * Registration form extending backend RegisterRequest
 * Adds UI-specific validation like password confirmation
 */
export const RegisterFormSchema = RegisterRequest.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreedToMarketing: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof RegisterFormSchema>

/**
 * Transform registration form data to backend RegisterRequest format
 */
export function transformRegisterToAPI(
  formData: RegisterFormData,
): z.infer<typeof RegisterRequest> {
  const {
    confirmPassword: _confirmPassword,
    agreedToMarketing,
    ...apiData
  } = formData

  // Map UI field to API field
  return {
    ...apiData,
    marketingConsent: agreedToMarketing,
  }
}

// ============= Password Reset Forms =============

/**
 * Forgot password form (direct reuse of backend schema)
 */
export const ForgotPasswordFormSchema = ForgotPasswordRequest

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordFormSchema>

/**
 * Reset password form with confirmation
 * Extends backend schema with password confirmation
 */
export const ResetPasswordFormSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>

/**
 * Transform reset password form to backend format
 */
export function transformResetPasswordToAPI(
  formData: ResetPasswordFormData,
): z.infer<typeof ResetPasswordRequest> {
  const { confirmPassword: _confirmPassword, ...apiData } = formData

  return apiData
}

// ============= Multi-Step Registration =============

/**
 * Example: Multi-step registration form
 * Step 1: Basic info (subset of full registration)
 */
export const RegistrationStep1Schema = RegisterRequest.pick({
  email: true,
  firstName: true,
  lastName: true,
}).extend({
  agreedToTerms: z
    .literal(true)
    .describe('You must accept the terms and conditions'),
})

/**
 * Step 2: Security (password + confirmation)
 */
export const RegistrationStep2Schema = RegisterRequest.pick({
  password: true,
})
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Step 3: Optional info
 */
export const RegistrationStep3Schema = RegisterRequest.pick({
  phoneNumber: true,
  dateOfBirth: true,
  marketingConsent: true,
})

export type RegistrationStep1Data = z.infer<typeof RegistrationStep1Schema>
export type RegistrationStep2Data = z.infer<typeof RegistrationStep2Schema>
export type RegistrationStep3Data = z.infer<typeof RegistrationStep3Schema>

/**
 * Combine multi-step data into final registration request
 */
export function combineRegistrationSteps(
  step1: RegistrationStep1Data,
  step2: RegistrationStep2Data,
  step3: RegistrationStep3Data,
): z.infer<typeof RegisterRequest> {
  const { confirmPassword: _confirmPassword, ...passwordData } = step2
  const { agreedToTerms: _agreedToTerms, ...basicData } = step1

  return {
    ...basicData,
    ...passwordData,
    ...step3,
    acceptTerms: true as const, // agreedToTerms is already validated as true
  }
}

// ============= Admin/Business Specific Forms =============

/**
 * Admin creates business user form
 * Properly extends backend AdminCreateUserRequest with frontend needs
 */
export const AdminCreateBusinessUserSchema = AdminCreateUserRequest.omit({
  role: true,
  status: true,
}) // Remove fields we'll set automatically
  .extend({
    // Add password fields
    temporaryPassword: SecurePassword,
    confirmPassword: z.string().min(1, 'Please confirm password'),
    // Frontend options
    sendWelcomeEmail: z.boolean().default(true),
    requirePasswordChange: z.boolean().default(true),
  })
  .refine((data) => data.temporaryPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AdminCreateBusinessUserData = z.infer<
  typeof AdminCreateBusinessUserSchema
>

/**
 * Frontend options returned with the user creation
 */
export interface AdminCreateUserOptions {
  temporaryPassword: string
  sendWelcomeEmail: boolean
  requirePasswordChange: boolean
}

/**
 * Transform to backend AdminCreateUserRequest with type-safe enums
 * Returns both the user request and frontend options
 */
export function transformToAdminCreateUser(
  formData: AdminCreateBusinessUserData,
): {
  createUser: z.infer<typeof AdminCreateUserRequest>
  options: AdminCreateUserOptions
} {
  const {
    temporaryPassword,
    sendWelcomeEmail,
    requirePasswordChange,
    ...userData
  } = formData

  // Note: confirmPassword is validated by the schema but not needed for the API
  return {
    createUser: {
      ...userData,
      role: UserRoleEnum.BUSINESS, // Type-safe enum value
      status: UserStatusEnum.UNCONFIRMED, // Type-safe enum value
    },
    options: {
      temporaryPassword,
      sendWelcomeEmail,
      requirePasswordChange,
    },
  }
}

/**
 * Admin creates business form
 * Properly extends backend CreateBusinessRequest - no changes needed
 */
export const AdminCreateBusinessSchema = CreateBusinessRequest

export type AdminCreateBusinessData = z.infer<typeof AdminCreateBusinessSchema>

/**
 * Admin/Business change password form
 * Properly extends base ChangePasswordRequest
 */
export const AdminBusinessChangePasswordSchema = ChangePasswordRequest.omit({
  newPassword: true,
})
  .extend({
    newPassword: SecurePassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AdminBusinessChangePasswordData = z.infer<
  typeof AdminBusinessChangePasswordSchema
>

/**
 * Transform to backend ChangePasswordRequest
 */
export function transformToChangePassword(
  formData: AdminBusinessChangePasswordData,
): z.infer<typeof ChangePasswordRequest> {
  // Note: confirmPassword is validated by the schema but not needed for the API
  return {
    currentPassword: formData.currentPassword,
    newPassword: formData.newPassword,
  }
}

// ============= Export All =============

export {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  // Re-export backend schemas for convenience
  RegisterRequest,
  ResetPasswordRequest,
  TokenRequest,
} from '../public/index.js'
