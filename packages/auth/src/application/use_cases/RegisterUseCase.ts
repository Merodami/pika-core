import { UserRole } from '@pika/types'

import {
  AuthResult,
  AuthStrategy,
  RegistrationData,
} from '../../strategies/AuthStrategy.js'

export interface RegisterUseCaseParams {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  description?: string
  specialties?: string[]
  acceptTerms: boolean
  marketingConsent?: boolean
  role: UserRole
  avatarUrl?: string
  source?: 'web' | 'mobile' | 'api'
}

/**
 * Registration Use Case
 * Handles user registration through configured auth strategy
 * Part of auth package's application layer
 */
export class RegisterUseCase {
  constructor(private readonly authStrategy: AuthStrategy) {}

  async execute(params: RegisterUseCaseParams): Promise<AuthResult> {
    const registrationData: RegistrationData = {
      email: params.email,
      password: params.password,
      firstName: params.firstName,
      lastName: params.lastName,
      phoneNumber: params.phoneNumber,
      dateOfBirth: params.dateOfBirth,
      description: params.description,
      specialties: params.specialties,
      acceptTerms: params.acceptTerms,
      marketingConsent: params.marketingConsent,
      role: params.role,
      avatarUrl: params.avatarUrl,
      source: params.source || 'web',
    }

    if (!this.authStrategy.register) {
      throw new Error(
        'Registration not supported by this authentication strategy',
      )
    }

    const result = await this.authStrategy.register(registrationData)

    return result
  }
}
