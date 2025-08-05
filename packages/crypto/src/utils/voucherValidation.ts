import { CryptoErrorFactory } from '../errors/CryptoError.js'
import { SecureRandom } from '../random/SecureRandom.js'
import type { RedemptionClaims } from '../types/crypto.types.js'

/**
 * Voucher validation utilities for the PIKA platform
 */
export class VoucherValidationUtils {
  /**
   * Validate voucher redemption claims
   */
  static validateRedemptionClaims(claims: RedemptionClaims): void {
    // Validate voucher ID format (UUID v4)
    if (!this.isValidUUID(claims.vid)) {
      throw CryptoErrorFactory.invalidToken('Invalid voucher ID format', {
        voucherId: claims.vid,
      })
    }

    // Validate user ID if present (for user-specific vouchers)
    if (claims.uid && !this.isValidUUID(claims.uid)) {
      throw CryptoErrorFactory.invalidToken('Invalid user ID format', {
        userId: claims.uid,
      })
    }

    // Validate token type
    if (!['user', 'print'].includes(claims.typ)) {
      throw CryptoErrorFactory.invalidToken(
        'Invalid token type. Must be "user" or "print"',
        { tokenType: claims.typ },
      )
    }

    // For print vouchers, batch code is required
    if (claims.typ === 'print' && !claims.btc) {
      throw CryptoErrorFactory.invalidToken(
        'Batch code required for print vouchers',
      )
    }

    // For user vouchers, user ID is required
    if (claims.typ === 'user' && !claims.uid) {
      throw CryptoErrorFactory.invalidToken(
        'User ID required for user vouchers',
      )
    }

    // Validate expiration time
    if (claims.exp && claims.exp <= Math.floor(Date.now() / 1000)) {
      throw CryptoErrorFactory.tokenExpired(new Date(claims.exp * 1000))
    }

    // Validate issued at time (not too far in future)
    if (claims.iat && claims.iat > Math.floor(Date.now() / 1000) + 300) {
      // Allow 5 minutes clock skew
      throw CryptoErrorFactory.invalidToken(
        'Token issued too far in the future',
      )
    }

    // Validate redemption limit for print vouchers
    if (claims.lmt && (claims.lmt < 1 || claims.lmt > 10000)) {
      throw CryptoErrorFactory.invalidToken(
        'Invalid redemption limit. Must be between 1 and 10000',
        { limit: claims.lmt },
      )
    }
  }

  /**
   * Create voucher redemption claims for user vouchers
   */
  static createUserVoucherClaims(
    voucherId: string,
    userId: string,
    options?: {
      ttl?: number // TTL in seconds
      issuer?: string
      audience?: string
    },
  ): RedemptionClaims {
    const now = Math.floor(Date.now() / 1000)
    const ttl = options?.ttl || 300 // Default 5 minutes for user vouchers

    return {
      vid: voucherId,
      uid: userId,
      typ: 'user',
      iss: options?.issuer || 'pika-voucher-service',
      aud: options?.audience || 'pika-redemption-service',
      iat: now,
      exp: now + ttl,
      jti: this.generateJTI(),
    }
  }

  /**
   * Create voucher redemption claims for print vouchers
   */
  static createPrintVoucherClaims(
    voucherId: string,
    batchCode: string,
    options?: {
      ttl?: number // TTL in seconds
      limit?: number // Redemption limit
      issuer?: string
      audience?: string
    },
  ): RedemptionClaims {
    const now = Math.floor(Date.now() / 1000)
    const ttl = options?.ttl || 86400 * 30 // Default 30 days for print vouchers

    return {
      vid: voucherId,
      typ: 'print',
      btc: batchCode,
      lmt: options?.limit || 1000, // Default limit for print vouchers
      iss: options?.issuer || 'pika-voucher-service',
      aud: options?.audience || 'pika-redemption-service',
      iat: now,
      exp: now + ttl,
      jti: this.generateJTI(),
    }
  }

  /**
   * Extract voucher info from validated claims
   */
  static extractVoucherInfo(claims: RedemptionClaims): {
    voucherId: string
    userId?: string
    tokenType: 'user' | 'print'
    batchCode?: string
    limit?: number
    expiresAt: Date
    issuedAt: Date
  } {
    return {
      voucherId: claims.vid,
      userId: claims.uid,
      tokenType: claims.typ,
      batchCode: claims.btc,
      limit: claims.lmt,
      expiresAt: new Date((claims.exp || 0) * 1000),
      issuedAt: new Date((claims.iat || 0) * 1000),
    }
  }

  /**
   * Check if token is near expiration (within warning threshold)
   */
  static isNearExpiration(
    claims: RedemptionClaims,
    warningThresholdSeconds: number = 60,
  ): boolean {
    if (!claims.exp) return false

    const now = Math.floor(Date.now() / 1000)

    return claims.exp - now <= warningThresholdSeconds
  }

  /**
   * Generate unique JWT ID
   */
  private static generateJTI(): string {
    return SecureRandom.generateUUID().replace(/-/g, '').substring(0, 16)
  }

  /**
   * Validate UUID v4 format
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    return uuidRegex.test(uuid)
  }

  /**
   * Sanitize claims for logging (remove sensitive data)
   */
  static sanitizeClaimsForLogging(
    claims: RedemptionClaims,
  ): Partial<RedemptionClaims> {
    return {
      vid: claims.vid,
      typ: claims.typ,
      iss: claims.iss,
      aud: claims.aud,
      exp: claims.exp,
      iat: claims.iat,
      jti: claims.jti,
      // Exclude uid and btc for privacy
      ...(claims.lmt && { lmt: claims.lmt }),
    }
  }

  /**
   * Calculate remaining TTL in seconds
   */
  static getRemainingTTL(claims: RedemptionClaims): number {
    if (!claims.exp) return -1

    const now = Math.floor(Date.now() / 1000)

    return Math.max(0, claims.exp - now)
  }
}
