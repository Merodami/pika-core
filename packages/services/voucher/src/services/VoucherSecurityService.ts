import { ECDSAService, type JWTConfig, VoucherQRService } from '@pika/crypto'
import { JWT_ISSUER } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'

import {
  generateBatchCode,
  generateSecureShortCode,
  type VoucherCode,
} from '../utils/codeGenerator.js'

export interface VoucherTokenData {
  voucherId: string
  qrPayload: string
  shortCode: string
  batchId?: string
}

export interface GenerateTokenOptions {
  voucherId: string
  providerId: string
  batchId?: string
  ttl?: number
  includeShortCode?: boolean
}

/**
 * Service responsible for voucher security token generation
 * Handles JWT tokens for QR codes and short code generation
 */
export class VoucherSecurityService {
  private voucherQRService: VoucherQRService
  private ecdsaService: ECDSAService
  private keyPair: { privateKey: string; publicKey: string } | null = null

  constructor() {
    if (!JWT_ISSUER) {
      throw new Error(
        'JWT_ISSUER environment variable is required for voucher security',
      )
    }

    const jwtConfig: JWTConfig = {
      algorithm: 'ES256',
      issuer: JWT_ISSUER,
      audience: 'pika-vouchers',
      keyId: 'voucher-security-key',
    }

    this.voucherQRService = new VoucherQRService(jwtConfig)
    this.ecdsaService = new ECDSAService({ curve: 'P-256' })
  }

  /**
   * Initialize ECDSA key pair for voucher token generation
   */
  async initialize(): Promise<void> {
    if (!this.keyPair) {
      this.keyPair = await this.ecdsaService.generateKeyPair()
      logger.info('Generated ECDSA key pair for voucher security')
    }
  }

  /**
   * Get the private key, generating it if necessary
   */
  private async getPrivateKey(): Promise<string> {
    await this.initialize()

    return this.keyPair!.privateKey
  }

  /**
   * Get the public key for verification
   */
  async getPublicKey(): Promise<string> {
    await this.initialize()

    return this.keyPair!.publicKey
  }

  /**
   * Generate security tokens for a single voucher
   */
  async generateVoucherTokens(
    options: GenerateTokenOptions,
  ): Promise<VoucherTokenData> {
    try {
      const privateKey = await this.getPrivateKey()

      // Generate QR payload using print voucher format for voucher books
      const qrResult = await this.voucherQRService.generatePrintVoucherQR(
        options.voucherId,
        options.batchId || `batch-${Date.now()}`,
        privateKey,
        { ttl: options.ttl || 31536000 }, // 1 year default for printed vouchers
      )

      // Generate short code
      const shortCode = await generateSecureShortCode({
        length: 8,
        includeDash: true,
      })

      logger.debug('Generated voucher tokens', {
        voucherId: options.voucherId,
        providerId: options.providerId,
        shortCode,
        batchId: options.batchId,
      })

      return {
        voucherId: options.voucherId,
        qrPayload: qrResult.qrPayload,
        shortCode,
        batchId: options.batchId,
      }
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to generate voucher tokens', {
        source: 'VoucherSecurityService.generateVoucherTokens',
      })
    }
  }

  /**
   * Generate tokens for multiple vouchers in batch (for voucher books)
   */
  async generateBatchVoucherTokens(
    vouchers: Array<{
      voucherId: string
      providerId: string
    }>,
    batchId?: string,
  ): Promise<Map<string, VoucherTokenData>> {
    const tokensMap = new Map<string, VoucherTokenData>()

    try {
      // Generate batch ID if not provided
      const finalBatchId = batchId || (await generateBatchCode())

      // Generate tokens in parallel for better performance
      const promises = vouchers.map(async (voucher) => {
        const tokenData = await this.generateVoucherTokens({
          ...voucher,
          batchId: finalBatchId,
        })

        return tokenData
      })

      const results = await Promise.all(promises)

      for (const tokenData of results) {
        tokensMap.set(tokenData.voucherId, tokenData)
      }

      logger.info('Generated batch voucher tokens', {
        batchId: finalBatchId,
        count: tokensMap.size,
      })

      return tokensMap
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to generate batch voucher tokens',
        {
          source: 'VoucherSecurityService.generateBatchVoucherTokens',
        },
      )
    }
  }

  /**
   * Verify a voucher QR token
   */
  async verifyVoucherToken(
    token: string,
  ): Promise<{ valid: boolean; voucherId?: string; batchId?: string }> {
    try {
      const publicKey = await this.getPublicKey()
      const result = await this.voucherQRService.validateQR(token, publicKey)

      if (result.isValid && result.payload) {
        return {
          valid: true,
          voucherId: result.payload.vid, // vid is the voucher ID claim
          batchId: result.payload.btc, // btc is the batch code claim
        }
      }

      return { valid: false }
    } catch (error) {
      logger.error('Failed to verify voucher token', { error })

      return { valid: false }
    }
  }

  /**
   * Generate voucher codes for different use cases
   */
  async generateVoucherCodes(
    voucherId: string,
    options?: {
      includeQR?: boolean
      includeShortCode?: boolean
      includeStaticCode?: boolean
      staticCode?: string
    },
  ): Promise<VoucherCode[]> {
    const codes: VoucherCode[] = []

    // Generate QR token
    if (options?.includeQR !== false) {
      const privateKey = await this.getPrivateKey()
      const qrResult = await this.voucherQRService.generatePrintVoucherQR(
        voucherId,
        `voucher-${Date.now()}`,
        privateKey,
      )

      codes.push({
        code: qrResult.qrPayload,
        type: 'QR',
        metadata: {
          algorithm: 'ES256',
          generatedAt: new Date().toISOString(),
        },
      })
    }

    // Generate short code
    if (options?.includeShortCode !== false) {
      const shortCode = await generateSecureShortCode({
        length: 8,
        includeDash: true,
      })

      codes.push({
        code: shortCode,
        type: 'SHORT',
        metadata: {
          length: shortCode.length,
          generatedAt: new Date().toISOString(),
        },
      })
    }

    // Add static code if provided
    if (options?.includeStaticCode && options.staticCode) {
      codes.push({
        code: options.staticCode,
        type: 'STATIC',
        metadata: {
          userProvided: true,
          generatedAt: new Date().toISOString(),
        },
      })
    }

    return codes
  }
}
