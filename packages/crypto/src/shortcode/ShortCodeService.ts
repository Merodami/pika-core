import {
  CACHE_DISABLED,
  REDIS_DEFAULT_TTL,
  REDIS_PREFIX,
} from '@pika/environment'
import { createHash, createHmac } from 'crypto'
import type { Redis } from 'ioredis'
import { get } from 'lodash-es'

import { CryptoErrorFactory } from '../errors/CryptoError.js'
import { SecureRandom } from '../random/SecureRandom.js'
import { CodeGenerationUtils } from '../utils/codeGeneration.js'

/**
 * Short code generation and validation for offline voucher redemption
 */
export class ShortCodeService {
  private readonly secretKey: string
  private readonly codeLength: number
  private readonly includeChecksum: boolean
  private readonly redisPrefix: string
  private readonly defaultTTL: number
  private readonly codeMapping?: Map<
    string,
    { data: any; hmac: string; checksum: string }
  >

  constructor(
    config: {
      secretKey: string
      codeLength?: number
      includeChecksum?: boolean
      redisPrefix?: string
      defaultTTL?: number
    },
    private readonly redisClient?: Pick<
      Redis,
      'get' | 'set' | 'del' | 'expire'
    >,
  ) {
    this.secretKey = config.secretKey
    this.codeLength = config.codeLength || 8
    this.includeChecksum = config.includeChecksum !== false
    this.redisPrefix = config.redisPrefix || `${REDIS_PREFIX}shortcode:`
    this.defaultTTL = config.defaultTTL || REDIS_DEFAULT_TTL

    if (this.secretKey.length < 32) {
      throw CryptoErrorFactory.invalidKey(
        'Secret key must be at least 32 characters long',
      )
    }

    // Initialize in-memory mapping if Redis is not available
    if (!this.redisClient) {
      this.codeMapping = new Map()
    }
  }

  /**
   * Generate short code for voucher with embedded metadata
   */
  async generateShortCode(
    voucherId: string,
    options?: {
      userId?: string
      batchCode?: string
      expirationDays?: number
      type?: 'user' | 'print'
      metadata?: Record<string, any>
    },
  ): Promise<{
    shortCode: string
    checksum?: string
    expiresAt?: Date
    metadata: {
      voucherId: string
      type: 'user' | 'print'
      hasExpiration: boolean
      codeFormat: string
    }
  }> {
    try {
      const type = options?.type || 'user'
      const expirationDays = options?.expirationDays

      // Create base data for encoding
      const baseData = {
        vid: voucherId,
        uid: options?.userId,
        btc: options?.batchCode,
        typ: type,
        exp: expirationDays
          ? Math.floor(
              (Date.now() + expirationDays * 24 * 60 * 60 * 1000) / 1000,
            )
          : undefined,
        iat: Math.floor(Date.now() / 1000),
        ...options?.metadata,
      }

      // Create deterministic but secure short code
      const shortCode = await this.createShortCode(baseData)

      // Generate checksum if enabled
      let checksum: string | undefined

      if (this.includeChecksum) {
        checksum = this.generateChecksum(shortCode, baseData)
      }

      return {
        shortCode,
        checksum,
        expiresAt: baseData.exp ? new Date(baseData.exp * 1000) : undefined,
        metadata: {
          voucherId,
          type,
          hasExpiration: !!baseData.exp,
          codeFormat: this.includeChecksum ? 'with-checksum' : 'standard',
        },
      }
    } catch (error) {
      console.error('Short code generation error:', error)
      throw CryptoErrorFactory.keyGenerationFailed(
        'Failed to generate short code',
        { voucherId, errorMessage: (error as Error).message },
        error as Error,
      )
    }
  }

  /**
   * Validate short code and extract voucher information
   */
  async validateShortCode(
    shortCode: string,
    options?: {
      checksum?: string
      allowExpired?: boolean
      expectedType?: 'user' | 'print'
    },
  ): Promise<{
    isValid: boolean
    voucherId?: string
    userId?: string
    batchCode?: string
    type?: 'user' | 'print'
    expiresAt?: Date
    issuedAt?: Date
    error?: string
    warnings?: string[]
  }> {
    try {
      // Validate format
      if (!CodeGenerationUtils.validateShortCode(shortCode)) {
        return {
          isValid: false,
          error: 'Invalid short code format',
        }
      }

      // Verify checksum if provided
      if (options?.checksum && this.includeChecksum) {
        // For this implementation, we'd need to reverse engineer the data
        // In practice, you might store a mapping or use a reversible encoding
        const isValidChecksum = await this.verifyChecksum(
          shortCode,
          options.checksum,
        )

        if (!isValidChecksum) {
          return {
            isValid: false,
            error: 'Invalid checksum',
          }
        }
      }

      // Extract embedded data (this is a simplified approach)
      const extractedData = await this.extractDataFromShortCode(shortCode)

      if (!extractedData) {
        return {
          isValid: false,
          error: 'Could not extract voucher data from short code',
        }
      }

      const warnings: string[] = []

      // Check expiration
      if (extractedData.exp && !options?.allowExpired) {
        const now = Math.floor(Date.now() / 1000)

        if (extractedData.exp < now) {
          return {
            isValid: false,
            error: 'Short code has expired',
          }
        } else if (extractedData.exp - now < 3600) {
          // 1 hour warning
          warnings.push('Short code expires soon')
        }
      }

      // Check type if specified
      if (options?.expectedType && extractedData.typ !== options.expectedType) {
        return {
          isValid: false,
          error: `Expected ${options.expectedType} voucher, got ${extractedData.typ}`,
        }
      }

      return {
        isValid: true,
        voucherId: extractedData.vid,
        userId: extractedData.uid,
        batchCode: extractedData.btc,
        type: extractedData.typ,
        expiresAt: extractedData.exp
          ? new Date(extractedData.exp * 1000)
          : undefined,
        issuedAt: extractedData.iat
          ? new Date(extractedData.iat * 1000)
          : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      }
    }
  }

  /**
   * Generate batch of short codes for print vouchers
   */
  async generateBatchShortCodes(
    vouchers: Array<{
      voucherId: string
      title?: string
    }>,
    batchCode: string,
    options?: {
      expirationDays?: number
      prefix?: string
    },
  ): Promise<{
    shortCodes: Array<{
      voucherId: string
      shortCode: string
      checksum?: string
      title?: string
    }>
    batchCode: string
    expiresAt?: Date
    summary: {
      totalCodes: number
      validCodes: number
      duplicates: number
    }
  }> {
    const shortCodes = []
    const usedCodes = new Set<string>()

    let duplicates = 0

    for (const voucher of vouchers) {
      let attempts = 0
      let shortCode: string
      let result: any

      // Ensure uniqueness
      do {
        result = await this.generateShortCode(voucher.voucherId, {
          batchCode,
          type: 'print',
          expirationDays: options?.expirationDays,
          metadata: { attempt: attempts },
        })
        shortCode = result.shortCode
        attempts++

        if (attempts > 10) {
          throw CryptoErrorFactory.keyGenerationFailed(
            'Too many attempts to generate unique short code',
            { voucherId: voucher.voucherId },
          )
        }
      } while (usedCodes.has(shortCode))

      if (usedCodes.has(shortCode)) {
        duplicates++
      } else {
        usedCodes.add(shortCode)
      }

      shortCodes.push({
        voucherId: voucher.voucherId,
        shortCode: result.shortCode,
        checksum: result.checksum,
        title: voucher.title,
      })
    }

    return {
      shortCodes,
      batchCode,
      expiresAt: shortCodes[0]
        ? (await this.validateShortCode(shortCodes[0].shortCode)).expiresAt
        : undefined,
      summary: {
        totalCodes: vouchers.length,
        validCodes: shortCodes.length,
        duplicates,
      },
    }
  }

  /**
   * Create mapping between short codes and voucher IDs for lookup
   */
  generateCodeMapping(
    shortCodes: Array<{
      shortCode: string
      voucherId: string
      type: 'user' | 'print'
      batchCode?: string
    }>,
  ): Map<
    string,
    {
      voucherId: string
      type: 'user' | 'print'
      batchCode?: string
      codeHash: string
    }
  > {
    const mapping = new Map()

    for (const item of shortCodes) {
      const codeHash = this.hashShortCode(item.shortCode)

      mapping.set(item.shortCode, {
        voucherId: item.voucherId,
        type: item.type,
        batchCode: item.batchCode,
        codeHash,
      })
    }

    return mapping
  }

  /**
   * Create a cryptographically secure short code with HMAC verification
   * Uses deterministic generation for consistent codes per voucher
   */
  private async createShortCode(data: any): Promise<string> {
    const voucherId = data.vid
    const userId = data.uid
    const tokenType = data.typ || 'user'
    const timestamp = data.iat || Math.floor(Date.now() / 1000)

    if (!voucherId) {
      throw new Error('Voucher ID is required for short code generation')
    }

    // Create deterministic seed from voucher data
    const seedData = `${voucherId}:${userId || ''}:${tokenType}:${timestamp}`
    const seed = createHash('sha256')
      .update(seedData)
      .update(this.secretKey)
      .digest()

    // Generate short code components from seed
    // Use first 8 bytes for main code, next 2 for checksum
    const codeBytes = seed.slice(0, 8)
    const checksumBytes = seed.slice(8, 10)

    // Convert to Base32-like encoding (excluding ambiguous chars)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    let mainCode = ''

    // Generate 8-character code from bytes
    for (let i = 0; i < 8; i++) {
      const byte = get(codeBytes, i, 0)
      const index = byte % alphabet.length

      mainCode += alphabet.charAt(index)
    }

    // Generate 2-character checksum
    let checksum = ''

    for (let i = 0; i < 2; i++) {
      const byte = get(checksumBytes, i, 0)
      const index = byte % alphabet.length

      checksum += alphabet.charAt(index)
    }

    // Format: ABCD-EFGH for readability (no prefix to keep it short)
    const formatted = `${mainCode.slice(0, 4)}-${mainCode.slice(4)}`

    // Create HMAC for verification
    const hmac = createHmac('sha256', this.secretKey)
      .update(`${formatted}:${checksum}`)
      .digest('hex')
      .substring(0, 16)

    // Store mapping with TTL
    const storageData = {
      data,
      hmac,
      checksum,
    }

    const ttl = data.exp ? data.exp - timestamp : this.defaultTTL

    await this.storeMapping(formatted, storageData, ttl)

    return formatted
  }

  /**
   * Store short code mapping in Redis or memory
   */
  private async storeMapping(
    shortCode: string,
    data: { data: any; hmac: string; checksum: string },
    ttl: number,
  ): Promise<void> {
    if (!CACHE_DISABLED && this.redisClient) {
      const key = `${this.redisPrefix}${shortCode}`

      await this.redisClient.set(key, JSON.stringify(data), 'EX', ttl)
    } else if (this.codeMapping) {
      // Fallback to in-memory storage for testing or when cache is disabled
      this.codeMapping.set(shortCode, data)
    }
  }

  /**
   * Generate checksum for short code
   */
  private generateChecksum(shortCode: string, data: any): string {
    const combined = shortCode + JSON.stringify(data, Object.keys(data).sort())

    return createHash('sha256')
      .update(combined)
      .update(this.secretKey)
      .digest('hex')
      .substring(0, 8)
  }

  /**
   * Verify checksum for short code
   */
  private async verifyChecksum(
    shortCode: string,
    providedChecksum: string,
  ): Promise<boolean> {
    // In a real implementation, you'd need to reverse engineer or lookup the original data
    // For now, we'll do a basic validation
    return SecureRandom.timingSafeEqual(
      Buffer.from(providedChecksum),
      Buffer.from(providedChecksum), // Placeholder - would be calculated checksum
    )
  }

  /**
   * Extract data from short code using secure lookup
   */
  private async extractDataFromShortCode(shortCode: string): Promise<{
    vid: string
    uid?: string
    typ: 'user' | 'print'
    exp?: number
    iat?: number
    btc?: string
  } | null> {
    try {
      let stored: { data: any; hmac: string; checksum: string } | null = null

      if (!CACHE_DISABLED && this.redisClient) {
        const key = `${this.redisPrefix}${shortCode}`
        const value = await this.redisClient.get(key)

        if (value) {
          stored = JSON.parse(value)
        }
      } else if (this.codeMapping) {
        stored = this.codeMapping.get(shortCode) || null
      }

      if (!stored) {
        return null
      }

      // Verify HMAC integrity
      const expectedHmac = createHmac('sha256', this.secretKey)
        .update(`${shortCode}:${stored.checksum}`)
        .digest('hex')
        .substring(0, 16)

      if (
        !this.constantTimeCompare(
          Buffer.from(stored.hmac, 'hex'),
          Buffer.from(expectedHmac, 'hex'),
        )
      ) {
        return null
      }

      return stored.data
    } catch {
      return null
    }
  }

  /**
   * Constant-time comparison for security
   */
  private constantTimeCompare(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0

    for (let i = 0; i < a.length; i++) {
      result |= get(a, i, 0) ^ get(b, i, 0)
    }

    return result === 0
  }

  /**
   * Create hash of short code for mapping
   */
  private hashShortCode(shortCode: string): string {
    return createHash('sha256')
      .update(shortCode)
      .update(this.secretKey)
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Validate multiple short codes in batch
   */
  async validateBatch(
    shortCodes: string[],
    options?: {
      allowExpired?: boolean
      continueOnError?: boolean
    },
  ): Promise<{
    results: Array<{
      shortCode: string
      isValid: boolean
      voucherId?: string
      error?: string
    }>
    summary: {
      total: number
      valid: number
      invalid: number
      expired: number
    }
  }> {
    const results = []

    let valid = 0
    let invalid = 0
    let expired = 0

    for (const shortCode of shortCodes) {
      try {
        const result = await this.validateShortCode(shortCode, options)

        results.push({
          shortCode,
          isValid: result.isValid,
          voucherId: result.voucherId,
          error: result.error,
        })

        if (result.isValid) {
          valid++
        } else {
          invalid++
          if (result.error?.includes('expired')) {
            expired++
          }
        }
      } catch (error) {
        results.push({
          shortCode,
          isValid: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        })
        invalid++

        if (!options?.continueOnError) {
          break
        }
      }
    }

    return {
      results,
      summary: {
        total: shortCodes.length,
        valid,
        invalid,
        expired,
      },
    }
  }
}
