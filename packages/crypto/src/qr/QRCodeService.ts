import { CryptoErrorFactory } from '../errors/CryptoError.js'
import { JWTService } from '../jwt/JWTService.js'
import type {
  JWTConfig,
  JWTValidationResult,
  QRMetadata,
  RedemptionClaims,
} from '../types/crypto.types.js'
import { TokenHelpers } from '../utils/tokenHelpers.js'
import { VoucherValidationUtils } from '../utils/voucherValidation.js'

/**
 * QR Code generation and validation service for voucher redemption
 */
export class QRCodeService {
  private readonly jwtService: JWTService

  constructor(config: JWTConfig) {
    this.jwtService = new JWTService(config)
  }

  /**
   * Generate QR code payload (JWT) for user voucher redemption
   */
  async generateUserVoucherQR(
    voucherId: string,
    userId: string,
    privateKey: string,
    options?: {
      ttl?: number // TTL in seconds (default: 5 minutes)
      nonce?: string
    },
  ): Promise<{
    qrPayload: string
    claims: RedemptionClaims
    expiresAt: Date
    metadata: QRMetadata
  }> {
    try {
      // Create user voucher claims
      const claims = VoucherValidationUtils.createUserVoucherClaims(
        voucherId,
        userId,
        {
          ttl: options?.ttl || 300, // 5 minutes for real-time redemption
        },
      )

      // Add nonce if provided
      if (options?.nonce) {
        claims.jti = options.nonce
      }

      // Generate JWT token
      const qrPayload = await this.jwtService.generateToken(
        claims,
        privateKey,
        claims.exp ? claims.exp - claims.iat! : undefined,
      )

      // Analyze token complexity
      const complexity = TokenHelpers.analyzeTokenComplexity(qrPayload)

      return {
        qrPayload,
        claims,
        expiresAt: new Date((claims.exp || 0) * 1000),
        metadata: {
          tokenType: 'user',
          byteSize: complexity.byteSize,
          complexity: this.determineComplexityLevel(
            complexity.estimatedScanTime,
          ),
          qrCodeVersion: complexity.qrCodeVersion,
          estimatedScanTime: complexity.estimatedScanTime,
          mobileOptimized: complexity.mobileOptimized,
        },
      }
    } catch (error) {
      throw CryptoErrorFactory.invalidToken(
        'Failed to generate user voucher QR code',
        { voucherId, userId },
        error as Error,
      )
    }
  }

  /**
   * Generate QR code payload (JWT) for print voucher redemption
   */
  async generatePrintVoucherQR(
    voucherId: string,
    batchCode: string,
    privateKey: string,
    options?: {
      ttl?: number // TTL in seconds (default: 30 days)
      limit?: number // Redemption limit
      campaignId?: string
    },
  ): Promise<{
    qrPayload: string
    claims: RedemptionClaims
    expiresAt: Date
    metadata: QRMetadata
  }> {
    try {
      // Create print voucher claims
      const claims = VoucherValidationUtils.createPrintVoucherClaims(
        voucherId,
        batchCode,
        {
          ttl: options?.ttl || 86400 * 30, // 30 days for print vouchers
          limit: options?.limit,
        },
      )

      // Add campaign ID if provided
      if (options?.campaignId) {
        claims.sub = options.campaignId
      }

      // Generate JWT token
      const qrPayload = await this.jwtService.generateToken(
        claims,
        privateKey,
        claims.exp ? claims.exp - claims.iat! : undefined,
      )

      // Analyze token complexity
      const complexity = TokenHelpers.analyzeTokenComplexity(qrPayload)

      return {
        qrPayload,
        claims,
        expiresAt: new Date((claims.exp || 0) * 1000),
        metadata: {
          tokenType: 'print',
          byteSize: complexity.byteSize,
          complexity: this.determineComplexityLevel(
            complexity.estimatedScanTime,
          ),
          qrCodeVersion: complexity.qrCodeVersion,
          estimatedScanTime: complexity.estimatedScanTime,
          mobileOptimized: complexity.mobileOptimized,
        },
      }
    } catch (error) {
      throw CryptoErrorFactory.invalidToken(
        'Failed to generate print voucher QR code',
        { voucherId, batchCode },
        error as Error,
      )
    }
  }

  /**
   * Validate QR code payload and extract claims
   */
  async validateQR(
    qrPayload: string,
    publicKey: string,
    options?: {
      allowExpired?: boolean
      requireUserVoucher?: boolean
      requirePrintVoucher?: boolean
    },
  ): Promise<
    JWTValidationResult<RedemptionClaims> & {
      voucherInfo?: {
        voucherId: string
        userId?: string
        tokenType: 'user' | 'print'
        batchCode?: string
        expiresAt: Date
        issuedAt: Date
      }
    }
  > {
    try {
      // Validate token format first
      const formatValidation = TokenHelpers.validateTokenFormat(qrPayload)

      if (!formatValidation.isValid || formatValidation.type !== 'jwt') {
        return {
          isValid: false,
          error: `Invalid QR code format: ${formatValidation.errors.join(', ')}`,
        }
      }

      // Validate JWT signature and structure
      let jwtResult: JWTValidationResult<RedemptionClaims>

      try {
        jwtResult = await this.jwtService.verifyToken(qrPayload, publicKey)
      } catch (error) {
        // Handle expired token error if allowExpired is true
        if (
          options?.allowExpired &&
          error instanceof Error &&
          error.name.includes('TokenExpired')
        ) {
          // Decode without validation for expired tokens
          const parts = qrPayload.split('.')

          if (parts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64url').toString(),
            )

            jwtResult = {
              isValid: true,
              payload,
              header: JSON.parse(Buffer.from(parts[0], 'base64url').toString()),
            }
          } else {
            return {
              isValid: false,
              error: 'Invalid token format',
            }
          }
        } else {
          throw error
        }
      }

      if (!jwtResult.isValid) {
        return jwtResult
      }

      const claims = jwtResult.payload!

      // Validate voucher-specific claims
      try {
        VoucherValidationUtils.validateRedemptionClaims(claims)
      } catch (error) {
        if (error instanceof Error && error.name.includes('TokenExpired')) {
          if (!options?.allowExpired) {
            throw error
          }
        } else {
          return {
            isValid: false,
            error:
              error instanceof Error ? error.message : 'Invalid voucher claims',
          }
        }
      }

      // Check token type requirements
      if (options?.requireUserVoucher && claims.typ !== 'user') {
        return {
          isValid: false,
          error: 'User voucher required',
        }
      }

      if (options?.requirePrintVoucher && claims.typ !== 'print') {
        return {
          isValid: false,
          error: 'Print voucher required',
        }
      }

      // Extract voucher information
      const voucherInfo = VoucherValidationUtils.extractVoucherInfo(claims)

      return {
        isValid: true,
        payload: claims,
        header: jwtResult.header,
        voucherInfo,
      }
    } catch (error) {
      if (error instanceof Error && error.name.includes('TokenExpired')) {
        return {
          isValid: false,
          error: 'QR code has expired',
        }
      }

      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : 'QR code validation failed',
      }
    }
  }

  /**
   * Check if QR code is near expiration
   */
  async checkExpiration(
    qrPayload: string,
    warningThresholdSeconds: number = 60,
  ): Promise<{
    isNearExpiration: boolean
    remainingSeconds: number
    expiresAt: Date | null
  }> {
    try {
      // Decode without verification to check expiration
      const decoded = this.jwtService.decodeToken(qrPayload)

      if (!decoded) {
        return {
          isNearExpiration: false,
          remainingSeconds: -1,
          expiresAt: null,
        }
      }

      const claims = decoded.payload
      const remainingTTL = VoucherValidationUtils.getRemainingTTL(claims)
      const isNearExpiration = VoucherValidationUtils.isNearExpiration(
        claims,
        warningThresholdSeconds,
      )

      return {
        isNearExpiration,
        remainingSeconds: remainingTTL,
        expiresAt: claims.exp ? new Date(claims.exp * 1000) : null,
      }
    } catch {
      return {
        isNearExpiration: false,
        remainingSeconds: -1,
        expiresAt: null,
      }
    }
  }

  /**
   * Refresh QR code if near expiration (for user vouchers only)
   */
  async refreshQR(
    originalQRPayload: string,
    privateKey: string,
    options?: {
      newTTL?: number
      preserveNonce?: boolean
    },
  ): Promise<{
    qrPayload: string
    claims: RedemptionClaims
    expiresAt: Date
  } | null> {
    try {
      // Decode original token
      const decoded = this.jwtService.decodeToken(originalQRPayload)

      if (!decoded) {
        return null
      }

      const originalClaims = decoded.payload

      // Only refresh user vouchers (print vouchers have longer TTL)
      if (originalClaims.typ !== 'user') {
        return null
      }

      // Create new claims with extended TTL
      const newClaims = VoucherValidationUtils.createUserVoucherClaims(
        originalClaims.vid,
        originalClaims.uid!,
        {
          ttl: options?.newTTL || 300,
        },
      )

      // Preserve original nonce if requested
      if (options?.preserveNonce && originalClaims.jti) {
        newClaims.jti = originalClaims.jti
      }

      // Generate new JWT
      const qrPayload = await this.jwtService.generateToken(
        newClaims,
        privateKey,
        newClaims.exp ? newClaims.exp - newClaims.iat! : undefined,
      )

      return {
        qrPayload,
        claims: newClaims,
        expiresAt: new Date((newClaims.exp || 0) * 1000),
      }
    } catch {
      return null
    }
  }

  /**
   * Extract metadata from QR code without full validation
   */
  extractQRMetadata(qrPayload: string): {
    voucherId?: string
    tokenType?: 'user' | 'print'
    issuedAt?: Date
    expiresAt?: Date
    batchCode?: string
    tokenFingerprint: string
  } {
    const fingerprint = TokenHelpers.createTokenFingerprint(qrPayload)

    try {
      const decoded = this.jwtService.decodeToken(qrPayload)

      if (!decoded) {
        return { tokenFingerprint: fingerprint }
      }

      const claims = decoded.payload

      return {
        voucherId: claims.vid,
        tokenType: claims.typ,
        issuedAt: claims.iat ? new Date(claims.iat * 1000) : undefined,
        expiresAt: claims.exp ? new Date(claims.exp * 1000) : undefined,
        batchCode: claims.btc,
        tokenFingerprint: fingerprint,
      }
    } catch {
      return { tokenFingerprint: fingerprint }
    }
  }

  /**
   * Create audit log entry for QR operations
   */
  createAuditEntry(
    qrPayload: string,
    operation: 'generated' | 'validated' | 'redeemed' | 'rejected',
    context?: {
      userId?: string
      providerId?: string
      location?: { lat: number; lng: number }
      success?: boolean
      errorMessage?: string
    },
  ): any {
    const metadata = this.extractQRMetadata(qrPayload)

    return {
      ...TokenHelpers.createAuditRecord(qrPayload, operation, context),
      voucherMetadata: {
        voucherId: metadata.voucherId,
        tokenType: metadata.tokenType,
        batchCode: metadata.batchCode,
      },
      operation,
      success: context?.success !== false,
      errorMessage: context?.errorMessage,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Convert estimated scan time to complexity level
   */
  private determineComplexityLevel(
    estimatedScanTime: 'fast' | 'medium' | 'slow',
  ): 'low' | 'medium' | 'high' {
    switch (estimatedScanTime) {
      case 'fast':
        return 'low'
      case 'medium':
        return 'medium'
      case 'slow':
        return 'high'
      default:
        return 'medium'
    }
  }
}
