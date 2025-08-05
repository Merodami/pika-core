import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  CodeGenerationUtils,
  ECDSAService,
  KeyManager,
  OfflineCodeValidator,
  ShortCodeService,
  VoucherQRService,
  VoucherValidationUtils,
} from '../../index.js'

describe('Voucher Crypto Integration Flow', () => {
  let ecdsaService: ECDSAService
  let keyPair: any
  let qrService: VoucherQRService
  let shortCodeService: ShortCodeService
  let offlineValidator: OfflineCodeValidator

  // Mock Redis client for tests
  const mockRedisClient = {
    keys: () => Promise.resolve([]),
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK' as const),
    del: () => Promise.resolve(1),
  }

  beforeAll(async () => {
    // Initialize ECDSA service and generate test keys
    ecdsaService = new ECDSAService({ curve: 'P-256' })
    keyPair = await ecdsaService.generateKeyPair()

    // Initialize crypto services
    qrService = new VoucherQRService({
      algorithm: 'ES256',
      issuer: 'pika-test-service',
      audience: 'pika-test-platform',
      defaultTTL: 300,
    })

    shortCodeService = new ShortCodeService({
      secretKey: keyPair.privateKey,
      codeLength: 8,
      includeChecksum: true,
    })

    offlineValidator = new OfflineCodeValidator({
      validationKey: keyPair.publicKey,
      allowedClockSkew: 300,
    })

    new KeyManager(
      {
        redisPrefix: 'test:keys',
        defaultTTL: 86400,
      },
      mockRedisClient,
    )
  })

  afterAll(() => {
    qrService.dispose()
    offlineValidator.clearCache()
  })

  describe('End-to-End Voucher Redemption Flow', () => {
    const testVoucherId = '123e4567-e89b-4cd3-a456-426614174000' // Valid UUID v4
    const testUserId = '987fcdeb-51d2-4321-9123-456789abcdef' // Valid UUID v4
    const testBatchCode = 'PIKA-2025-01-TEST'

    it('should generate and validate user voucher QR code', async () => {
      // Generate QR code for user voucher
      const qrResult = await qrService.generateUserVoucherQROptimized(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
        {
          ttl: 300,
          optimizeForMobile: true,
        },
      )

      expect(qrResult.qrPayload).toBeDefined()
      expect(qrResult.shortCode).toBeDefined()
      expect(qrResult.claims.vid).toBe(testVoucherId)
      expect(qrResult.claims.uid).toBe(testUserId)
      expect(qrResult.claims.typ).toBe('user')
      expect(qrResult.metadata.optimized).toBe(true)

      // Validate the generated QR code
      const validationResult = await qrService.validateQREnhanced(
        qrResult.qrPayload,
        keyPair.publicKey,
        {
          allowExpired: false,
          requireSpecificVoucher: testVoucherId,
        },
      )

      expect(validationResult.isValid).toBe(true)
      expect(validationResult.voucherInfo?.voucherId).toBe(testVoucherId)
      expect(validationResult.voucherInfo?.userId).toBe(testUserId)
      expect(validationResult.validationErrors).toHaveLength(0)
    })

    it('should generate and validate print voucher batch', async () => {
      const vouchers = [
        {
          voucherId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Test Voucher 1',
        },
        {
          voucherId: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Test Voucher 2',
        },
        {
          voucherId: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Test Voucher 3',
        },
      ]

      // Generate batch of print vouchers
      const batchResult = await qrService.generatePrintVoucherBatch(
        vouchers,
        keyPair.privateKey,
        {
          batchPrefix: 'TEST',
          ttl: 86400 * 30, // 30 days
          limit: 100,
          campaignId: 'TEST-CAMPAIGN-2025',
        },
      )

      expect(batchResult.qrCodes).toHaveLength(3)
      expect(batchResult.batchCode).toMatch(/TEST-\d{4}-\d{2}-\w{4}/)
      expect(batchResult.batchMetadata.totalVouchers).toBe(3)

      // Validate each QR code in the batch
      for (const qrCode of batchResult.qrCodes) {
        const validationResult = await qrService.validateQR(
          qrCode.qrPayload,
          keyPair.publicKey,
          {
            requirePrintVoucher: true,
          },
        )

        expect(validationResult.isValid).toBe(true)
        expect(validationResult.voucherInfo?.tokenType).toBe('print')
        expect(validationResult.voucherInfo?.batchCode).toBe(
          batchResult.batchCode,
        )
      }
    })

    it('should generate and validate short codes', async () => {
      // Generate short code for user voucher
      const shortCodeResult = await shortCodeService.generateShortCode(
        testVoucherId,
        {
          userId: testUserId,
          type: 'user',
          expirationDays: 1,
        },
      )

      expect(shortCodeResult.shortCode).toBeDefined()
      expect(shortCodeResult.checksum).toBeDefined()
      expect(shortCodeResult.metadata.voucherId).toBe(testVoucherId)
      expect(shortCodeResult.metadata.type).toBe('user')

      // Validate the short code
      const validationResult = await shortCodeService.validateShortCode(
        shortCodeResult.shortCode,
        {
          checksum: shortCodeResult.checksum,
          expectedType: 'user',
        },
      )

      expect(validationResult.isValid).toBe(true)
      expect(validationResult.type).toBe('user')
    })

    it('should handle offline validation scenarios', async () => {
      // Generate QR code
      const qrResult = await qrService.generateUserVoucherQR(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
        { ttl: 3600 },
      )

      // Test offline validation with public key
      const offlineResult = await offlineValidator.validateOffline(
        qrResult.qrPayload,
        {
          publicKey: keyPair.publicKey,
          expectedVoucherId: testVoucherId,
          allowExpired: false,
        },
      )

      expect(offlineResult.isValid).toBe(true)
      expect(offlineResult.confidence).toBe('medium') // Medium because we're doing structural validation
      expect(offlineResult.voucherId).toBe(testVoucherId)
      expect(offlineResult.userId).toBe(testUserId)
      expect(offlineResult.offlineValidation.reliable).toBe(true)
    })

    it('should handle voucher validation utilities', async () => {
      // Test claims creation
      const userClaims = VoucherValidationUtils.createUserVoucherClaims(
        testVoucherId,
        testUserId,
        { ttl: 300 },
      )

      expect(userClaims.vid).toBe(testVoucherId)
      expect(userClaims.uid).toBe(testUserId)
      expect(userClaims.typ).toBe('user')
      expect(userClaims.exp).toBeDefined()

      // Test claims validation
      expect(() => {
        VoucherValidationUtils.validateRedemptionClaims(userClaims)
      }).not.toThrow()

      // Test print voucher claims
      const printClaims = VoucherValidationUtils.createPrintVoucherClaims(
        testVoucherId,
        testBatchCode,
        { ttl: 86400, limit: 500 },
      )

      expect(printClaims.vid).toBe(testVoucherId)
      expect(printClaims.btc).toBe(testBatchCode)
      expect(printClaims.typ).toBe('print')
      expect(printClaims.lmt).toBe(500)

      // Test voucher info extraction
      const voucherInfo = VoucherValidationUtils.extractVoucherInfo(printClaims)

      expect(voucherInfo.voucherId).toBe(testVoucherId)
      expect(voucherInfo.tokenType).toBe('print')
      expect(voucherInfo.batchCode).toBe(testBatchCode)
      expect(voucherInfo.limit).toBe(500)
    })

    it('should handle code generation utilities', async () => {
      // Test short code generation
      const shortCode = await CodeGenerationUtils.generateShortCode({
        length: 8,
        includeDash: true,
        prefix: 'V',
      })

      expect(shortCode).toMatch(/^V[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      expect(
        CodeGenerationUtils.validateShortCode(shortCode.substring(1)),
      ).toBe(true)

      // Test batch code generation
      const batchCode = await CodeGenerationUtils.generateBatchCode({
        prefix: 'PIKA',
        year: 2025,
        month: 1,
      })

      expect(batchCode).toMatch(/^PIKA-2025-01-[A-Z0-9]{3}$/)
      expect(CodeGenerationUtils.validateBatchCode(batchCode)).toBe(true)

      // Test batch code parsing
      const parsed = CodeGenerationUtils.parseBatchCode(batchCode)

      expect(parsed).toBeDefined()
      expect(parsed!.prefix).toBe('PIKA')
      expect(parsed!.year).toBe(2025)
      expect(parsed!.month).toBe(1)

      // Test QR friendly code
      const qrCode = await CodeGenerationUtils.generateQRFriendlyCode(12)

      expect(qrCode).toMatch(/^[A-Z0-9]{12}$/)
      expect(qrCode).toHaveLength(12)
    })

    it('should handle expiration and refresh scenarios', async () => {
      // Generate QR with short TTL
      const qrResult = await qrService.generateUserVoucherQR(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
        { ttl: 1 }, // 1 second
      )

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Check expiration
      const expirationCheck = await qrService.checkExpiration(
        qrResult.qrPayload,
      )

      expect(expirationCheck.remainingSeconds).toBeLessThanOrEqual(0)

      // Test validation with expired token
      const validationResult = await qrService.validateQR(
        qrResult.qrPayload,
        keyPair.publicKey,
        { allowExpired: true },
      )

      expect(validationResult.isValid).toBe(true) // Should be valid when allowing expired

      // Test validation without allowing expired
      const strictValidation = await qrService.validateQR(
        qrResult.qrPayload,
        keyPair.publicKey,
        { allowExpired: false },
      )

      expect(strictValidation.isValid).toBe(false)
      expect(strictValidation.error).toContain('expired')
    })

    it('should create audit entries for tracking', async () => {
      const qrResult = await qrService.generateUserVoucherQR(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
      )

      // Create audit entry for generation
      const auditEntry = qrService.createAuditEntry(
        qrResult.qrPayload,
        'generated',
        {
          userId: testUserId,
          providerId: 'test-provider-123',
          location: { lat: -25.2637, lng: -57.5759 }, // Asunción coordinates
          success: true,
        },
      )

      expect(auditEntry.operation).toBe('generated')
      expect(auditEntry.success).toBe(true)
      expect(auditEntry.voucherMetadata.voucherId).toBe(testVoucherId)
      expect(auditEntry.voucherMetadata.tokenType).toBe('user')
      expect(auditEntry.tokenFingerprint).toBeDefined()
      expect(auditEntry.timestamp).toBeDefined()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    const testUserId = '987fcdeb-51d2-4321-9123-456789abcdef' // Valid UUID v4
    const testVoucherId = '123e4567-e89b-4cd3-a456-426614174000' // Valid UUID v4

    it('should handle invalid voucher IDs', async () => {
      const claims = VoucherValidationUtils.createUserVoucherClaims(
        'invalid-uuid',
        testUserId,
      )

      expect(() => {
        VoucherValidationUtils.validateRedemptionClaims(claims)
      }).toThrow()
    })

    it('should handle invalid QR codes', async () => {
      const result = await qrService.validateQR(
        'invalid.qr.code',
        keyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid QR code format')
    })

    it('should handle wrong public key', async () => {
      // Generate QR with one key
      const qrResult = await qrService.generateUserVoucherQR(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
      )

      // Generate different key pair
      const otherKeyPair = await ecdsaService.generateKeyPair()

      // Try to validate with wrong public key
      const result = await qrService.validateQR(
        qrResult.qrPayload,
        otherKeyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should handle cache statistics and cleanup', async () => {
      // Generate some QR codes to populate cache
      await qrService.generateUserVoucherQROptimized(
        testVoucherId,
        testUserId,
        keyPair.privateKey,
        { enableCaching: true },
      )

      const stats = qrService.getCacheStats()

      expect(stats.totalCached).toBeGreaterThanOrEqual(0)

      // Test cache clearing
      qrService.clearCache()

      const clearedStats = qrService.getCacheStats()

      expect(clearedStats.totalCached).toBe(0)
    })
  })
})
