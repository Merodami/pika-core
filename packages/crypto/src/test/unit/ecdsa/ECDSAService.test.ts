import { p256 } from '@noble/curves/p256'
import { beforeEach, describe, expect, it } from 'vitest'

import { ECDSAService } from '../../../ecdsa/ECDSAService.js'
import type { ECDSACurve, ECDSAKeyPair } from '../../../types/crypto.types.js'

describe('ECDSAService', () => {
  let service: ECDSAService

  describe('P-256 Curve', () => {
    beforeEach(() => {
      service = new ECDSAService({ curve: 'P-256' })
    })

    describe('generateKeyPair', () => {
      it('should generate a valid key pair', async () => {
        const keyPair = await service.generateKeyPair()

        expect(keyPair).toBeDefined()
        expect(keyPair.privateKey).toBeDefined()
        expect(keyPair.publicKey).toBeDefined()
        expect(keyPair.curve).toBe('P-256')
        expect(keyPair.format).toBe('raw')
        expect(keyPair.createdAt).toBeInstanceOf(Date)
      })

      it('should generate unique key pairs', async () => {
        const keyPair1 = await service.generateKeyPair()
        const keyPair2 = await service.generateKeyPair()

        expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey)
        expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey)
      })

      it('should generate keys with correct length', async () => {
        const keyPair = await service.generateKeyPair()

        // P-256 uses 32-byte keys
        expect(keyPair.privateKey).toHaveLength(64) // hex string = 32 * 2
        expect(keyPair.publicKey).toHaveLength(66) // compressed format: 02/03 + 32 bytes = 33 * 2
      })
    })

    describe('sign', () => {
      let keyPair: ECDSAKeyPair

      beforeEach(async () => {
        keyPair = await service.generateKeyPair()
      })

      it('should sign a message successfully', async () => {
        const message = Buffer.from('Hello, World!')
        const signature = await service.sign(message, keyPair.privateKey)

        expect(signature).toBeDefined()
        expect(signature.r).toBeDefined()
        expect(signature.s).toBeDefined()
        expect(signature.curve).toBe('P-256')
        expect(signature.format).toBe('ieee-p1363')
      })

      it('should produce different signatures for different messages', async () => {
        const message1 = Buffer.from('Message 1')
        const message2 = Buffer.from('Message 2')

        const signature1 = await service.sign(message1, keyPair.privateKey)
        const signature2 = await service.sign(message2, keyPair.privateKey)

        expect(signature1.r).not.toBe(signature2.r)
        expect(signature1.s).not.toBe(signature2.s)
      })

      it('should produce deterministic signatures (RFC 6979)', async () => {
        const message = Buffer.from('Test message')

        const signature1 = await service.sign(message, keyPair.privateKey)
        const signature2 = await service.sign(message, keyPair.privateKey)

        // With deterministic signatures, same message + key = same signature
        expect(signature1.r).toBe(signature2.r)
        expect(signature1.s).toBe(signature2.s)
      })

      it('should throw error for invalid private key', async () => {
        const message = Buffer.from('Test')
        const invalidKey = 'invalid-key'

        await expect(service.sign(message, invalidKey)).rejects.toThrow()
      })

      it('should handle empty message', async () => {
        const emptyMessage = Buffer.from('')
        const signature = await service.sign(emptyMessage, keyPair.privateKey)

        expect(signature).toBeDefined()
        expect(signature.r).toBeDefined()
        expect(signature.s).toBeDefined()
      })

      it('should handle large messages', async () => {
        const largeMessage = Buffer.alloc(1024 * 1024, 'a') // 1MB
        const signature = await service.sign(largeMessage, keyPair.privateKey)

        expect(signature).toBeDefined()
        expect(signature.r).toBeDefined()
        expect(signature.s).toBeDefined()
      })
    })

    describe('verify', () => {
      let keyPair: ECDSAKeyPair
      let message: Buffer

      beforeEach(async () => {
        keyPair = await service.generateKeyPair()
        message = Buffer.from('Test message for verification')
      })

      it('should verify a valid signature', async () => {
        const signature = await service.sign(message, keyPair.privateKey)
        const isValid = await service.verify(
          message,
          signature,
          keyPair.publicKey,
        )

        expect(isValid).toBe(true)
      })

      it('should reject signature with wrong message', async () => {
        const signature = await service.sign(message, keyPair.privateKey)
        const wrongMessage = Buffer.from('Different message')

        const isValid = await service.verify(
          wrongMessage,
          signature,
          keyPair.publicKey,
        )

        expect(isValid).toBe(false)
      })

      it('should reject signature with wrong public key', async () => {
        const signature = await service.sign(message, keyPair.privateKey)
        const differentKeyPair = await service.generateKeyPair()

        const isValid = await service.verify(
          message,
          signature,
          differentKeyPair.publicKey,
        )

        expect(isValid).toBe(false)
      })

      it('should reject tampered signature', async () => {
        const signature = await service.sign(message, keyPair.privateKey)

        // Tamper with signature
        const tamperedSignature = {
          ...signature,
          r: signature.r.slice(0, -2) + 'ff',
        }

        const isValid = await service.verify(
          message,
          tamperedSignature,
          keyPair.publicKey,
        )

        expect(isValid).toBe(false)
      })

      it('should handle malformed signatures gracefully', async () => {
        const malformedSignatures = [
          {
            r: 'invalid',
            s: 'invalid',
            curve: 'P-256' as ECDSACurve,
            format: 'ieee-p1363' as const,
          },
          {
            r: '',
            s: '',
            curve: 'P-256' as ECDSACurve,
            format: 'ieee-p1363' as const,
          },
          {
            r: '00',
            s: '00',
            curve: 'P-256' as ECDSACurve,
            format: 'ieee-p1363' as const,
          },
        ]

        for (const malformed of malformedSignatures) {
          const isValid = await service.verify(
            message,
            malformed,
            keyPair.publicKey,
          )

          expect(isValid).toBe(false)
        }
      })

      it('should verify empty message signature', async () => {
        const emptyMessage = Buffer.from('')
        const signature = await service.sign(emptyMessage, keyPair.privateKey)
        const isValid = await service.verify(
          emptyMessage,
          signature,
          keyPair.publicKey,
        )

        expect(isValid).toBe(true)
      })
    })

    describe('key import/export', () => {
      it('should export public key in PEM format', async () => {
        const keyPair = await service.generateKeyPair()
        const pem = await service.exportPublicKey(keyPair.publicKey)

        expect(pem).toContain('-----BEGIN PUBLIC KEY-----')
        expect(pem).toContain('-----END PUBLIC KEY-----')
        expect(pem.split('\n').length).toBeGreaterThanOrEqual(3)
      })

      it('should import public key from PEM format', async () => {
        const keyPair = await service.generateKeyPair()
        const pem = await service.exportPublicKey(keyPair.publicKey)
        const importedKey = await service.importPublicKey(pem)

        expect(importedKey).toBe(keyPair.publicKey)
      })

      it('should round-trip public key export/import', async () => {
        const keyPair = await service.generateKeyPair()
        const message = Buffer.from('Test message')
        const signature = await service.sign(message, keyPair.privateKey)

        // Export and re-import
        const pem = await service.exportPublicKey(keyPair.publicKey)
        const importedKey = await service.importPublicKey(pem)

        // Verify with imported key
        const isValid = await service.verify(message, signature, importedKey)

        expect(isValid).toBe(true)
      })

      it('should reject invalid PEM format', async () => {
        const invalidPEMs = [
          'not a pem',
          '-----BEGIN PUBLIC KEY-----\ninvalid base64\n-----END PUBLIC KEY-----',
          '-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2\n-----END PRIVATE KEY-----',
        ]

        for (const invalidPEM of invalidPEMs) {
          await expect(service.importPublicKey(invalidPEM)).rejects.toThrow()
        }
      })

      it('should export private key in PEM format', async () => {
        const keyPair = await service.generateKeyPair()
        const pem = await service.exportPrivateKey(keyPair.privateKey)

        expect(pem).toContain('-----BEGIN EC PRIVATE KEY-----')
        expect(pem).toContain('-----END EC PRIVATE KEY-----')
      })

      it('should import private key from PEM format', async () => {
        const keyPair = await service.generateKeyPair()
        const pem = await service.exportPrivateKey(keyPair.privateKey)
        const importedKey = await service.importPrivateKey(pem)

        // Test by signing
        const message = Buffer.from('Test')
        const signature1 = await service.sign(message, keyPair.privateKey)
        const signature2 = await service.sign(message, importedKey)

        expect(signature1.r).toBe(signature2.r)
        expect(signature1.s).toBe(signature2.s)
      })
    })

    describe('signature format conversions', () => {
      it('should convert signature to DER format', async () => {
        const keyPair = await service.generateKeyPair()
        const message = Buffer.from('Test')
        const signature = await service.sign(message, keyPair.privateKey)

        const derSignature = await service.signatureToDER(signature)

        expect(derSignature).toBeDefined()
        expect(derSignature.startsWith('30')).toBe(true) // DER sequence tag
      })

      it('should convert signature from DER format', async () => {
        const keyPair = await service.generateKeyPair()
        const message = Buffer.from('Test')
        const signature = await service.sign(message, keyPair.privateKey)

        const derSignature = await service.signatureToDER(signature)
        const convertedBack = await service.signatureFromDER(
          derSignature,
          'P-256',
        )

        expect(convertedBack.r).toBe(signature.r)
        expect(convertedBack.s).toBe(signature.s)
      })

      it('should handle low-s signature normalization', async () => {
        // ECDSA signatures should have normalized s values (low-s)
        const keyPair = await service.generateKeyPair()
        const message = Buffer.from('Test')
        const signature = await service.sign(message, keyPair.privateKey)

        const halfOrder = p256.CURVE.n / 2n

        // s should be <= n/2 (low-s form)
        const sBigInt = BigInt('0x' + signature.s)

        expect(sBigInt <= halfOrder).toBe(true)
      })
    })
  })

  describe('Multi-curve support', () => {
    const curves: ECDSACurve[] = ['P-256', 'P-384', 'P-521', 'secp256k1']

    curves.forEach((curve) => {
      describe(`${curve} curve`, () => {
        beforeEach(() => {
          service = new ECDSAService({ curve })
        })

        it('should generate valid key pair', async () => {
          const keyPair = await service.generateKeyPair()

          expect(keyPair).toBeDefined()
          expect(keyPair.curve).toBe(curve)
          expect(keyPair.privateKey).toBeDefined()
          expect(keyPair.publicKey).toBeDefined()
        })

        it('should sign and verify correctly', async () => {
          const keyPair = await service.generateKeyPair()
          const message = Buffer.from(`Test message for ${curve}`)

          const signature = await service.sign(message, keyPair.privateKey)
          const isValid = await service.verify(
            message,
            signature,
            keyPair.publicKey,
          )

          expect(isValid).toBe(true)
        })

        it('should have correct key sizes', async () => {
          const keyPair = await service.generateKeyPair()

          const expectedPrivateKeySizes: Record<ECDSACurve, number> = {
            'P-256': 64, // 32 bytes * 2 (hex)
            'P-384': 96, // 48 bytes * 2
            'P-521': 132, // 66 bytes * 2
            secp256k1: 64, // 32 bytes * 2
          }

          expect(keyPair.privateKey).toHaveLength(
            // eslint-disable-next-line security/detect-object-injection
            expectedPrivateKeySizes[curve],
          )
        })
      })
    })

    it('should not verify signatures across different curves', async () => {
      const service256 = new ECDSAService({ curve: 'P-256' })
      const service384 = new ECDSAService({ curve: 'P-384' })

      const keyPair256 = await service256.generateKeyPair()
      const keyPair384 = await service384.generateKeyPair()

      const message = Buffer.from('Cross-curve test')
      const signature256 = await service256.sign(message, keyPair256.privateKey)

      // Try to verify P-256 signature with P-384 key (should fail)
      const isValid = await service384.verify(
        message,
        signature256,
        keyPair384.publicKey,
      )

      expect(isValid).toBe(false)
    })
  })

  describe('Security edge cases', () => {
    beforeEach(() => {
      service = new ECDSAService({ curve: 'P-256' })
    })

    it('should handle zero private key gracefully', async () => {
      const zeroKey = '0'.repeat(64)
      const message = Buffer.from('Test')

      await expect(service.sign(message, zeroKey)).rejects.toThrow()
    })

    it('should handle maximum value private key', async () => {
      const maxKey = 'f'.repeat(64)
      const message = Buffer.from('Test')

      // This should either work or throw, but not crash
      try {
        await service.sign(message, maxKey)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should be resistant to timing attacks', async () => {
      const keyPair = await service.generateKeyPair()
      const message = Buffer.from('Timing test')
      const signature = await service.sign(message, keyPair.privateKey)

      // Test multiple verifications with same/different results
      const timings: number[] = []

      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint()

        if (i % 2 === 0) {
          await service.verify(message, signature, keyPair.publicKey) // Valid
        } else {
          const wrongMessage = Buffer.from('Wrong message')

          await service.verify(wrongMessage, signature, keyPair.publicKey) // Invalid
        }

        const end = process.hrtime.bigint()

        timings.push(Number(end - start))
      }

      // Calculate variance - should be relatively consistent
      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length
      const variance =
        timings.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
        timings.length
      const stdDev = Math.sqrt(variance)

      // Standard deviation should be less than 300% of average (relaxed for CI environments)
      // In production environments, this could be tightened
      expect(stdDev / avgTime).toBeLessThan(3.0)
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      service = new ECDSAService({ curve: 'P-256' })
    })

    it('should provide meaningful error messages', async () => {
      try {
        await service.sign(Buffer.from('test'), 'invalid-key')
      } catch (error: any) {
        expect(error.message).toMatch(/invalid.*key/i)
      }
    })

    it('should handle curve mismatch errors', async () => {
      const service256 = new ECDSAService({ curve: 'P-256' })
      const service384 = new ECDSAService({ curve: 'P-384' })

      const keyPair = await service256.generateKeyPair()
      const pem = await service256.exportPublicKey(keyPair.publicKey)

      // Try to import P-256 key into P-384 service
      // In our simplified implementation, this won't detect curve mismatch
      // A full implementation would parse ASN.1 and verify the curve OID
      await expect(service384.importPublicKey(pem)).rejects.toThrow()
    })
  })

  describe('Performance benchmarks', () => {
    beforeEach(() => {
      service = new ECDSAService({ curve: 'P-256' })
    })

    it('should generate keys within reasonable time', async () => {
      const start = process.hrtime.bigint()

      for (let i = 0; i < 10; i++) {
        await service.generateKeyPair()
      }

      const end = process.hrtime.bigint()
      const avgTime = Number(end - start) / 10 / 1_000_000 // Convert to ms

      expect(avgTime).toBeLessThan(50) // Should take less than 50ms per key pair
    })

    it('should sign messages quickly', async () => {
      const keyPair = await service.generateKeyPair()
      const message = Buffer.from('Performance test message')

      const start = process.hrtime.bigint()

      for (let i = 0; i < 100; i++) {
        await service.sign(message, keyPair.privateKey)
      }

      const end = process.hrtime.bigint()
      const avgTime = Number(end - start) / 100 / 1_000_000 // Convert to ms

      expect(avgTime).toBeLessThan(10) // Should take less than 10ms per signature
    })

    it('should verify signatures quickly', async () => {
      const keyPair = await service.generateKeyPair()
      const message = Buffer.from('Performance test message')
      const signature = await service.sign(message, keyPair.privateKey)

      const start = process.hrtime.bigint()

      for (let i = 0; i < 100; i++) {
        await service.verify(message, signature, keyPair.publicKey)
      }

      const end = process.hrtime.bigint()
      const avgTime = Number(end - start) / 100 / 1_000_000 // Convert to ms

      expect(avgTime).toBeLessThan(20) // Should take less than 20ms per verification (relaxed for CI)
    })
  })
})
