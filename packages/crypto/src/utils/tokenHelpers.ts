import { createHash } from 'crypto'
import { get } from 'lodash-es'

import { SecureRandom } from '../random/SecureRandom.js'
import type {
  JWTValidationResult,
  RedemptionClaims,
} from '../types/crypto.types.js'

/**
 * Token helper utilities for JWT and QR code handling
 */
export class TokenHelpers {
  /**
   * Extract voucher ID from various token formats
   */
  static extractVoucherIdFromToken(token: string): string | null {
    try {
      // Try to decode as JWT first
      const parts = token.split('.')

      if (parts.length === 3) {
        const payload = this.base64urlDecode(parts[1])
        const claims = JSON.parse(payload) as RedemptionClaims

        return claims.vid || null
      }

      // If not JWT, might be a short code with embedded voucher ID
      // This depends on implementation - could be a lookup table
      return null
    } catch {
      return null
    }
  }

  /**
   * Create token fingerprint for uniqueness checking
   */
  static createTokenFingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex').substring(0, 16)
  }

  /**
   * Check if token is a JWT format
   */
  static isJWTFormat(token: string): boolean {
    const parts = token.split('.')

    if (parts.length !== 3) return false

    try {
      // Try to decode header
      const header = JSON.parse(this.base64urlDecode(parts[0]))

      return header.typ === 'JWT'
    } catch {
      return false
    }
  }

  /**
   * Check if token is a short code format
   */
  static isShortCodeFormat(token: string): boolean {
    // Short codes are typically 4-16 alphanumeric characters, possibly with dash
    const cleanToken = token.replace(/-/g, '')

    return /^[A-Z0-9]{4,16}$/.test(cleanToken) && !this.isJWTFormat(token)
  }

  /**
   * Extract token metadata without verification
   */
  static extractTokenMetadata(token: string): {
    type: 'jwt' | 'short_code' | 'unknown'
    format?: string
    estimatedSize?: number
    hasExpiration?: boolean
  } {
    if (this.isJWTFormat(token)) {
      try {
        const parts = token.split('.')
        const header = JSON.parse(this.base64urlDecode(parts[0]))
        const payload = JSON.parse(this.base64urlDecode(parts[1]))

        return {
          type: 'jwt',
          format: header.alg,
          estimatedSize: token.length,
          hasExpiration: !!payload.exp,
        }
      } catch {
        return { type: 'unknown' }
      }
    } else if (this.isShortCodeFormat(token)) {
      return {
        type: 'short_code',
        estimatedSize: token.length,
        hasExpiration: false, // Short codes typically don't expire by themselves
      }
    }

    return { type: 'unknown' }
  }

  /**
   * Create token usage audit record
   */
  static createAuditRecord(
    token: string,
    event: 'generated' | 'validated' | 'redeemed' | 'rejected',
    context?: {
      userId?: string
      voucherId?: string
      providerId?: string
      location?: { lat: number; lng: number }
      userAgent?: string
      ipAddress?: string
    },
  ): {
    tokenFingerprint: string
    event: string
    timestamp: number
    context: any
  } {
    return {
      tokenFingerprint: this.createTokenFingerprint(token),
      event,
      timestamp: Date.now(),
      context: {
        ...context,
        tokenType: this.extractTokenMetadata(token).type,
      },
    }
  }

  /**
   * Validate token format without cryptographic verification
   */
  static validateTokenFormat(token: string): {
    isValid: boolean
    type: 'jwt' | 'short_code' | 'unknown'
    errors: string[]
  } {
    const errors: string[] = []

    if (!token || typeof token !== 'string') {
      errors.push('Token must be a non-empty string')

      return { isValid: false, type: 'unknown', errors }
    }

    if (token.length > 2048) {
      errors.push('Token too long (max 2048 characters)')
    }

    if (this.isJWTFormat(token)) {
      const parts = token.split('.')

      // Validate each part is base64url
      for (let i = 0; i < parts.length; i++) {
        const part = get(parts, i, '')

        if (!this.isValidBase64Url(part)) {
          errors.push(`Invalid base64url encoding in part ${i + 1}`)
        }
      }

      return {
        isValid: errors.length === 0,
        type: 'jwt',
        errors,
      }
    } else if (this.isShortCodeFormat(token)) {
      const cleanToken = token.replace(/-/g, '')

      if (cleanToken.length < 4) {
        errors.push('Short code too short (min 4 characters)')
      }

      if (cleanToken.length > 16) {
        errors.push('Short code too long (max 16 characters)')
      }

      return {
        isValid: errors.length === 0,
        type: 'short_code',
        errors,
      }
    }

    errors.push('Unknown token format')

    return { isValid: false, type: 'unknown', errors }
  }

  /**
   * Generate nonce for token uniqueness
   */
  static async generateNonce(length: number = 16): Promise<string> {
    return SecureRandom.generateToken(length)
  }

  /**
   * Create token with embedded expiration
   */
  static createTokenWithEmbeddedExpiration(
    baseToken: string,
    expirationMinutes: number,
  ): string {
    const expiryTimestamp = Math.floor(
      (Date.now() + expirationMinutes * 60 * 1000) / 1000,
    )
    const expiryHex = expiryTimestamp.toString(16).padStart(8, '0')

    return `${baseToken}.${expiryHex}`
  }

  /**
   * Extract expiration from token with embedded expiration
   */
  static extractEmbeddedExpiration(token: string): Date | null {
    const parts = token.split('.')

    if (parts.length < 2) return null

    try {
      const expiryHex = parts[parts.length - 1]
      const expiryTimestamp = parseInt(expiryHex, 16)

      if (isNaN(expiryTimestamp)) return null

      return new Date(expiryTimestamp * 1000)
    } catch {
      return null
    }
  }

  /**
   * Create error response for token validation
   */
  static createValidationError(message: string): JWTValidationResult {
    return {
      isValid: false,
      error: message,
      // Additional error details could be added here
    }
  }

  /**
   * Sanitize token for logging (hide sensitive parts)
   */
  static sanitizeTokenForLogging(token: string): string {
    if (this.isJWTFormat(token)) {
      const parts = token.split('.')

      if (parts.length === 3) {
        // Show header and payload (base64 encoded), hide signature
        return `${parts[0]}.${parts[1]}.***`
      }
    } else if (this.isShortCodeFormat(token)) {
      // Show first and last 2 chars, hide middle
      if (token.length > 4) {
        const start = token.substring(0, 2)
        const end = token.substring(token.length - 2)
        const middle = '*'.repeat(token.length - 4)

        return `${start}${middle}${end}`
      }
    }

    return '***'
  }

  /**
   * Base64URL decode utility
   */
  private static base64urlDecode(input: string): string {
    // Add padding if needed
    const padding = (4 - (input.length % 4)) % 4
    const padded = input + '='.repeat(padding)

    // Convert base64url to base64
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    return Buffer.from(base64, 'base64').toString()
  }

  /**
   * Validate base64url format
   */
  private static isValidBase64Url(input: string): boolean {
    // Base64url uses A-Z, a-z, 0-9, -, _ and no padding
    return /^[A-Za-z0-9_-]+$/.test(input)
  }

  /**
   * Calculate JWT token size and complexity
   */
  static analyzeTokenComplexity(token: string): {
    byteSize: number
    qrCodeVersion: number
    estimatedScanTime: 'fast' | 'medium' | 'slow'
    mobileOptimized: boolean
  } {
    const byteSize = Buffer.byteLength(token, 'utf8')

    // QR Code version estimation (rough)
    let qrCodeVersion = 1

    if (byteSize > 25) qrCodeVersion = 2
    if (byteSize > 47) qrCodeVersion = 3
    if (byteSize > 77) qrCodeVersion = 4
    if (byteSize > 114) qrCodeVersion = 5

    // Scanning time estimation
    let estimatedScanTime: 'fast' | 'medium' | 'slow' = 'fast'

    if (byteSize > 100) estimatedScanTime = 'medium'
    if (byteSize > 200) estimatedScanTime = 'slow'

    return {
      byteSize,
      qrCodeVersion,
      estimatedScanTime,
      mobileOptimized: byteSize <= 150, // Optimal for mobile scanning
    }
  }
}
