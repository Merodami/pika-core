import {
  AUTH_PROVIDER,
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import { UserRole, UserStatus } from '@pika/types'
import { PrismaClient } from '@prisma/client'

import { AuthController } from '../api/controllers/AuthController.js'
import { LoginUseCase } from '../application/use_cases/LoginUseCase.js'
import { LogoutUseCase } from '../application/use_cases/LogoutUseCase.js'
import { RefreshTokenUseCase } from '../application/use_cases/RefreshTokenUseCase.js'
import { RegisterUseCase } from '../application/use_cases/RegisterUseCase.js'
import { JwtTokenService } from '../services/JwtTokenService.js'
import { PasswordSecurityService } from '../services/PasswordSecurityService.js'
import {
  AuthProvider,
  AuthStrategyFactory,
} from '../strategies/AuthStrategyFactory.js'
import { UserService } from '../strategies/LocalAuthStrategy.js'

export interface AuthServiceDependencies {
  userService: UserService
  prisma: PrismaClient
}

/**
 * Authentication Service Configuration
 * Sets up dependency injection and configuration for auth package
 */
export class AuthServiceConfig {
  private readonly passwordService: PasswordSecurityService
  private readonly tokenService: JwtTokenService
  private readonly strategyFactory: AuthStrategyFactory

  // Use cases
  private readonly loginUseCase: LoginUseCase
  private readonly registerUseCase: RegisterUseCase
  private readonly refreshTokenUseCase: RefreshTokenUseCase
  private readonly logoutUseCase: LogoutUseCase

  // Controllers
  private readonly authController: AuthController

  constructor(dependencies: AuthServiceDependencies) {
    // Validate critical environment variables
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET environment variable is required and must be at least 32 characters long',
      )
    }

    // Core services
    this.passwordService = new PasswordSecurityService()
    this.tokenService = new JwtTokenService(
      JWT_SECRET,
      JWT_ACCESS_TOKEN_EXPIRY,
      JWT_REFRESH_TOKEN_EXPIRY,
      JWT_ISSUER,
      JWT_AUDIENCE,
    )

    // Strategy factory
    this.strategyFactory = new AuthStrategyFactory(
      dependencies.userService,
      this.passwordService,
      this.tokenService,
    )

    // Get configured auth strategy
    const authStrategy = this.strategyFactory.createFromEnvironment()

    // Use cases
    this.loginUseCase = new LoginUseCase(authStrategy)
    this.registerUseCase = new RegisterUseCase(authStrategy)
    this.refreshTokenUseCase = new RefreshTokenUseCase(authStrategy)
    this.logoutUseCase = new LogoutUseCase(authStrategy)

    // Controllers
    this.authController = new AuthController(
      this.loginUseCase,
      this.registerUseCase,
      this.refreshTokenUseCase,
      this.logoutUseCase,
    )
  }

  /**
   * Get configured auth controller
   */
  getAuthController(): AuthController {
    return this.authController
  }

  /**
   * Get password security service
   */
  getPasswordService(): PasswordSecurityService {
    return this.passwordService
  }

  /**
   * Get JWT token service
   */
  getTokenService(): JwtTokenService {
    return this.tokenService
  }

  /**
   * Get auth strategy factory
   */
  getStrategyFactory(): AuthStrategyFactory {
    return this.strategyFactory
  }

  /**
   * Get current auth provider
   */
  getCurrentProvider(): AuthProvider {
    return AUTH_PROVIDER as AuthProvider
  }

  /**
   * Health check for auth service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      // Test password service
      const testHash = await this.passwordService.hashPassword('test')
      const testVerify = await this.passwordService.verifyPassword(
        'test',
        testHash,
      )

      // Test token service
      const testUser = {
        id: 'test',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN' as UserRole,
        status: 'ACTIVE' as UserStatus,
        emailVerified: true,
        createdAt: new Date(),
        isActive: () => true,
      }
      const testTokens = await this.tokenService.generateTokens(testUser)

      return {
        status: 'healthy',
        details: {
          passwordService: testVerify === true,
          tokenService: !!testTokens.accessToken,
          currentProvider: this.getCurrentProvider(),
          supportedProviders: this.strategyFactory.getSupportedProviders(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }
}

/**
 * Create auth service configuration
 */
export function createAuthServiceConfig(
  dependencies: AuthServiceDependencies,
): AuthServiceConfig {
  return new AuthServiceConfig(dependencies)
}
