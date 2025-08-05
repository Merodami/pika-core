// Service client types - these should NOT import from @pika/api
// Each service client defines its own interfaces for communication
import type { ServiceContext } from '@pika/types'

import {
  BaseServiceClient,
  type ServiceClientConfig,
} from '../BaseServiceClient.js'

// Auth service client types
export interface ValidateTokenRequest {
  token: string
}

export interface TokenValidationResponse {
  valid: boolean
  userId?: string
  email?: string
  role?: string
}

export interface GetUserByEmailRequest {
  email: string
}

export interface AuthUserResponse {
  id: string
  email: string
  role: string
  status: string
}

export interface InitiatePasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  success: boolean
  message?: string
}

export interface ConfirmPasswordResetRequest {
  token: string
  newPassword: string
}

export interface VerifyAccountRequest {
  token: string
}

export interface AccountVerificationResponse {
  success: boolean
  userId?: string
}

export interface CreateServiceSessionRequest {
  serviceName: string
  serviceId: string
}

export interface ServiceSessionResponse {
  sessionId: string
  expiresAt: string
}

export interface CheckUserRoleRequest {
  userId: string
  roles: string[]
  requireAll: boolean
}

export interface RoleCheckResponse {
  hasRole: boolean
  matchedRoles: string[]
}

export interface ValidateServiceKeyRequest {
  serviceKey: string
  serviceName: string
}

export interface ServiceKeyValidationResponse {
  valid: boolean
  serviceName?: string
  serviceId?: string
}

/**
 * Client for interacting with the Auth service
 * Provides methods for authentication, authorization, and user management
 */
export class AuthServiceClient extends BaseServiceClient {
  constructor(config: ServiceClientConfig) {
    super({
      ...config,
      serviceName: config.serviceName || 'AuthServiceClient',
    })
  }

  /**
   * Validate a JWT token
   */
  async validateToken(
    data: ValidateTokenRequest,
    context?: ServiceContext,
  ): Promise<TokenValidationResponse> {
    return this.post<TokenValidationResponse>(
      '/internal/auth/validate-token',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Get user by email
   */
  async getUserByEmail(
    data: GetUserByEmailRequest,
    context?: ServiceContext,
  ): Promise<AuthUserResponse | null> {
    try {
      return await this.post<AuthUserResponse>(
        '/internal/auth/user-by-email',
        data,
        { ...context, useServiceAuth: true },
      )
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(
    data: InitiatePasswordResetRequest,
    context?: ServiceContext,
  ): Promise<PasswordResetResponse> {
    return this.post<PasswordResetResponse>(
      '/internal/auth/password-reset/initiate',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(
    data: ConfirmPasswordResetRequest,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post('/internal/auth/password-reset/confirm', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Verify user account
   */
  async verifyAccount(
    data: VerifyAccountRequest,
    context?: ServiceContext,
  ): Promise<AccountVerificationResponse> {
    return this.post<AccountVerificationResponse>(
      '/internal/auth/verify-account',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Create a service-to-service session
   */
  async createServiceSession(
    data: CreateServiceSessionRequest,
    context?: ServiceContext,
  ): Promise<ServiceSessionResponse> {
    return this.post<ServiceSessionResponse>(
      '/internal/auth/service-session',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Check if user has specific roles
   */
  async checkUserRole(
    data: CheckUserRoleRequest,
    context?: ServiceContext,
  ): Promise<RoleCheckResponse> {
    return this.post<RoleCheckResponse>('/internal/auth/check-role', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Validate service API key
   */
  async validateServiceKey(
    data: ValidateServiceKeyRequest,
    context?: ServiceContext,
  ): Promise<ServiceKeyValidationResponse> {
    return this.post<ServiceKeyValidationResponse>(
      '/internal/auth/validate-service-key',
      data,
      { ...context, useServiceAuth: true },
    )
  }

  /**
   * Quick check if user exists by email
   */
  async userExistsByEmail(
    email: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    const user = await this.getUserByEmail({ email: email as any }, context)

    return user !== null
  }

  /**
   * Quick role check - returns boolean
   */
  async hasRole(
    userId: string,
    role: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    const result = await this.checkUserRole(
      { userId: userId as any, roles: [role], requireAll: false },
      context,
    )

    return result.hasRole
  }
}
