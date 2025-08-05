import { get } from 'lodash-es'

import { CryptoErrorFactory } from '../errors/CryptoError.js'
import { SecureRandom } from '../random/SecureRandom.js'

/**
 * Code generation utilities for voucher short codes and batch codes
 */
export class CodeGenerationUtils {
  // Character sets for different code types
  private static readonly SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous chars
  private static readonly NUMERIC_CHARS = '0123456789'
  private static readonly ALPHA_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  /**
   * Generate human-readable short code for vouchers
   * Format: XXXX-XXXX (8 characters with dash separator)
   */
  static async generateShortCode(options?: {
    length?: number
    includeDash?: boolean
    prefix?: string
  }): Promise<string> {
    const length = options?.length || 8
    const includeDash = options?.includeDash !== false
    const prefix = options?.prefix || ''

    if (length < 4 || length > 16) {
      throw CryptoErrorFactory.invalidKey(
        'Short code length must be between 4 and 16 characters',
      )
    }

    // Generate random code using safe character set
    let code = await SecureRandom.generateAlphanumeric(length, {
      uppercase: true,
      lowercase: false,
      numbers: true,
      excludeAmbiguous: true,
    })

    // Add dash separator for readability (if length >= 6)
    if (includeDash && length >= 6) {
      const midPoint = Math.floor(length / 2)

      code = code.substring(0, midPoint) + '-' + code.substring(midPoint)
    }

    return prefix + code
  }

  /**
   * Generate batch code for print voucher campaigns
   * Format: PIKA-YYYY-MM-XXX (e.g., PIKA-2025-01-A5K)
   */
  static async generateBatchCode(options?: {
    prefix?: string
    year?: number
    month?: number
    sequenceLength?: number
  }): Promise<string> {
    const prefix = options?.prefix || 'PIKA'
    const year = options?.year || new Date().getFullYear()
    const month = options?.month || new Date().getMonth() + 1
    const sequenceLength = options?.sequenceLength || 3

    // Generate random sequence
    const sequence = await SecureRandom.generateAlphanumeric(sequenceLength, {
      uppercase: true,
      lowercase: false,
      numbers: true,
      excludeAmbiguous: true,
    })

    return `${prefix}-${year}-${month.toString().padStart(2, '0')}-${sequence}`
  }

  /**
   * Generate numeric verification code (for SMS/backup)
   */
  static async generateVerificationCode(length: number = 6): Promise<string> {
    return SecureRandom.generateNumericCode(length)
  }

  /**
   * Generate provider redemption PIN
   */
  static async generateProviderPIN(length: number = 4): Promise<string> {
    if (length < 4 || length > 8) {
      throw CryptoErrorFactory.invalidKey(
        'Provider PIN length must be between 4 and 8 digits',
      )
    }

    return SecureRandom.generateNumericCode(length)
  }

  /**
   * Generate unique campaign identifier
   */
  static async generateCampaignId(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = await SecureRandom.generateAlphanumeric(4, {
      uppercase: true,
      lowercase: false,
      numbers: true,
      excludeAmbiguous: true,
    })

    return `CAMP-${timestamp}-${random}`
  }

  /**
   * Generate alphanumeric code with specific format
   * Example: ABC-123-XYZ
   */
  static async generateAlphaNumericCode(
    alphaLength: number = 3,
    numericLength: number = 3,
    separator: string = '-',
  ): Promise<string> {
    // Generate alpha part using secure random
    const alphaPart = await SecureRandom.generateAlphanumeric(alphaLength, {
      uppercase: true,
      lowercase: false,
      numbers: false,
      excludeAmbiguous: false,
    })

    // Generate numeric part
    const numericPart = await SecureRandom.generateNumericCode(numericLength)

    return `${alphaPart}${separator}${numericPart}`
  }

  /**
   * Validate short code format
   */
  static validateShortCode(code: string): boolean {
    // Remove dashes and validate
    const cleanCode = code.replace(/-/g, '')

    // Check length (4-16 characters)
    if (cleanCode.length < 4 || cleanCode.length > 16) {
      return false
    }

    // Check characters (only safe alphanumeric)
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(cleanCode)
  }

  /**
   * Validate batch code format
   */
  static validateBatchCode(code: string): boolean {
    // Format: PREFIX-YYYY-MM-XXX
    const pattern =
      /^[A-Z]{2,10}-\d{4}-\d{2}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2,8}$/

    return pattern.test(code)
  }

  /**
   * Parse batch code to extract components
   */
  static parseBatchCode(code: string): {
    prefix: string
    year: number
    month: number
    sequence: string
  } | null {
    if (!this.validateBatchCode(code)) {
      return null
    }

    const parts = code.split('-')

    if (parts.length !== 4) {
      return null
    }

    return {
      prefix: parts[0],
      year: parseInt(parts[1], 10),
      month: parseInt(parts[2], 10),
      sequence: parts[3],
    }
  }

  /**
   * Generate QR code friendly string (high density, no ambiguous chars)
   */
  static async generateQRFriendlyCode(length: number = 12): Promise<string> {
    if (length < 8 || length > 32) {
      throw CryptoErrorFactory.invalidKey(
        'QR friendly code length must be between 8 and 32 characters',
      )
    }

    // Use alphanumeric mode for optimal QR density
    return SecureRandom.generateAlphanumeric(length, {
      uppercase: true,
      lowercase: false,
      numbers: true,
      excludeAmbiguous: true,
    })
  }

  /**
   * Calculate check digit using Luhn algorithm (for validation)
   */
  static calculateCheckDigit(code: string): string {
    // Convert letters to numbers (A=10, B=11, etc.)
    const digits = code.split('').map((char) => {
      if (/[0-9]/.test(char)) {
        return parseInt(char, 10)
      } else {
        return char.charCodeAt(0) - 65 + 10 // A=10, B=11, etc.
      }
    })

    // Apply Luhn algorithm
    let sum = 0
    let isEven = false

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = get(digits, i, 0)

      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit = Math.floor(digit / 10) + (digit % 10)
        }
      }

      sum += digit
      isEven = !isEven
    }

    const checkDigit = (10 - (sum % 10)) % 10

    return checkDigit.toString()
  }

  /**
   * Generate code with check digit
   */
  static async generateCodeWithCheckDigit(
    baseLength: number = 7,
  ): Promise<string> {
    const baseCode = await this.generateQRFriendlyCode(baseLength)
    const checkDigit = this.calculateCheckDigit(baseCode)

    return baseCode + checkDigit
  }

  /**
   * Validate code with check digit
   */
  static validateCodeWithCheckDigit(code: string): boolean {
    if (code.length < 5) return false

    const baseCode = code.slice(0, -1)
    const providedCheckDigit = code.slice(-1)
    const calculatedCheckDigit = this.calculateCheckDigit(baseCode)

    return providedCheckDigit === calculatedCheckDigit
  }

  /**
   * Format code for display (add separators for readability)
   */
  static formatCodeForDisplay(code: string, groupSize: number = 4): string {
    const cleanCode = code.replace(/[-\s]/g, '')
    const groups = []

    for (let i = 0; i < cleanCode.length; i += groupSize) {
      groups.push(cleanCode.substring(i, i + groupSize))
    }

    return groups.join('-')
  }

  /**
   * Generate time-based expiring code (includes timestamp)
   */
  static async generateExpiringCode(
    ttlMinutes: number = 60,
    codeLength: number = 8,
  ): Promise<{
    code: string
    expiresAt: Date
    timestamp: string
  }> {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)
    const timestamp = Math.floor(expiresAt.getTime() / 1000)
      .toString(36)
      .toUpperCase()

    const randomPart = await SecureRandom.generateAlphanumeric(
      codeLength - timestamp.length,
      {
        uppercase: true,
        lowercase: false,
        numbers: true,
        excludeAmbiguous: true,
      },
    )

    return {
      code: timestamp + randomPart,
      expiresAt,
      timestamp,
    }
  }
}
