import { UserRole, UserStatus } from '@pika/types'
import type { User } from '@prisma/client'

export interface UserDTO {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  role: UserRole
  avatarUrl?: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthTokensDTO {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface AuthResponseDTO {
  user: UserDTO
  tokens: AuthTokensDTO
}

export interface RefreshResponseDTO {
  tokens: AuthTokensDTO
}

export class AuthMapper {
  /**
   * Convert User domain object to UserDTO
   */
  static toUserDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role as UserRole,
      avatarUrl: user.avatarUrl,
      isActive: user.status === UserStatus.ACTIVE,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),
    }
  }

  /**
   * Create auth tokens DTO
   */
  static toAuthTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number = 900, // 15 minutes default
  ): AuthTokensDTO {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
    }
  }

  /**
   * Convert login/register result to AuthResponseDTO
   */
  static toAuthResponse(
    user: User,
    accessToken: string,
    refreshToken: string,
    expiresIn?: number,
  ): AuthResponseDTO {
    return {
      user: this.toUserDTO(user),
      tokens: this.toAuthTokens(accessToken, refreshToken, expiresIn),
    }
  }

  /**
   * Convert refresh result to RefreshResponseDTO
   */
  static toRefreshResponse(
    accessToken: string,
    refreshToken: string,
    expiresIn?: number,
  ): RefreshResponseDTO {
    return {
      tokens: this.toAuthTokens(accessToken, refreshToken, expiresIn),
    }
  }

  /**
   * Create logout response
   */
  static toLogoutResponse(message: string = 'Successfully logged out') {
    return { message }
  }

  /**
   * Convert User to simplified user response (for OAuth endpoints)
   */
  static toUserResponse(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.avatarUrl,
      role: user.role === 'admin' ? 'admin' : 'customer',
    }
  }
}
