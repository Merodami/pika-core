import { AuthStrategy } from '../../strategies/AuthStrategy.js'
import { AuthResult, LoginCredentials } from '../../strategies/AuthStrategy.js'

export interface LoginUseCaseParams {
  email: string
  password: string
  rememberMe?: boolean
  source?: 'web' | 'mobile' | 'api'
}

/**
 * Login Use Case
 * Handles user authentication through configured auth strategy
 * Part of auth package's application layer
 */
export class LoginUseCase {
  constructor(private readonly authStrategy: AuthStrategy) {}

  async execute(params: LoginUseCaseParams): Promise<AuthResult> {
    const credentials: LoginCredentials = {
      email: params.email,
      password: params.password,
      rememberMe: params.rememberMe || false,
      source: params.source || 'web',
    }

    return await this.authStrategy.authenticate(credentials)
  }
}
