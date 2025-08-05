import { AUTH_PROVIDER } from '@pika/environment'

import { JwtTokenService } from '../services/JwtTokenService.js'
import { PasswordSecurityService } from '../services/PasswordSecurityService.js'
import { AuthStrategy } from './AuthStrategy.js'
import { LocalAuthStrategy, UserService } from './LocalAuthStrategy.js'

export type AuthProvider = 'local' | 'cognito' | 'auth0' | 'google' | 'github'

export interface AuthConfig {
  provider: AuthProvider
  settings?: {
    cognito?: {
      userPoolId: string
      clientId: string
      region: string
    }
    auth0?: {
      domain: string
      clientId: string
      clientSecret: string
    }
    google?: {
      clientId: string
      clientSecret: string
      redirectUri: string
    }
    github?: {
      clientId: string
      clientSecret: string
    }
  }
}

/**
 * AuthStrategyFactory
 * Creates authentication strategy instances based on configuration
 * Supports multiple authentication providers with strategy pattern
 */
export class AuthStrategyFactory {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordSecurityService,
    private readonly tokenService: JwtTokenService,
  ) {}

  /**
   * Create authentication strategy based on provider type
   */
  createStrategy(provider: AuthProvider): AuthStrategy {
    switch (provider) {
      case 'local':
        return new LocalAuthStrategy(
          this.userService,
          this.passwordService,
          this.tokenService,
        )

      case 'cognito':
        // TODO: Implement CognitoAuthStrategy
        throw new Error('Cognito authentication strategy not yet implemented')

      case 'auth0':
        // TODO: Implement Auth0AuthStrategy
        throw new Error('Auth0 authentication strategy not yet implemented')

      case 'google':
        // TODO: Implement GoogleAuthStrategy
        throw new Error('Google authentication strategy not yet implemented')

      case 'github':
        // TODO: Implement GitHubAuthStrategy
        throw new Error('GitHub authentication strategy not yet implemented')

      default:
        throw new Error(`Unsupported authentication provider: ${provider}`)
    }
  }

  /**
   * Create strategy from environment configuration
   */
  createFromEnvironment(): AuthStrategy {
    const provider = (AUTH_PROVIDER || 'local') as AuthProvider

    return this.createStrategy(provider)
  }

  /**
   * Get list of supported providers
   */
  getSupportedProviders(): AuthProvider[] {
    return ['local'] // Only local is implemented for now
  }

  /**
   * Check if a provider is supported
   */
  isProviderSupported(provider: string): provider is AuthProvider {
    return this.getSupportedProviders().includes(provider as AuthProvider)
  }
}

/**
 * Create default auth strategy factory
 */
export function createAuthStrategyFactory(
  userService: UserService,
  passwordService: PasswordSecurityService,
  tokenService: JwtTokenService,
): AuthStrategyFactory {
  return new AuthStrategyFactory(userService, passwordService, tokenService)
}
