import { AuthStrategy } from '../../strategies/AuthStrategy.js'
import { RefreshResult } from '../../strategies/AuthStrategy.js'

export interface RefreshTokenUseCaseParams {
  refreshToken: string
  source?: string
}

/**
 * Refresh Token Use Case
 * Handles token refresh through configured auth strategy
 * Part of auth package's application layer
 */
export class RefreshTokenUseCase {
  constructor(private readonly authStrategy: AuthStrategy) {}

  async execute(params: RefreshTokenUseCaseParams): Promise<RefreshResult> {
    return await this.authStrategy.refreshToken(params.refreshToken)
  }
}
