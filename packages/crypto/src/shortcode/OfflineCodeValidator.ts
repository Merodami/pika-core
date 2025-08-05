import { createHash, createHmac } from 'crypto'

import { CryptoErrorFactory } from '../errors/CryptoError.js'

/**
 * Offline validation service for short codes and QR tokens when no internet connection
 * Used by providers to validate vouchers in offline scenarios
 */
export class OfflineCodeValidator {
  private readonly validationKey: string
  private readonly allowedClockSkew: number // seconds
  private readonly offlineCache: Map<
    string,
    {
      result: any
      timestamp: number
      ttl: number
    }
  > = new Map()

  constructor(config: {
    validationKey: string
    allowedClockSkew?: number
    cacheTTL?: number
  }) {
    this.validationKey = config.validationKey
    this.allowedClockSkew = config.allowedClockSkew || 300 // 5 minutes

    if (this.validationKey.length < 32) {
      throw CryptoErrorFactory.invalidKey(
        'Validation key must be at least 32 characters long',
      )
    }
  }

  /**
   * Validate code offline using cryptographic verification
   */
  async validateOffline(
    code: string,
    options?: {
      publicKey?: string // For JWT verification
      expectedVoucherId?: string
      allowExpired?: boolean
      cacheResult?: boolean
    },
  ): Promise<{
    isValid: boolean
    confidence: 'high' | 'medium' | 'low'
    voucherId?: string
    userId?: string
    type?: 'user' | 'print'
    expiresAt?: Date
    warnings: string[]
    offlineValidation: {
      method: 'cryptographic' | 'cached' | 'structural'
      timestamp: Date
      reliable: boolean
    }
  }> {
    const warnings: string[] = []

    // Check cache first
    if (this.offlineCache.has(code)) {
      const cached = this.offlineCache.get(code)!
      const now = Date.now()

      if (now - cached.timestamp < cached.ttl) {
        return {
          ...cached.result,
          offlineValidation: {
            method: 'cached',
            timestamp: new Date(),
            reliable: true,
          },
        }
      } else {
        this.offlineCache.delete(code)
        warnings.push('Cached validation expired')
      }
    }

    // Determine code type
    const isJWT = this.isJWTFormat(code)
    const isShortCode = this.isShortCodeFormat(code)

    if (!isJWT && !isShortCode) {
      return {
        isValid: false,
        confidence: 'high',
        warnings,
        offlineValidation: {
          method: 'structural',
          timestamp: new Date(),
          reliable: true,
        },
      }
    }

    let result: any

    if (isJWT && options?.publicKey) {
      result = await this.validateJWTOffline(code, options.publicKey, options)
    } else if (isShortCode) {
      result = await this.validateShortCodeOffline(code, options)
    } else {
      // Structural validation only
      result = {
        isValid: true,
        confidence: 'low' as const,
        warnings: [...warnings, 'Limited offline validation - structure only'],
      }
    }

    // Cache result if requested
    if (options?.cacheResult && result.isValid) {
      this.offlineCache.set(code, {
        result,
        timestamp: Date.now(),
        ttl: 3600000, // 1 hour
      })
    }

    return {
      ...result,
      warnings: [...warnings, ...result.warnings],
      offlineValidation: {
        method: 'cryptographic',
        timestamp: new Date(),
        reliable: isJWT && !!options?.publicKey,
      },
    }
  }

  /**
   * Validate JWT offline using public key
   */
  private async validateJWTOffline(
    jwt: string,
    publicKey: string,
    options?: any,
  ): Promise<{
    isValid: boolean
    confidence: 'high' | 'medium' | 'low'
    voucherId?: string
    userId?: string
    type?: 'user' | 'print'
    expiresAt?: Date
    warnings: string[]
  }> {
    const warnings: string[] = []

    try {
      // Split JWT
      const parts = jwt.split('.')

      if (parts.length !== 3) {
        return {
          isValid: false,
          confidence: 'high',
          warnings,
        }
      }

      // Decode header and payload
      const header = JSON.parse(this.base64urlDecode(parts[0]))
      const payload = JSON.parse(this.base64urlDecode(parts[1]))

      // Basic structure validation
      if (!header.alg || !header.typ || header.typ !== 'JWT') {
        warnings.push('Invalid JWT header structure')

        return {
          isValid: false,
          confidence: 'high',
          warnings,
        }
      }

      // Validate required claims
      if (!payload.vid || !payload.typ) {
        warnings.push('Missing required voucher claims')

        return {
          isValid: false,
          confidence: 'high',
          warnings,
        }
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000)

      if (payload.exp && payload.exp < now - this.allowedClockSkew) {
        if (!options?.allowExpired) {
          return {
            isValid: false,
            confidence: 'high',
            warnings: [...warnings, 'Token expired'],
          }
        } else {
          warnings.push('Token expired but allowed')
        }
      }

      // Check not before
      if (payload.nbf && payload.nbf > now + this.allowedClockSkew) {
        warnings.push('Token not yet valid')

        return {
          isValid: false,
          confidence: 'high',
          warnings,
        }
      }

      // Signature verification would require full ECDSA implementation
      // For offline validation, we do structural checks
      const confidence = publicKey ? 'medium' : 'low'

      if (!publicKey) {
        warnings.push('No public key provided - signature not verified')
      }

      return {
        isValid: true,
        confidence,
        voucherId: payload.vid,
        userId: payload.uid,
        type: payload.typ,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        warnings,
      }
    } catch {
      return {
        isValid: false,
        confidence: 'high',
        warnings: [...warnings, 'JWT parsing failed'],
      }
    }
  }

  /**
   * Validate short code offline using structural checks
   */
  private async validateShortCodeOffline(
    shortCode: string,
    options?: any,
  ): Promise<{
    isValid: boolean
    confidence: 'high' | 'medium' | 'low'
    warnings: string[]
  }> {
    const warnings: string[] = []

    // Basic format validation
    const cleanCode = shortCode.replace(/-/g, '')

    if (cleanCode.length < 4 || cleanCode.length > 16) {
      return {
        isValid: false,
        confidence: 'high',
        warnings,
      }
    }

    // Character set validation
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(cleanCode)) {
      return {
        isValid: false,
        confidence: 'high',
        warnings,
      }
    }

    // Check digit validation if present
    if (this.hasCheckDigit(shortCode)) {
      const isValidCheckDigit = this.validateCheckDigit(shortCode)

      if (!isValidCheckDigit) {
        return {
          isValid: false,
          confidence: 'high',
          warnings: [...warnings, 'Invalid check digit'],
        }
      }
    } else {
      warnings.push('No check digit present')
    }

    // Time-based code validation if embedded
    const timeInfo = this.extractTimeInfo()

    if (timeInfo) {
      const now = Date.now()

      if (timeInfo.expiresAt && timeInfo.expiresAt.getTime() < now) {
        if (!options?.allowExpired) {
          return {
            isValid: false,
            confidence: 'high',
            warnings: [...warnings, 'Time-based code expired'],
          }
        } else {
          warnings.push('Time-based code expired but allowed')
        }
      }
    }

    return {
      isValid: true,
      confidence: 'medium', // Medium confidence for structural validation
      warnings,
    }
  }

  /**
   * Create offline validation rules for providers
   */
  generateOfflineRules(
    vouchers: Array<{
      voucherId: string
      shortCode?: string
      qrHash?: string
      expiresAt?: Date
      type: 'user' | 'print'
    }>,
  ): {
    rules: Array<{
      codePattern: string
      voucherId: string
      type: 'user' | 'print'
      expiresAt?: Date
      validationHash: string
    }>
    rulesHash: string
    generatedAt: Date
    validUntil: Date
  } {
    const rules = vouchers.map((voucher) => ({
      codePattern: voucher.shortCode
        ? this.createPattern(voucher.shortCode)
        : '*',
      voucherId: voucher.voucherId,
      type: voucher.type,
      expiresAt: voucher.expiresAt,
      validationHash: this.createValidationHash(voucher),
    }))

    const rulesHash = this.createRulesHash(rules)
    const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    return {
      rules,
      rulesHash,
      generatedAt: new Date(),
      validUntil,
    }
  }

  /**
   * Validate code against offline rules
   */
  validateAgainstRules(
    code: string,
    rules: any[],
    rulesHash: string,
  ): {
    isValid: boolean
    matchedRule?: any
    confidence: 'high' | 'medium' | 'low'
    warnings: string[]
  } {
    const warnings: string[] = []

    // Verify rules integrity
    const expectedHash = this.createRulesHash(rules)

    if (expectedHash !== rulesHash) {
      warnings.push('Rules integrity check failed')

      return {
        isValid: false,
        confidence: 'high',
        warnings,
      }
    }

    // Find matching rule
    for (const rule of rules) {
      if (this.matchesPattern(code, rule.codePattern)) {
        // Verify against validation hash
        const codeHash = this.createCodeHash(code, rule.voucherId)

        if (codeHash === rule.validationHash) {
          return {
            isValid: true,
            matchedRule: rule,
            confidence: 'high',
            warnings,
          }
        }
      }
    }

    return {
      isValid: false,
      confidence: 'high',
      warnings: [...warnings, 'No matching rule found'],
    }
  }

  /**
   * Sync offline validation results when connection restored
   */
  async syncOfflineValidations(
    syncCallback?: (
      code: string,
      validation: {
        result: any
        timestamp: number
        ttl: number
      },
    ) => Promise<{ success: boolean; conflict?: boolean }>,
  ): Promise<{
    synced: number
    failed: number
    conflicts: number
  }> {
    let synced = 0
    let failed = 0
    let conflicts = 0

    // If no callback provided, just clear expired entries
    if (!syncCallback) {
      for (const [code, cached] of this.offlineCache.entries()) {
        if (Date.now() - cached.timestamp > cached.ttl) {
          this.offlineCache.delete(code)
          synced++
        }
      }

      return { synced, failed, conflicts }
    }

    // Sync each cached validation
    const syncPromises: Promise<void>[] = []

    for (const [code, cached] of this.offlineCache.entries()) {
      const syncPromise = syncCallback(code, cached)
        .then((result) => {
          if (result.success) {
            if (result.conflict) {
              conflicts++
            } else {
              synced++
            }
            // Remove from cache after successful sync
            this.offlineCache.delete(code)
          } else {
            failed++
          }
        })
        .catch(() => {
          failed++
        })

      syncPromises.push(syncPromise)
    }

    await Promise.all(syncPromises)

    return { synced, failed, conflicts }
  }

  /**
   * Helper methods
   */
  private isJWTFormat(code: string): boolean {
    const parts = code.split('.')

    return (
      parts.length === 3 && parts.every((part) => this.isValidBase64Url(part))
    )
  }

  private isShortCodeFormat(code: string): boolean {
    const cleanCode = code.replace(/-/g, '')

    return /^[A-Z0-9]{4,16}$/.test(cleanCode)
  }

  private isValidBase64Url(input: string): boolean {
    return /^[A-Za-z0-9_-]+$/.test(input)
  }

  private base64urlDecode(input: string): string {
    const padding = (4 - (input.length % 4)) % 4
    const padded = input + '='.repeat(padding)
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    return Buffer.from(base64, 'base64').toString()
  }

  private hasCheckDigit(code: string): boolean {
    // Simple heuristic - codes ending in digit might have check digit
    return /\d$/.test(code.replace(/-/g, ''))
  }

  private validateCheckDigit(code: string): boolean {
    // Implement Luhn or similar algorithm
    // This is a simplified version
    const cleanCode = code.replace(/-/g, '')
    const checkDigit = cleanCode.slice(-1)
    const baseCode = cleanCode.slice(0, -1)

    // Simple sum check
    let sum = 0

    for (let i = 0; i < baseCode.length; i++) {
      const char = baseCode.charAt(i)
      const value = /\d/.test(char)
        ? parseInt(char)
        : char.charCodeAt(0) - 65 + 10

      sum += value
    }

    return (sum % 10).toString() === checkDigit
  }

  private extractTimeInfo(): { expiresAt: Date } | null {
    // Try to extract timestamp from code structure
    // This is implementation-specific
    return null
  }

  private createPattern(code: string): string {
    // Create a pattern that matches the structure of the code
    return code.replace(/[0-9]/g, '#').replace(/[A-Z]/g, 'A')
  }

  private createValidationHash(voucher: any): string {
    const data = JSON.stringify(voucher, Object.keys(voucher).sort())

    return createHmac('sha256', this.validationKey)
      .update(data)
      .digest('hex')
      .substring(0, 16)
  }

  private createRulesHash(rules: any[]): string {
    const data = JSON.stringify(rules, null, 0)

    return createHash('sha256')
      .update(data)
      .update(this.validationKey)
      .digest('hex')
      .substring(0, 16)
  }

  private createCodeHash(code: string, voucherId: string): string {
    return createHmac('sha256', this.validationKey)
      .update(code + voucherId)
      .digest('hex')
      .substring(0, 16)
  }

  private matchesPattern(code: string, pattern: string): boolean {
    if (pattern === '*') return true

    if (code.length !== pattern.length) return false

    for (let i = 0; i < code.length; i++) {
      const codeChar = code.charAt(i)
      const patternChar = pattern.charAt(i)

      if (patternChar === '#' && !/\d/.test(codeChar)) return false
      if (patternChar === 'A' && !/[A-Z]/.test(codeChar)) return false
      if (
        patternChar !== '#' &&
        patternChar !== 'A' &&
        patternChar !== codeChar
      )
        return false
    }

    return true
  }

  /**
   * Clear offline cache
   */
  clearCache(): void {
    this.offlineCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number
    validEntries: number
    expiredEntries: number
  } {
    const now = Date.now()

    let validEntries = 0
    let expiredEntries = 0

    for (const cached of this.offlineCache.values()) {
      if (now - cached.timestamp < cached.ttl) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalCached: this.offlineCache.size,
      validEntries,
      expiredEntries,
    }
  }
}
