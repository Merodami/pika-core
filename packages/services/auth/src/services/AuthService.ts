import { UserServiceClientAdapter } from '@auth-service/adapters/UserServiceClientAdapter.js'
import {
  AuthStrategy,
  createLocalAuthStrategy,
  JwtTokenService,
} from '@pika/auth'
import {
  JWT_ACCESS_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import {
  CommunicationServiceClient,
  ErrorFactory,
  UserServiceClient,
} from '@pika/shared'
import { UserRole } from '@pika/types'

export interface IAuthService {
  login(email: string, password: string): Promise<LoginResult>
  register(data: RegisterInput): Promise<RegisterResult>
  refreshToken(refreshToken: string): Promise<RefreshResult>
  logout(userId: string, accessToken?: string): Promise<void>
  forgotPassword(email: string): Promise<{ success: boolean; message?: string }>
  resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }>
  verifyEmail(token: string): Promise<{ success: boolean; userId?: string }>
  resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message?: string }>
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }>
  // OAuth 2.0 methods
  introspectToken(token: string): Promise<TokenIntrospectionResult>
  revokeToken(token: string): Promise<void>
  getUserInfo(userId: string): Promise<any>
}

export interface TokenIntrospectionResult {
  valid: boolean
  payload?: {
    userId: string
    email: string
    role: UserRole
    exp?: number
    iat?: number
  }
}

export interface LoginResult {
  user: any // Will be the User type from the controller's perspective
  accessToken: string
  refreshToken: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: UserRole
  dateOfBirth?: string
  description?: string
  specialties?: string[]
  acceptTerms: boolean
  marketingConsent?: boolean
}

export interface RegisterResult {
  user: any // Will be the User type from the controller's perspective
  accessToken?: string
  refreshToken?: string
  message?: string
  emailSent?: boolean
}

export interface RefreshResult {
  accessToken: string
  refreshToken: string
}

export class AuthService implements IAuthService {
  private readonly authStrategy: AuthStrategy
  private readonly userServiceAdapter: UserServiceClientAdapter
  private readonly jwtTokenService: JwtTokenService

  constructor(
    private readonly cacheService: ICacheService,
    private readonly userServiceClient: UserServiceClient,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {
    // Create adapter to connect user service client with auth strategy
    this.userServiceAdapter = new UserServiceClientAdapter(userServiceClient)

    // Create local auth strategy (in future, this could be Cognito strategy)
    this.authStrategy = createLocalAuthStrategy(
      this.userServiceAdapter,
      this.cacheService,
      this.communicationClient,
    )

    // Create JWT token service for OAuth endpoints
    this.jwtTokenService = new JwtTokenService(
      JWT_SECRET,
      JWT_ACCESS_EXPIRY,
      JWT_REFRESH_EXPIRY,
      JWT_ISSUER,
      JWT_AUDIENCE,
      this.cacheService,
      JWT_ALGORITHM as any,
      JWT_PRIVATE_KEY,
      JWT_PUBLIC_KEY,
    )
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.authStrategy.authenticate({ email, password })

    if (!result.success || !result.user || !result.tokens) {
      throw ErrorFactory.unauthorized(
        result.error || 'Invalid email or password',
      )
    }

    // Get full user object from user service
    const user = await this.userServiceClient.getUserByEmail(email)

    if (!user) {
      throw ErrorFactory.unauthorized('Invalid email or password')
    }

    return {
      user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }
  }

  async register(data: RegisterInput): Promise<RegisterResult> {
    if (!this.authStrategy.register) {
      throw ErrorFactory.notImplemented(
        'Registration not supported by current auth strategy',
      )
    }

    const result = await this.authStrategy.register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      description: data.description,
      specialties: data.specialties,
      acceptTerms: data.acceptTerms,
      marketingConsent: data.marketingConsent,
    })

    if (!result.success || !result.user) {
      throw ErrorFactory.businessRuleViolation(
        result.error || 'Registration failed',
        'REGISTRATION_FAILED',
      )
    }

    // Get full user object from user service
    const user = await this.userServiceClient.getUserByEmail(data.email)

    if (!user) {
      throw ErrorFactory.serviceUnavailable(
        'Failed to retrieve registered user',
      )
    }

    // For email verification flow, tokens are not returned
    // User must verify email first
    if (!result.tokens) {
      return {
        user,
        message:
          result.message ||
          'Registration successful. Please check your email to verify your account.',
        emailSent: result.emailSent,
      }
    }

    return {
      user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    const result = await this.authStrategy.refreshToken(refreshToken)

    if (!result.success || !result.tokens) {
      throw ErrorFactory.unauthorized(result.error || 'Invalid refresh token')
    }

    return {
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }
  }

  async logout(userId: string, accessToken?: string): Promise<void> {
    await this.authStrategy.logout(userId, accessToken)
  }

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.authStrategy.forgotPassword) {
      throw ErrorFactory.notImplemented(
        'Password reset not supported by current auth strategy',
      )
    }

    return this.authStrategy.forgotPassword(email)
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.authStrategy.resetPassword) {
      throw ErrorFactory.notImplemented(
        'Password reset not supported by current auth strategy',
      )
    }

    return this.authStrategy.resetPassword(token, newPassword)
  }

  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; userId?: string }> {
    if (!this.authStrategy.verifyEmail) {
      throw ErrorFactory.notImplemented(
        'Email verification not supported by current auth strategy',
      )
    }

    return this.authStrategy.verifyEmail(token)
  }

  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!this.authStrategy.resendVerificationEmail) {
      throw ErrorFactory.notImplemented(
        'Email verification not supported by current auth strategy',
      )
    }

    return this.authStrategy.resendVerificationEmail(email)
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    if (!this.authStrategy.changePassword) {
      throw ErrorFactory.notImplemented(
        'Password change not supported by current auth strategy',
      )
    }

    return this.authStrategy.changePassword(
      userId,
      currentPassword,
      newPassword,
    )
  }

  // ============= OAuth 2.0 Methods =============

  /**
   * Introspect a token to check if it's valid and get its payload
   */
  async introspectToken(token: string): Promise<TokenIntrospectionResult> {
    try {
      const validation = await this.jwtTokenService.verifyToken(token, 'access')

      if (!validation.isValid || !validation.payload) {
        return { valid: false }
      }

      return {
        valid: true,
        payload: {
          userId: validation.payload.userId,
          email: validation.payload.email,
          role: validation.payload.role as UserRole,
          exp: validation.payload.exp,
          iat: validation.payload.iat,
        },
      }
    } catch {
      return { valid: false }
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const validation = await this.jwtTokenService.verifyToken(token, 'access')

      if (validation.isValid && validation.payload) {
        // Add token to blacklist
        await this.authStrategy.logout(validation.payload.userId, token)
      }
    } catch {
      // Silently fail for invalid tokens (OAuth 2.0 spec)
    }
  }

  /**
   * Get user information by ID
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const user = await this.userServiceClient.getUser(userId)

      if (!user) {
        throw ErrorFactory.badRequest('User not found')
      }

      return user
    } catch (error) {
      throw ErrorFactory.fromError(error)
    }
  }
}
