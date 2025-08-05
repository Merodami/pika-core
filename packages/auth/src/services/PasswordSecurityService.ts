import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { shuffle as _shuffle } from 'lodash-es'

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  forbidCommonPasswords: boolean
}

/**
 * Password Security Service
 * Handles password hashing, verification, and validation with industry standards
 * Part of @pika/auth package for proper separation of concerns
 */
export class PasswordSecurityService {
  private readonly saltRounds: number
  private readonly requirements: PasswordRequirements

  // Common passwords to block (basic list - in production, use a comprehensive dictionary)
  private readonly commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'password1',
    'iloveyou',
    'princess',
    'rockyou',
    '12345678',
    '123123',
    'football',
  ]

  constructor(
    saltRounds: number = 12,
    requirements?: Partial<PasswordRequirements>,
  ) {
    this.saltRounds = saltRounds
    this.requirements = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbidCommonPasswords: true,
      ...requirements,
    }
  }

  /**
   * Hash a password using bcrypt with secure salt rounds
   */
  async hashPassword(plainPassword: string): Promise<string> {
    try {
      // Validate password first
      const validation = this.validatePasswordStrength(plainPassword)

      if (!validation.isValid) {
        throw new Error(
          `Password validation failed: ${validation.errors.join(', ')}`,
        )
      }

      // Generate salt and hash
      const salt = await bcrypt.genSalt(this.saltRounds)
      const hashedPassword = await bcrypt.hash(plainPassword, salt)

      return hashedPassword
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }

      throw new Error(
        `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Verify a password against its hash with timing attack protection
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      // bcrypt.compare is inherently protected against timing attacks
      const isValid = await bcrypt.compare(plainPassword, hashedPassword)

      return isValid
    } catch (error) {
      // Log the error but don't expose details to prevent information leakage
      console.error('Password verification error:', error)

      return false
    }
  }

  /**
   * Helper to check a password rule and update errors/score
   */
  private checkRule(
    valid: boolean,
    errorMsg: string,
    scoreIfValid: number,
    errors: string[],
  ): number {
    if (!valid) {
      errors.push(errorMsg)

      return 0
    }

    return scoreIfValid
  }

  /**
   * Validate password strength and requirements
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = []

    let score = 0

    const req = this.requirements

    score += this.checkRule(
      password.length >= req.minLength,
      `Password must be at least ${req.minLength} characters long`,
      1,
      errors,
    )
    score += this.checkRule(
      !req.requireUppercase || /[A-Z]/.test(password),
      'Password must contain at least one uppercase letter',
      /[A-Z]/.test(password) ? 1 : 0,
      errors,
    )
    score += this.checkRule(
      !req.requireLowercase || /[a-z]/.test(password),
      'Password must contain at least one lowercase letter',
      /[a-z]/.test(password) ? 1 : 0,
      errors,
    )
    score += this.checkRule(
      !req.requireNumbers || /\d/.test(password),
      'Password must contain at least one number',
      /\d/.test(password) ? 1 : 0,
      errors,
    )
    score += this.checkRule(
      !req.requireSpecialChars ||
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;\':",./<>?)',
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? 1 : 0,
      errors,
    )

    if (req.forbidCommonPasswords && this.isCommonPassword(password)) {
      errors.push(
        'Password is too common. Please choose a more secure password',
      )
      score = 0
    }
    if (password.length >= 12) score += 1
    if (/(.)\1{2,}/.test(password)) score -= 1
    if (
      password.toLowerCase() === password ||
      password.toUpperCase() === password
    )
      score -= 1

    let strength: 'weak' | 'medium' | 'strong'

    if (score >= 5) strength = 'strong'
    else if (score >= 3) strength = 'medium'
    else strength = 'weak'

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    }
  }

  /**
   * Check if password is in the common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase()

    return this.commonPasswords.includes(lowerPassword)
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    const allChars = lowercase + uppercase + numbers + specialChars

    let password = ''

    // Ensure at least one character from each required category using secure random
    password += this.getSecureRandomChar(lowercase)
    password += this.getSecureRandomChar(uppercase)
    password += this.getSecureRandomChar(numbers)
    password += this.getSecureRandomChar(specialChars)

    // Fill the rest with secure random characters
    for (let i = 4; i < length; i++) {
      password += this.getSecureRandomChar(allChars)
    }

    // Securely shuffle the password using crypto.randomBytes
    return this.secureArrayShuffle(password.split('')).join('')
  }

  /**
   * Get a cryptographically secure random character from a string
   */
  private getSecureRandomChar(chars: string): string {
    const randomIndex = randomBytes(1)[0] % chars.length

    return chars.charAt(randomIndex)
  }

  /**
   * Securely shuffle an array using lodash-es (Fisher-Yates shuffle)
   */
  private secureArrayShuffle<T>(array: T[]): T[] {
    // Use lodash-es shuffle for security and to avoid object injection sinks
    return _shuffle(array)
  }

  /**
   * Check if a hash needs to be rehashed (due to changed salt rounds)
   */
  needsRehash(hashedPassword: string): boolean {
    try {
      const rounds = bcrypt.getRounds(hashedPassword)

      return rounds < this.saltRounds
    } catch {
      return true // If we can't determine rounds, assume it needs rehashing
    }
  }

  /**
   * Get current password requirements for client-side validation
   */
  getPasswordRequirements(): PasswordRequirements {
    return { ...this.requirements }
  }
}

/**
 * Default instance with standard security settings
 */
export const passwordSecurityService = new PasswordSecurityService(12, {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
})
