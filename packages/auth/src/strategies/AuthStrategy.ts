import { UserRole } from '@pika/types'

// Authentication command interfaces
export interface LoginCredentials {
  email: string
  password: string
  ipAddress?: string
  userAgent?: string
  rememberMe?: boolean
  source?: 'web' | 'mobile' | 'api'
}

export interface RegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
  dateOfBirth?: string
  description?: string
  specialties?: string[]
  acceptTerms: boolean
  marketingConsent?: boolean
  avatarUrl?: string
  ipAddress?: string
  userAgent?: string
  source?: 'web' | 'mobile' | 'api'
}

export interface ExternalAuthCredentials {
  provider: string
  token: string
  refreshToken?: string
  expiresAt?: Date
  metadata?: Record<string, any>
}

// Authentication result interfaces
export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    emailVerified: boolean
    createdAt: Date
    lastLoginAt?: Date
  }
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
  }
  error?: string
  message?: string
  requiresVerification?: boolean
  requiresMfa?: boolean
  emailSent?: boolean
}

export interface RefreshResult {
  success: boolean
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
  }
  error?: string
}

/**
 * Authentication Strategy Interface
 * Defines the contract for different authentication providers
 * Supports both local (password-based) and external (OAuth, SAML, etc.) authentication
 */
export interface AuthStrategy {
  /**
   * Strategy name/identifier
   */
  readonly name: string

  /**
   * Authenticate user with credentials
   */
  authenticate(
    credentials: LoginCredentials | ExternalAuthCredentials,
  ): Promise<AuthResult>

  /**
   * Register a new user (if supported by the strategy)
   */
  register?(data: RegistrationData): Promise<AuthResult>

  /**
   * Refresh authentication tokens
   */
  refreshToken(refreshToken: string): Promise<RefreshResult>

  /**
   * Logout user and invalidate tokens
   */
  logout(userId: string, token?: string): Promise<void>

  /**
   * Validate if the strategy supports the given credentials
   */
  supports(credentials: any): boolean

  /**
   * Get user information from external provider (for external strategies)
   */
  getUserInfo?(token: string): Promise<any>

  /**
   * Sync user data from external provider (for external strategies)
   */
  syncUser?(externalUser: any): Promise<any>

  /**
   * Initiate password reset process
   */
  forgotPassword?(
    email: string,
  ): Promise<{ success: boolean; message?: string }>

  /**
   * Reset password with token
   */
  resetPassword?(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }>

  /**
   * Verify email address with token
   */
  verifyEmail?(token: string): Promise<{ success: boolean; userId?: string }>

  /**
   * Resend email verification
   */
  resendVerificationEmail?(
    email: string,
  ): Promise<{ success: boolean; message?: string }>

  /**
   * Change password for authenticated user
   */
  changePassword?(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }>
}
