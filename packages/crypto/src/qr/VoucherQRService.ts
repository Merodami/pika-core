import { CryptoErrorFactory } from '../errors/CryptoError.js'
import type {
  JWTConfig,
  QRMetadata,
  RedemptionClaims,
  VoucherInfo,
} from '../types/crypto.types.js'
import { CodeGenerationUtils } from '../utils/codeGeneration.js'
import { VoucherValidationUtils } from '../utils/voucherValidation.js'
import { QRCodeService } from './QRCodeService.js'

/**
 * High-level voucher QR service with caching and optimization
 */
export class VoucherQRService extends QRCodeService {
  private readonly qrCache: Map<
    string,
    {
      qrPayload: string
      expiresAt: Date
      metadata: QRMetadata
    }
  > = new Map()

  private readonly cleanupInterval: NodeJS.Timeout

  constructor(config: JWTConfig) {
    super(config)

    // Clean up expired QR codes every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredQRCodes()
      },
      5 * 60 * 1000,
    )
  }

  /**
   * Generate optimized user voucher QR with caching
   */
  async generateUserVoucherQROptimized(
    voucherId: string,
    userId: string,
    privateKey: string,
    options?: {
      ttl?: number
      enableCaching?: boolean
      optimizeForMobile?: boolean
    },
  ): Promise<{
    qrPayload: string
    shortCode: string // Fallback code
    claims: RedemptionClaims
    expiresAt: Date
    metadata: QRMetadata & {
      cached: boolean
    }
  }> {
    const cacheKey = `user:${voucherId}:${userId}`
    const enableCaching = options?.enableCaching !== false
    const optimizeForMobile = options?.optimizeForMobile !== false

    // Check cache first
    if (enableCaching && this.qrCache.has(cacheKey)) {
      const cached = this.qrCache.get(cacheKey)!

      if (cached.expiresAt > new Date()) {
        const shortCode = await this.generateFallbackShortCode(
          voucherId,
          userId,
        )

        return {
          qrPayload: cached.qrPayload,
          shortCode,
          claims: this.extractClaimsFromPayload(cached.qrPayload),
          expiresAt: cached.expiresAt,
          metadata: {
            ...cached.metadata,
            cached: true,
            optimized: optimizeForMobile,
          },
        }
      } else {
        this.qrCache.delete(cacheKey)
      }
    }

    // Optimize TTL for mobile scanning
    let ttl = options?.ttl || 300

    if (optimizeForMobile && ttl > 600) {
      ttl = 600 // Max 10 minutes for mobile optimization
    }

    // Generate new QR code
    const qrResult = await this.generateUserVoucherQR(
      voucherId,
      userId,
      privateKey,
      { ttl },
    )

    // Generate fallback short code
    const shortCode = await this.generateFallbackShortCode(voucherId, userId)

    // Cache if enabled and mobile optimized
    if (enableCaching && optimizeForMobile) {
      this.qrCache.set(cacheKey, {
        qrPayload: qrResult.qrPayload,
        expiresAt: qrResult.expiresAt,
        metadata: qrResult.metadata,
      })
    }

    return {
      ...qrResult,
      shortCode,
      metadata: {
        ...qrResult.metadata,
        cached: false,
        optimized: optimizeForMobile,
      },
    }
  }

  /**
   * Generate print voucher QR with batch optimization
   */
  async generatePrintVoucherBatch(
    vouchers: Array<{
      voucherId: string
      title?: string
      description?: string
    }>,
    privateKey: string,
    options?: {
      batchPrefix?: string
      ttl?: number
      limit?: number
      campaignId?: string
    },
  ): Promise<{
    batchCode: string
    qrCodes: Array<{
      voucherId: string
      qrPayload: string
      shortCode: string
      claims: RedemptionClaims
      metadata: QRMetadata
    }>
    expiresAt: Date
    batchMetadata: {
      totalVouchers: number
      batchSize: number
      estimatedPrintPages: number
      campaignId?: string
    }
  }> {
    if (vouchers.length === 0) {
      throw CryptoErrorFactory.invalidKey('Voucher batch cannot be empty')
    }

    if (vouchers.length > 1000) {
      throw CryptoErrorFactory.invalidKey(
        'Batch size too large (max 1000 vouchers)',
      )
    }

    // Generate batch code
    const batchCode = await CodeGenerationUtils.generateBatchCode({
      prefix: options?.batchPrefix,
      sequenceLength: 4,
    })

    const qrCodes = []
    const ttl = options?.ttl || 86400 * 30 // 30 days default

    // Generate QR codes for each voucher
    for (const voucher of vouchers) {
      const qrResult = await this.generatePrintVoucherQR(
        voucher.voucherId,
        batchCode,
        privateKey,
        {
          ttl,
          limit: options?.limit,
          campaignId: options?.campaignId,
        },
      )

      // Generate short code for print fallback
      const shortCode = await CodeGenerationUtils.generateShortCode({
        length: 8,
        prefix: 'P',
      })

      qrCodes.push({
        voucherId: voucher.voucherId,
        qrPayload: qrResult.qrPayload,
        shortCode,
        claims: qrResult.claims,
        metadata: {
          ...qrResult.metadata,
          title: voucher.title,
          description: voucher.description,
        },
      })
    }

    // Calculate print estimates (assuming 2 vouchers per page)
    const estimatedPrintPages = Math.ceil(vouchers.length / 2)

    return {
      batchCode,
      qrCodes,
      expiresAt: qrCodes[0]?.claims.exp
        ? new Date(qrCodes[0].claims.exp * 1000)
        : new Date(),
      batchMetadata: {
        totalVouchers: vouchers.length,
        batchSize: qrCodes.length,
        estimatedPrintPages,
        campaignId: options?.campaignId,
      },
    }
  }

  /**
   * Validate QR with enhanced error reporting
   */
  async validateQREnhanced(
    qrPayload: string,
    publicKey: string,
    context?: {
      providerId?: string
      location?: { lat: number; lng: number }
      allowExpired?: boolean
      requireSpecificVoucher?: string
    },
  ): Promise<{
    isValid: boolean
    voucherInfo?: VoucherInfo
    validationErrors: string[]
    securityWarnings: string[]
    recommendations: string[]
  }> {
    const validationErrors: string[] = []
    const securityWarnings: string[] = []
    const recommendations: string[] = []

    // Basic validation
    const result = await this.validateQR(qrPayload, publicKey, {
      allowExpired: context?.allowExpired,
    })

    if (!result.isValid) {
      validationErrors.push(result.error || 'Unknown validation error')

      // Add specific recommendations based on error type
      if (result.error?.includes('expired')) {
        recommendations.push('Request a new QR code from the customer')
        recommendations.push('Check if voucher is still valid in the system')
      } else if (result.error?.includes('signature')) {
        securityWarnings.push('Invalid cryptographic signature detected')
        recommendations.push(
          'Do not accept this voucher - possible fraud attempt',
        )
      }

      return {
        isValid: false,
        validationErrors,
        securityWarnings,
        recommendations,
      }
    }

    const claims = result.payload!
    const voucherInfo = result.voucherInfo!

    // Additional validations
    if (
      context?.requireSpecificVoucher &&
      claims.vid !== context.requireSpecificVoucher
    ) {
      validationErrors.push(
        `Expected voucher ${context.requireSpecificVoucher}, got ${claims.vid}`,
      )
    }

    // Security warnings
    if (VoucherValidationUtils.isNearExpiration(claims, 60)) {
      securityWarnings.push('QR code expires soon - validate quickly')
    }

    if (claims.typ === 'print' && claims.lmt && claims.lmt > 1000) {
      securityWarnings.push('High redemption limit for print voucher')
    }

    // Recommendations
    if (voucherInfo.tokenType === 'user') {
      recommendations.push('Verify customer identity if required')
    }

    if (voucherInfo.tokenType === 'print') {
      recommendations.push('Check if customer has physical voucher book')
      recommendations.push('Verify batch code with campaign information')
    }

    return {
      isValid: true,
      voucherInfo,
      validationErrors,
      securityWarnings,
      recommendations,
    }
  }

  /**
   * Generate fallback short code for offline redemption
   */
  private async generateFallbackShortCode(
    voucherId: string,
    userId?: string,
  ): Promise<string> {
    // For user vouchers, create a unique short code
    if (userId) {
      // Use first 4 chars of voucher ID + 8 random chars for QR friendly code
      const voucherPrefix = voucherId
        .replace(/-/g, '')
        .substring(0, 4)
        .toUpperCase()
      const randomSuffix = await CodeGenerationUtils.generateQRFriendlyCode(8)

      return `${voucherPrefix}-${randomSuffix.substring(0, 4)}`
    }

    // For print vouchers, use standard generation
    return CodeGenerationUtils.generateShortCode({
      length: 8,
      prefix: 'V',
    })
  }

  /**
   * Extract claims from cached QR payload
   */
  private extractClaimsFromPayload(qrPayload: string): RedemptionClaims {
    const decoded = this.extractQRMetadata(qrPayload)

    if (!decoded.voucherId) {
      throw CryptoErrorFactory.invalidToken('Cannot decode cached QR payload')
    }

    // For cached payloads, reconstruct minimal claims
    return {
      vid: decoded.voucherId,
      typ: decoded.tokenType || 'user',
      iat: decoded.issuedAt
        ? Math.floor(decoded.issuedAt.getTime() / 1000)
        : undefined,
      exp: decoded.expiresAt
        ? Math.floor(decoded.expiresAt.getTime() / 1000)
        : undefined,
      btc: decoded.batchCode,
    } as RedemptionClaims
  }

  /**
   * Clean up expired QR codes from cache
   */
  private cleanupExpiredQRCodes(): void {
    const now = new Date()

    for (const [key, value] of this.qrCache.entries()) {
      if (value.expiresAt <= now) {
        this.qrCache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number
    validEntries: number
    expiredEntries: number
    cacheHitRate?: number
  } {
    const now = new Date()

    let validEntries = 0
    let expiredEntries = 0

    for (const value of this.qrCache.values()) {
      if (value.expiresAt > now) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalCached: this.qrCache.size,
      validEntries,
      expiredEntries,
    }
  }

  /**
   * Check if a QR code is expiring soon
   */
  async isExpiringSoon(
    qrPayload: string,
    thresholdSeconds: number = 300, // 5 minutes default
  ): Promise<{
    isExpiring: boolean
    remainingSeconds: number
    expiresAt?: Date
  }> {
    try {
      const expiration = await this.checkExpiration(qrPayload)
      const isExpiring =
        expiration.remainingSeconds > 0 &&
        expiration.remainingSeconds <= thresholdSeconds

      return {
        isExpiring,
        remainingSeconds: expiration.remainingSeconds,
        expiresAt: expiration.expiresAt || undefined,
      }
    } catch {
      return {
        isExpiring: false,
        remainingSeconds: -1,
      }
    }
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.qrCache.clear()
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clearCache()
  }
}
