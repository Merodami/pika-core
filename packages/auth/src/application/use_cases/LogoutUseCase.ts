import { AuthStrategy } from '../../strategies/AuthStrategy.js'

export interface LogoutUseCaseParams {
  userId: string
  token?: string
  source?: string
}

/**
 * Logout Use Case
 * Handles user logout through configured auth strategy
 * Part of auth package's application layer
 */
export class LogoutUseCase {
  constructor(private readonly authStrategy: AuthStrategy) {}

  async execute(params: LogoutUseCaseParams): Promise<void> {
    await this.authStrategy.logout(params.userId, params.token)
  }
}
