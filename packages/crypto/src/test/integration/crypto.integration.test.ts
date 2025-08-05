import { describe, expect, it } from 'vitest'

import { ECDSAService } from '../../ecdsa/ECDSAService.js'
import { JWTService } from '../../jwt/JWTService.js'
import type { JWTConfig, RedemptionClaims } from '../../types/crypto.types.js'

describe('Crypto Integration Tests', () => {
  describe('ECDSA + JWT Integration', () => {
    it('should generate and verify JWT tokens for user vouchers', async () => {
      // Setup
      const ecdsaService = new ECDSAService({ curve: 'P-256' })
      const keyPair = await ecdsaService.generateKeyPair()

      const jwtConfig: JWTConfig = {
        issuer: 'pika-platform',
        audience: 'pika-vouchers',
        algorithm: 'ES256',
        keyId: 'integration-test-key',
      }
      const jwtService = new JWTService(jwtConfig)

      // Create user voucher token
      const userClaims: RedemptionClaims = {
        vid: 'voucher-001',
        uid: 'user-123',
        typ: 'user',
      }

      const token = await jwtService.generateToken(
        userClaims,
        keyPair.privateKey,
        300, // 5 minutes TTL
      )

      // Verify token
      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(true)
      expect(result.payload?.vid).toBe('voucher-001')
      expect(result.payload?.uid).toBe('user-123')
      expect(result.payload?.typ).toBe('user')
      expect(result.payload?.exp).toBeDefined()
    })

    it('should generate and verify JWT tokens for print vouchers', async () => {
      // Setup
      const ecdsaService = new ECDSAService({ curve: 'P-256' })
      const keyPair = await ecdsaService.generateKeyPair()

      const jwtConfig: JWTConfig = {
        issuer: 'pika-platform',
        audience: 'pika-vouchers',
        algorithm: 'ES256',
      }
      const jwtService = new JWTService(jwtConfig)

      // Create print voucher token
      const printClaims: RedemptionClaims = {
        vid: 'voucher-print-001',
        typ: 'print',
        btc: 'BATCH2024Q1',
        lmt: 100,
      }

      const token = await jwtService.generateToken(
        printClaims,
        keyPair.privateKey,
        86400 * 30, // 30 days TTL for print vouchers
      )

      // Verify token
      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(true)
      expect(result.payload?.vid).toBe('voucher-print-001')
      expect(result.payload?.uid).toBeUndefined()
      expect(result.payload?.typ).toBe('print')
      expect(result.payload?.btc).toBe('BATCH2024Q1')
      expect(result.payload?.lmt).toBe(100)
    })

    it('should work with different ECDSA curves', async () => {
      const curves = [
        { curve: 'P-256' as const, algorithm: 'ES256' as const },
        { curve: 'P-384' as const, algorithm: 'ES384' as const },
        { curve: 'P-521' as const, algorithm: 'ES512' as const },
        { curve: 'secp256k1' as const, algorithm: 'ES256K' as const },
      ]

      for (const { curve, algorithm } of curves) {
        const ecdsaService = new ECDSAService({ curve })
        const keyPair = await ecdsaService.generateKeyPair()

        const jwtService = new JWTService({
          issuer: 'pika-platform',
          audience: 'pika-vouchers',
          algorithm,
        })

        const token = await jwtService.generateToken(
          { vid: `test-${curve}`, typ: 'user' },
          keyPair.privateKey,
        )

        const result = await jwtService.verifyToken(token, keyPair.publicKey)

        expect(result.isValid).toBe(true)
        expect(result.payload?.vid).toBe(`test-${curve}`)
      }
    })

    it('should handle key rotation scenario', async () => {
      // Setup with old key
      const ecdsaService = new ECDSAService({ curve: 'P-256' })
      const oldKeyPair = await ecdsaService.generateKeyPair()

      const jwtService = new JWTService({
        issuer: 'pika-platform',
        audience: 'pika-vouchers',
        algorithm: 'ES256',
        keyId: 'key-v1',
      })

      // Generate token with old key
      const token = await jwtService.generateToken(
        { vid: 'voucher-rotation', typ: 'user' },
        oldKeyPair.privateKey,
      )

      // Verify with old key still works
      const result1 = await jwtService.verifyToken(token, oldKeyPair.publicKey)

      expect(result1.isValid).toBe(true)

      // Generate new key for rotation
      const newKeyPair = await ecdsaService.generateKeyPair()

      // Create new JWT service with new key ID
      const newJwtService = new JWTService({
        issuer: 'pika-platform',
        audience: 'pika-vouchers',
        algorithm: 'ES256',
        keyId: 'key-v2',
      })

      // Generate new token with new key
      const newToken = await newJwtService.generateToken(
        { vid: 'voucher-rotation-new', typ: 'user' },
        newKeyPair.privateKey,
      )

      // Verify new token with new key
      const result2 = await newJwtService.verifyToken(
        newToken,
        newKeyPair.publicKey,
      )

      expect(result2.isValid).toBe(true)

      // Old token should fail with new key
      const result3 = await jwtService.verifyToken(token, newKeyPair.publicKey)

      expect(result3.isValid).toBe(false)
    })

    it('should export and import keys for backup/restore', async () => {
      // Generate keys
      const ecdsaService = new ECDSAService({ curve: 'P-256' })
      const originalKeyPair = await ecdsaService.generateKeyPair()

      // Export keys
      const exportedPublicKey = await ecdsaService.exportPublicKey(
        originalKeyPair.publicKey,
      )
      const exportedPrivateKey = await ecdsaService.exportPrivateKey(
        originalKeyPair.privateKey,
      )

      // Simulate backup/restore by creating new service
      const restoredEcdsaService = new ECDSAService({ curve: 'P-256' })

      // Import keys
      const importedPublicKey =
        await restoredEcdsaService.importPublicKey(exportedPublicKey)
      const importedPrivateKey =
        await restoredEcdsaService.importPrivateKey(exportedPrivateKey)

      // Create JWT with original keys
      const jwtService = new JWTService({
        issuer: 'pika-platform',
        audience: 'pika-vouchers',
        algorithm: 'ES256',
      })

      const token = await jwtService.generateToken(
        { vid: 'backup-test', typ: 'user' },
        originalKeyPair.privateKey,
      )

      // Verify with imported keys
      const result = await jwtService.verifyToken(token, importedPublicKey)

      expect(result.isValid).toBe(true)

      // Create token with imported private key
      const tokenFromImported = await jwtService.generateToken(
        { vid: 'restored-test', typ: 'user' },
        importedPrivateKey,
      )

      // Verify with original public key
      const result2 = await jwtService.verifyToken(
        tokenFromImported,
        originalKeyPair.publicKey,
      )

      expect(result2.isValid).toBe(true)
    })
  })
})
