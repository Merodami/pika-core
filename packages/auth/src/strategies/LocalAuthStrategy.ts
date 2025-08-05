import {
  API_GATEWAY_BASE_URL,
  API_PREFIX,
  FRONTEND_URL,
  JWT_ACCESS_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, logger } from '@pika/shared'
import { EmailTemplateId, UserRole, UserStatus } from '@pika/types'

import { JwtTokenService } from '../services/JwtTokenService.js'
import { PasswordSecurityService } from '../services/PasswordSecurityService.js'
import {
  AuthResult,
  AuthStrategy,
  LoginCredentials,
  RefreshResult,
  RegistrationData,
} from './AuthStrategy.js'

// User service interface (dependency injection)
export interface UserService {
  findByEmail(email: string): Promise<UserServiceUser | null>
  createUser(data: CreateUserData): Promise<UserServiceUser>
  updateLastLogin(userId: string, loginTime: Date): Promise<void>
  emailExists(email: string): Promise<boolean>
  phoneExists(phoneNumber: string): Promise<boolean>
  findById(userId: string): Promise<UserServiceUser | null>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  verifyEmail(userId: string): Promise<void>
  createPasswordResetToken(userId: string): Promise<string>
  validatePasswordResetToken(token: string): Promise<string | null>
  invalidatePasswordResetToken(token: string): Promise<void>
  createEmailVerificationToken(userId: string): Promise<string>
  validateEmailVerificationToken(token: string): Promise<string | null>
}

export interface UserServiceUser {
  id: string
  email: string
  password?: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
  isActive(): boolean
}

export interface CreateUserData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  acceptTerms: boolean
  marketingConsent?: boolean
  role: UserRole
  avatarUrl?: string
}

/**
 * Local Authentication Strategy
 * Handles traditional username/password authentication
 * Part of @pikaage for proper separation of concerns
 */
export class LocalAuthStrategy implements AuthStrategy {
  readonly name = 'local'

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordSecurityService,
    private readonly tokenService: JwtTokenService,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {}

  /**
   * Authenticate user with email/password
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    const startTime = Date.now()

    logger.info('LocalAuthStrategy.authenticate called', {
      email: credentials.email,
      hasPassword: !!credentials.password,
      passwordLength: credentials.password?.length,
    })

    try {
      // 1. Validate credentials format
      this.validateLoginCredentials(credentials)

      // 2. Find user by email
      const user = await this.userService.findByEmail(
        credentials.email.toLowerCase().trim(),
      )

      logger.info('User lookup result', {
        email: credentials.email,
        normalizedEmail: credentials.email.toLowerCase().trim(),
        userFound: !!user,
        userId: user?.id,
        hasPassword: !!user?.password,
        passwordLength: user?.password?.length,
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // 3. Check if user is active
      if (!user.isActive()) {
        return {
          success: false,
          error: 'Account is inactive. Please contact support.',
        }
      }

      // 4. Verify password
      if (!user.password) {
        return {
          success: false,
          error: 'Password authentication not available for this account',
        }
      }

      const isPasswordValid = await this.passwordService.verifyPassword(
        credentials.password,
        user.password,
      )

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // 5. Update last login time
      await this.userService.updateLastLogin(user.id, new Date())

      // 6. Generate tokens
      const tokens = await this.tokenService.generateTokens(user)

      // 7. Return successful authentication
      logger.info('Local authentication successful', {
        component: 'auth-strategy',
        operation: 'authenticate',
        userId: user.id,
        emailDomain: credentials.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
        source: credentials.source,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: new Date(),
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        },
      }
    } catch (error) {
      logger.error('Local authentication failed', error as Error, {
        component: 'auth-strategy',
        operation: 'authenticate',
        emailDomain: credentials.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      })

      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      }
    }
  }

  /**
   * Register a new user with local authentication
   */
  async register(data: RegistrationData): Promise<AuthResult> {
    const startTime = Date.now()

    try {
      // 1. Validate registration data
      await this.validateRegistrationData(data)

      // 2. Check if user already exists
      const emailExists = await this.userService.emailExists(
        data.email.toLowerCase().trim(),
      )

      if (emailExists) {
        return {
          success: false,
          error: 'Email already registered',
        }
      }

      // Check phone uniqueness if provided
      if (data.phoneNumber) {
        const phoneExists = await this.userService.phoneExists(
          data.phoneNumber.trim(),
        )

        if (phoneExists) {
          return {
            success: false,
            error: 'Phone number already registered',
          }
        }
      }

      // 3. Hash password
      const hashedPassword = await this.passwordService.hashPassword(
        data.password,
      )

      // 4. Create user
      const user = await this.userService.createUser({
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber?.trim(),
        dateOfBirth: data.dateOfBirth,
        acceptTerms: data.acceptTerms,
        marketingConsent: data.marketingConsent,
        role: data.role,
        avatarUrl: data.avatarUrl,
      })

      // 5. Generate email verification token
      let verificationToken: string | undefined
      let emailSent = false

      try {
        verificationToken = await this.userService.createEmailVerificationToken(
          user.id,
        )

        // 6. Send verification email
        if (this.communicationClient && verificationToken) {
          const emailResult = await this.communicationClient.sendEmail({
            to: user.email,
            templateId: EmailTemplateId.EMAIL_VERIFICATION,
            templateParams: {
              firstName: user.firstName,
              verificationUrl: `${API_GATEWAY_BASE_URL}${API_PREFIX}/auth/verify-email/${verificationToken}`,
              frontendUrl: FRONTEND_URL,
            },
          })

          emailSent = emailResult.success
        }
      } catch (emailError) {
        logger.error('Failed to send verification email', emailError as Error, {
          userId: user.id,
          email: user.email,
        })
        // Continue with registration even if email fails
      }

      // 7. For UNCONFIRMED users, don't generate JWT tokens
      // User must verify email first
      logger.info('Local registration successful', {
        component: 'auth-strategy',
        operation: 'register',
        userId: user.id,
        emailDomain: data.email?.split('@')?.[1] || 'unknown',
        role: data.role,
        duration: Date.now() - startTime,
        source: data.source,
        emailVerificationSent: !!verificationToken,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        message:
          'Registration successful. Please check your email to verify your account.',
        emailSent,
      }
    } catch (error) {
      logger.error('Local registration failed', error as Error, {
        component: 'auth-strategy',
        operation: 'register',
        emailDomain: data.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
      })

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Registration failed. Please try again.',
      }
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const result = await this.tokenService.refreshAccessToken(refreshToken)

      // For simplicity, return the same refresh token
      // In production, you might want to rotate refresh tokens
      return {
        success: true,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: refreshToken,
          expiresAt: result.expiresAt,
          refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      }
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(userId: string, token?: string): Promise<void> {
    try {
      if (token) {
        await this.tokenService.revokeToken(token)
      }
      // Could also implement logout tracking/auditing here
    } catch (error) {
      logger.error('Logout failed', error as Error, {
        component: 'auth-strategy',
        operation: 'logout',
        userId,
      })
      // Don't throw - logout should always succeed from user perspective
    }
  }

  /**
   * Check if strategy supports given credentials
   */
  supports(credentials: unknown): boolean {
    return !!(
      credentials &&
      typeof credentials === 'object' &&
      'email' in credentials &&
      'password' in credentials
    )
  }

  /**
   * Validate login credentials
   */
  private validateLoginCredentials(credentials: LoginCredentials): void {
    const errors: string[] = []

    if (!credentials.email || !this.isValidEmail(credentials.email)) {
      errors.push('Valid email is required')
    }

    if (!credentials.password || credentials.password.length === 0) {
      errors.push('Password is required')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Validate registration data
   */
  private async validateRegistrationData(
    data: RegistrationData,
  ): Promise<void> {
    const errors: string[] = []

    // Email validation
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required')
    }

    // Password validation using password service
    if (!data.password) {
      errors.push('Password is required')
    } else {
      const passwordValidation = this.passwordService.validatePasswordStrength(
        data.password,
      )

      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors)
      }
    }

    // Name validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required')
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required')
    }

    // Role validation
    if (!data.role || !Object.values(UserRole).includes(data.role)) {
      errors.push('Valid user role is required')
    }

    // Role-specific validation removed as PROFESSIONAL role no longer exists

    // Legal compliance validation
    if (!data.acceptTerms) {
      errors.push('You must accept the terms and conditions')
    }

    // Date of birth validation (if provided)
    if (data.dateOfBirth) {
      const dateOfBirth = new Date(data.dateOfBirth)

      if (isNaN(dateOfBirth.getTime())) {
        errors.push('Invalid date of birth format')
      } else {
        // Check if user is at least 13 years old (COPPA compliance)
        const minAge = new Date()

        minAge.setFullYear(minAge.getFullYear() - 13)
        if (dateOfBirth > minAge) {
          errors.push('Users must be at least 13 years old')
        }
      }
    }

    // Phone number validation (if provided)
    if (data.phoneNumber && !this.isValidPhoneNumber(data.phoneNumber)) {
      errors.push('Invalid phone number format')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Email validation using RFC 5322 standard
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false

    // Trim whitespace for validation
    const trimmedEmail = email.trim()
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    return emailRegex.test(trimmedEmail)
  }

  /**
   * Phone number validation (basic international format)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')

    // Check if it's between 7 and 15 digits (international standard)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15
  }

  /**
   * Initiate password reset process
   */
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Find user by email
      const user = await this.userService.findByEmail(
        email.toLowerCase().trim(),
      )

      // 2. Always return success to prevent email enumeration
      if (!user) {
        logger.info('Password reset requested for non-existent email', {
          email,
        })

        return {
          success: true,
          message:
            'If an account exists with this email, a password reset link has been sent.',
        }
      }

      // 3. Create reset token
      const resetToken = await this.userService.createPasswordResetToken(
        user.id,
      )

      // 4. Send reset email if communication service is available
      if (this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            templateId: EmailTemplateId.PASSWORD_RESET,
            templateParams: {
              firstName: user.firstName,
              resetLink: `${FRONTEND_URL}/reset-password?token=${resetToken}`,
              expirationHours: '24',
            },
          })
          .catch((error: Error) => {
            logger.error(
              'Failed to send password reset email',
              error as Error,
              { userId: user.id },
            )
          })
      }

      logger.info('Password reset initiated', { userId: user.id })

      return {
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
      }
    } catch (error) {
      logger.error('Password reset failed', error as Error, { email })

      return {
        success: false,
        message: 'Failed to process password reset request',
      }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Validate token
      const userId = await this.userService.validatePasswordResetToken(token)

      if (!userId) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        }
      }

      // 2. Validate password strength
      const passwordValidation =
        this.passwordService.validatePasswordStrength(newPassword)

      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: passwordValidation.errors.join(', '),
        }
      }

      // 3. Hash new password
      const hashedPassword =
        await this.passwordService.hashPassword(newPassword)

      // 4. Update password
      await this.userService.updatePassword(userId, hashedPassword)

      // 5. Invalidate reset token
      await this.userService.invalidatePasswordResetToken(token)

      // 6. Send confirmation email
      const user = await this.userService.findById(userId)

      if (user && this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            templateId: EmailTemplateId.PASSWORD_RESET_CONFIRMATION,
            templateParams: {
              firstName: user.firstName,
            },
          })
          .catch((error: Error) => {
            logger.error(
              'Failed to send password reset confirmation',
              error as Error,
              { userId },
            )
          })
      }

      logger.info('Password reset completed', { userId })

      return {
        success: true,
        message: 'Password reset successfully',
      }
    } catch (error) {
      logger.error('Password reset failed', error as Error)

      return {
        success: false,
        message: 'Failed to reset password',
      }
    }
  }

  /**
   * Verify email address with token
   */
  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; userId?: string }> {
    try {
      // 1. Validate token
      const userId =
        await this.userService.validateEmailVerificationToken(token)

      if (!userId) {
        return { success: false }
      }

      // 2. Mark email as verified
      await this.userService.verifyEmail(userId)

      // 3. Send welcome email
      const user = await this.userService.findById(userId)

      if (user && this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            templateId: EmailTemplateId.WELCOME,
            templateParams: {
              firstName: user.firstName,
            },
          })
          .catch((error: Error) => {
            logger.error('Failed to send welcome email', error as Error, {
              userId,
            })
          })
      }

      logger.info('Email verified', { userId })

      return { success: true, userId }
    } catch (error) {
      logger.error('Email verification failed', error as Error)

      return { success: false }
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Find user by email
      const user = await this.userService.findByEmail(
        email.toLowerCase().trim(),
      )

      if (!user) {
        return {
          success: true,
          message:
            'If an account exists with this email, a verification link has been sent.',
        }
      }

      // 2. Check if already verified
      if (user.emailVerified) {
        return {
          success: true,
          message: 'Email is already verified',
        }
      }

      // 3. Create verification token
      const verificationToken =
        await this.userService.createEmailVerificationToken(user.id)

      // 4. Send verification email
      if (this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            templateId: EmailTemplateId.EMAIL_VERIFICATION,
            templateParams: {
              firstName: user.firstName,
              verificationUrl: `${API_GATEWAY_BASE_URL}${API_PREFIX}/auth/verify-email/${verificationToken}`,
            },
          })
          .catch((error: Error) => {
            logger.error('Failed to send verification email', error as Error, {
              userId: user.id,
            })
          })
      }

      logger.info('Verification email resent', { userId: user.id })

      return {
        success: true,
        message:
          'If an account exists with this email, a verification link has been sent.',
      }
    } catch (error) {
      logger.error('Resend verification failed', error as Error, { email })

      return {
        success: false,
        message: 'Failed to resend verification email',
      }
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    try {
      // 1. Get user
      const user = await this.userService.findById(userId)

      if (!user || !user.password) {
        return { success: false }
      }

      // 2. Verify current password
      const isValidPassword = await this.passwordService.verifyPassword(
        currentPassword,
        user.password,
      )

      if (!isValidPassword) {
        return { success: false }
      }

      // 3. Validate new password
      const passwordValidation =
        this.passwordService.validatePasswordStrength(newPassword)

      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '))
      }

      // 4. Hash and update password
      const hashedPassword =
        await this.passwordService.hashPassword(newPassword)

      await this.userService.updatePassword(userId, hashedPassword)

      // 5. Send confirmation email
      if (this.communicationClient) {
        await this.communicationClient
          .sendEmail({
            to: user.email,
            templateId: EmailTemplateId.PASSWORD_RESET_CONFIRMATION,
            templateParams: {
              firstName: user.firstName,
            },
          })
          .catch((error: Error) => {
            logger.error(
              'Failed to send password change confirmation',
              error as Error,
              { userId },
            )
          })
      }

      logger.info('Password changed successfully', { userId })

      return { success: true }
    } catch (error) {
      logger.error('Password change failed', error as Error, { userId })

      return { success: false }
    }
  }
}

/**
 * Factory function to create LocalAuthStrategy with Redis-enhanced JWT service
 */
export function createLocalAuthStrategy(
  userService: UserService,
  cacheService?: ICacheService,
  communicationClient?: CommunicationServiceClient,
): LocalAuthStrategy {
  const passwordService = new PasswordSecurityService()

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  const tokenService = new JwtTokenService(
    JWT_SECRET,
    JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY,
    JWT_ISSUER,
    JWT_AUDIENCE,
    cacheService,
    JWT_ALGORITHM as any,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
  )

  return new LocalAuthStrategy(
    userService,
    passwordService,
    tokenService,
    communicationClient,
  )
}
