import { USER_API_URL } from '@pika/environment'
import type { UserDomain } from '@pika/sdk'
import type { ServiceContext } from '@pika/types'
import { UserRole } from '@pika/types'

import { BaseServiceClient } from '../BaseServiceClient.js'

// Service client request/response types - NOT API schemas
export interface CreateUserRequest {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  acceptTerms: boolean
  marketingConsent?: boolean
  role?: string
  avatarUrl?: string
}

export interface UpdateLastLoginRequest {
  lastLoginAt: string
}

export interface UpdatePasswordRequest {
  userId: string
  passwordHash: string
}

export interface VerifyEmailRequest {
  userId: string
}

export interface ValidatePasswordResetTokenRequest {
  token: string
}

export interface UserAuthData extends UserDomain {
  passwordHash?: string
}

export interface ExistsResponse {
  exists: boolean
}

export interface PasswordResetTokenResponse {
  token: string
}

export interface EmailVerificationTokenResponse {
  token: string
}

/**
 * Client for communicating with the User service
 * Can be used by any service that needs user or provider information
 */
export class UserServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = USER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'UserServiceClient',
    })
  }

  /**
   * Get a user by ID
   */
  async getUser(
    userId: string,
    context?: ServiceContext,
  ): Promise<UserDomain | null> {
    try {
      return await this.get<UserDomain>(`/internal/users/auth/${userId}`, {
        ...context,
        useServiceAuth: true,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if a user exists
   */
  async userExists(userId: string, context?: ServiceContext): Promise<boolean> {
    return this.exists(`/internal/users/auth/${userId}`, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Check if a user exists and has ADMIN role
   */
  async isAdmin(userId: string, context?: ServiceContext): Promise<boolean> {
    try {
      const user = await this.getUser(userId, context)

      return user !== null && user.role === UserRole.ADMIN
    } catch (error: any) {
      // Log error but return false instead of throwing
      console.error('Error checking if user is admin:', error)

      return false
    }
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(
    email: string,
    context?: ServiceContext,
  ): Promise<UserDomain | null> {
    try {
      return await this.get<UserDomain>(
        `/internal/users/auth/by-email/${encodeURIComponent(email)}`,
        {
          ...context,
          useServiceAuth: true,
        },
      )
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get user auth data by email (includes password hash)
   */
  async getUserAuthDataByEmail(
    email: string,
    context?: ServiceContext,
  ): Promise<UserAuthData | null> {
    try {
      return await this.get<UserAuthData>(
        `/internal/users/auth/by-email/${encodeURIComponent(email)}`,
        {
          ...context,
          useServiceAuth: true,
        },
      )
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get user auth data by ID (includes password hash)
   */
  async getUserAuthData(
    userId: string,
    context?: ServiceContext,
  ): Promise<UserAuthData | null> {
    try {
      return await this.get<UserAuthData>(`/internal/users/auth/${userId}`, {
        ...context,
        useServiceAuth: true,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Create a new user (for registration)
   */
  async createUser(
    data: CreateUserRequest,
    context?: ServiceContext,
  ): Promise<UserAuthData> {
    return await this.post<UserAuthData>('/internal/users', data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(
    userId: string,
    data: UpdateLastLoginRequest,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post(`/internal/users/${userId}/last-login`, data, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Check if an email exists
   */
  async emailExists(email: string, context?: ServiceContext): Promise<boolean> {
    const response = await this.get<ExistsResponse>(
      `/internal/users/check-email/${encodeURIComponent(email)}`,
      {
        ...context,
        useServiceAuth: true,
      },
    )

    return response.exists
  }

  /**
   * Check if a phone number exists
   */
  async phoneExists(
    phoneNumber: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    const response = await this.get<ExistsResponse>(
      `/internal/users/check-phone/${encodeURIComponent(phoneNumber)}`,
      {
        ...context,
        useServiceAuth: true,
      },
    )

    return response.exists
  }

  /**
   * Update user password
   */
  async updatePassword(
    data: UpdatePasswordRequest,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post(
      `/internal/users/${data.userId}/password`,
      { passwordHash: data.passwordHash },
      {
        ...context,
        useServiceAuth: true,
      },
    )
  }

  /**
   * Verify user email
   */
  async verifyEmail(
    data: VerifyEmailRequest,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post(
      `/internal/users/${data.userId}/verify-email`,
      { userId: data.userId },
      {
        ...context,
        useServiceAuth: true,
      },
    )
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(
    userId: string,
    context?: ServiceContext,
  ): Promise<string> {
    const response = await this.post<PasswordResetTokenResponse>(
      `/internal/users/${userId}/password-reset-token`,
      {},
      {
        ...context,
        useServiceAuth: true,
      },
    )

    return response.token
  }

  /**
   * Validate password reset token
   */
  async validatePasswordResetToken(
    data: ValidatePasswordResetTokenRequest,
    context?: ServiceContext,
  ): Promise<string | null> {
    try {
      const response = await this.post<{ userId: string }>(
        '/internal/users/validate-password-reset-token',
        data,
        {
          ...context,
          useServiceAuth: true,
        },
      )

      return response.userId
    } catch (error: any) {
      if (
        error.context?.metadata?.status === 404 ||
        error.context?.metadata?.status === 400
      ) {
        return null
      }
      throw error
    }
  }

  /**
   * Invalidate password reset token
   */
  async invalidatePasswordResetToken(
    token: string,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post(
      '/internal/users/invalidate-password-reset-token',
      { token },
      {
        ...context,
        useServiceAuth: true,
      },
    )
  }

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(
    userId: string,
    context?: ServiceContext,
  ): Promise<string> {
    const response = await this.post<EmailVerificationTokenResponse>(
      `/internal/users/${userId}/email-verification-token`,
      {},
      {
        ...context,
        useServiceAuth: true,
      },
    )

    return response.token
  }

  /**
   * Validate email verification token
   */
  async validateEmailVerificationToken(
    token: string,
    context?: ServiceContext,
  ): Promise<string | null> {
    try {
      const response = await this.post<{ userId: string }>(
        '/internal/users/validate-email-verification-token',
        { token },
        {
          ...context,
          useServiceAuth: true,
        },
      )

      return response.userId
    } catch (error: any) {
      if (
        error.context?.metadata?.status === 404 ||
        error.context?.metadata?.status === 400
      ) {
        return null
      }
      throw error
    }
  }
}
