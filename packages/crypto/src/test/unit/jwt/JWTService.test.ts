import { beforeEach, describe, expect, it } from 'vitest'

import { ECDSAService } from '../../../ecdsa/ECDSAService.js'
import { JWTService } from '../../../jwt/JWTService.js'
import type {
  JWTConfig,
  JWTHeader,
  RedemptionClaims,
} from '../../../types/crypto.types.js'

describe('JWTService', () => {
  let jwtService: JWTService
  let ecdsaService: ECDSAService
  let keyPair: { privateKey: string; publicKey: string }

  const defaultConfig: JWTConfig = {
    issuer: 'pika-platform',
    audience: 'pika-vouchers',
    algorithm: 'ES256',
    keyId: 'test-key-001',
  }

  beforeEach(async () => {
    jwtService = new JWTService(defaultConfig)
    ecdsaService = new ECDSAService({ curve: 'P-256' })
    keyPair = await ecdsaService.generateKeyPair()
  })

  describe('Token Generation', () => {
    it('should generate a valid JWT token', async () => {
      const claims: RedemptionClaims = {
        vid: 'voucher-123',
        uid: 'user-456',
        typ: 'user',
      }

      const token = await jwtService.generateToken(
        claims,
        keyPair.privateKey,
        300, // 5 minutes
      )

      expect(token).toBeDefined()
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include all required claims', async () => {
      const claims: RedemptionClaims = {
        vid: 'voucher-789',
        uid: 'user-012',
        typ: 'user',
      }

      const token = await jwtService.generateToken(claims, keyPair.privateKey)
      const decoded = jwtService.decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.payload.vid).toBe('voucher-789')
      expect(decoded?.payload.uid).toBe('user-012')
      expect(decoded?.payload.typ).toBe('user')
      expect(decoded?.payload.iss).toBe('pika-platform')
      expect(decoded?.payload.aud).toBe('pika-vouchers')
      expect(decoded?.payload.iat).toBeDefined()
      expect(decoded?.payload.jti).toBeDefined()
    })

    it('should handle print voucher claims', async () => {
      const claims: RedemptionClaims = {
        vid: 'voucher-print-001',
        typ: 'print',
        btc: 'BATCH2024Q1',
        lmt: 100,
      }

      const token = await jwtService.generateToken(
        claims,
        keyPair.privateKey,
        86400, // 24 hours
      )

      const decoded = jwtService.decodeToken(token)

      expect(decoded?.payload.uid).toBeUndefined()
      expect(decoded?.payload.btc).toBe('BATCH2024Q1')
      expect(decoded?.payload.lmt).toBe(100)
      expect(decoded?.payload.typ).toBe('print')
    })

    it('should set expiration when TTL provided', async () => {
      const ttl = 3600 // 1 hour
      const beforeGeneration = Math.floor(Date.now() / 1000)

      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
        ttl,
      )

      const decoded = jwtService.decodeToken(token)
      const afterGeneration = Math.floor(Date.now() / 1000)

      expect(decoded?.payload.exp).toBeDefined()
      expect(decoded?.payload.exp).toBeGreaterThanOrEqual(
        beforeGeneration + ttl,
      )
      expect(decoded?.payload.exp).toBeLessThanOrEqual(afterGeneration + ttl)
    })

    it('should generate unique JTI for each token', async () => {
      const claims: RedemptionClaims = { vid: 'v-123', typ: 'user' }

      const token1 = await jwtService.generateToken(claims, keyPair.privateKey)
      const token2 = await jwtService.generateToken(claims, keyPair.privateKey)

      const decoded1 = jwtService.decodeToken(token1)
      const decoded2 = jwtService.decodeToken(token2)

      expect(decoded1?.payload.jti).not.toBe(decoded2?.payload.jti)
    })

    it('should include key ID in header when configured', async () => {
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      const decoded = jwtService.decodeToken(token)

      expect(decoded?.header.kid).toBe('test-key-001')
    })

    it('should handle invalid private key', async () => {
      await expect(
        jwtService.generateToken({ vid: 'v-123', typ: 'user' }, 'invalid-key'),
      ).rejects.toThrow()
    })
  })

  describe('Token Verification', () => {
    it('should verify valid tokens', async () => {
      const claims: RedemptionClaims = {
        vid: 'voucher-verify-001',
        uid: 'user-verify-001',
        typ: 'user',
      }

      const token = await jwtService.generateToken(claims, keyPair.privateKey)
      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(true)
      expect(result.payload).toBeDefined()
      expect(result.payload?.vid).toBe('voucher-verify-001')
      expect(result.error).toBeUndefined()
    })

    it('should reject tokens with invalid format', async () => {
      const invalidTokens = [
        'not.a.token',
        'only.two',
        '',
        'one',
        'four.part.token.here',
      ]

      for (const token of invalidTokens) {
        const result = await jwtService.verifyToken(token, keyPair.publicKey)

        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      }
    })

    it('should reject tokens with wrong signature', async () => {
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      // Generate different key pair
      const wrongKeyPair = await ecdsaService.generateKeyPair()

      const result = await jwtService.verifyToken(token, wrongKeyPair.publicKey)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid signature')
    })

    it('should reject expired tokens', async () => {
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
        -1, // Already expired
      )

      await expect(
        jwtService.verifyToken(token, keyPair.publicKey),
      ).rejects.toThrow('Token expired')
    })

    it('should reject tokens not yet valid (nbf claim)', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour in future
      const claims: RedemptionClaims = {
        vid: 'v-123',
        typ: 'user',
        nbf: futureTime,
      }

      const token = await jwtService.generateToken(claims, keyPair.privateKey)
      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token not yet valid')
    })

    it('should reject tokens with future iat', async () => {
      // Create a custom JWT service that allows us to inject custom claims
      const createTokenWithCustomIat = async (iat: number) => {
        const header: JWTHeader = {
          alg: 'ES256',
          typ: 'JWT',
          kid: defaultConfig.keyId,
        }

        const payload: RedemptionClaims = {
          vid: 'v-123',
          typ: 'user',
          iss: defaultConfig.issuer,
          aud: defaultConfig.audience,
          iat: iat,
          jti: 'test-jti-future',
        }

        const headerBase64 = Buffer.from(JSON.stringify(header))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        const payloadBase64 = Buffer.from(JSON.stringify(payload))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        const signingInput = `${headerBase64}.${payloadBase64}`
        const signature = await ecdsaService.sign(
          Buffer.from(signingInput),
          keyPair.privateKey,
        )

        // Use shared helper function

        const signatureBytes = Buffer.concat([
          Buffer.from(signature.r, 'hex'),
          Buffer.from(signature.s, 'hex'),
        ])
        // Match exactly what JWTService.generateToken does
        const signatureBase64 = signatureBytes
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        return `${signingInput}.${signatureBase64}`
      }

      // Test with a token issued 2 minutes in the future (beyond allowed clock skew)
      const futureTime = Math.floor(Date.now() / 1000) + 120
      const futureToken = await createTokenWithCustomIat(futureTime)
      const result = await jwtService.verifyToken(
        futureToken,
        keyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token issued in the future')
    })

    it('should reject tokens with wrong issuer', async () => {
      // Create service with different issuer
      const differentIssuer = new JWTService({
        ...defaultConfig,
        issuer: 'different-issuer',
      })

      const token = await differentIssuer.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid issuer')
    })

    it('should reject tokens with wrong audience', async () => {
      // Create service with different audience
      const differentAudience = new JWTService({
        ...defaultConfig,
        audience: 'different-audience',
      })

      const token = await differentAudience.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid audience')
    })

    it('should reject tokens with wrong algorithm', async () => {
      // Create token with ES256
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      // Try to verify with ES384 service
      const es384Service = new JWTService({
        ...defaultConfig,
        algorithm: 'ES384',
      })

      const result = await es384Service.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Algorithm mismatch')
    })

    it('should handle malformed header gracefully', async () => {
      const malformedToken = 'eyJub3RfanNvbn0.eyJ2aWQiOiJ2LTEyMyJ9.signature'

      const result = await jwtService.verifyToken(
        malformedToken,
        keyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid token header')
    })

    it('should handle malformed payload gracefully', async () => {
      const header = { alg: 'ES256', typ: 'JWT' }
      const headerBase64 = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      const malformedToken = `${headerBase64}.eyJub3RfanNvbn0.signature`

      const result = await jwtService.verifyToken(
        malformedToken,
        keyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid token payload')
    })
  })

  describe('Token Decoding', () => {
    it('should decode valid tokens without verification', async () => {
      const claims: RedemptionClaims = {
        vid: 'decode-test',
        uid: 'user-decode',
        typ: 'user',
      }

      const token = await jwtService.generateToken(claims, keyPair.privateKey)
      const decoded = jwtService.decodeToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.header.alg).toBe('ES256')
      expect(decoded?.header.typ).toBe('JWT')
      expect(decoded?.payload.vid).toBe('decode-test')
    })

    it('should return null for invalid tokens', () => {
      const invalidTokens = ['not.a.token', '', 'single', 'two.parts']

      for (const token of invalidTokens) {
        const decoded = jwtService.decodeToken(token)

        expect(decoded).toBeNull()
      }
    })

    it('should handle decoding errors gracefully', () => {
      const malformedToken = 'header.payload.signature'
      const decoded = jwtService.decodeToken(malformedToken)

      expect(decoded).toBeNull()
    })
  })

  describe('Multi-Algorithm Support', () => {
    const algorithms: Array<{
      alg: 'ES256' | 'ES384' | 'ES512' | 'ES256K'
      curve: 'P-256' | 'P-384' | 'P-521' | 'secp256k1'
    }> = [
      { alg: 'ES256', curve: 'P-256' },
      { alg: 'ES384', curve: 'P-384' },
      { alg: 'ES512', curve: 'P-521' },
      { alg: 'ES256K', curve: 'secp256k1' },
    ]

    algorithms.forEach(({ alg, curve }) => {
      it(`should work with ${alg} algorithm`, async () => {
        const service = new JWTService({
          ...defaultConfig,
          algorithm: alg,
        })

        const ecdsa = new ECDSAService({ curve })
        const keys = await ecdsa.generateKeyPair()

        const token = await service.generateToken(
          { vid: 'v-123', typ: 'user' },
          keys.privateKey,
        )

        const result = await service.verifyToken(token, keys.publicKey)

        expect(result.isValid).toBe(true)
        expect(result.payload?.vid).toBe('v-123')
      })
    })

    it('should reject unsupported algorithms', () => {
      expect(
        () =>
          new JWTService({
            ...defaultConfig,
            algorithm: 'HS256' as any,
          }),
      ).toThrow()
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle algorithm confusion attacks', async () => {
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      // Manually change algorithm in header but keep same signature
      const parts = token.split('.')
      const header = JSON.parse(
        Buffer.from(
          parts[0].replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        ).toString(),
      )

      header.alg = 'none'

      const newHeaderBase64 = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      const tamperedToken = `${newHeaderBase64}.${parts[1]}.${parts[2]}`

      const result = await jwtService.verifyToken(
        tamperedToken,
        keyPair.publicKey,
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Algorithm mismatch')
    })

    it('should generate cryptographically secure JTI', async () => {
      const jtis = new Set<string>()

      // Generate many tokens and check JTI uniqueness
      for (let i = 0; i < 100; i++) {
        const token = await jwtService.generateToken(
          { vid: 'v-123', typ: 'user' },
          keyPair.privateKey,
        )
        const decoded = jwtService.decodeToken(token)

        expect(decoded?.payload.jti).toBeDefined()
        expect(decoded?.payload.jti).toHaveLength(16)
        expect(jtis.has(decoded!.payload.jti!)).toBe(false)

        jtis.add(decoded!.payload.jti!)
      }
    })

    it('should handle clock skew for iat validation', async () => {
      // Create a custom JWT service that allows us to inject custom claims
      const createTokenWithCustomIat = async (iat: number) => {
        const header: JWTHeader = {
          alg: 'ES256',
          typ: 'JWT',
          kid: defaultConfig.keyId,
        }

        const payload: RedemptionClaims = {
          vid: 'v-123',
          typ: 'user',
          iss: defaultConfig.issuer,
          aud: defaultConfig.audience,
          iat: iat,
          jti: 'test-jti-skew',
        }

        const headerBase64 = Buffer.from(JSON.stringify(header))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        const payloadBase64 = Buffer.from(JSON.stringify(payload))
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        const signingInput = `${headerBase64}.${payloadBase64}`
        const signature = await ecdsaService.sign(
          Buffer.from(signingInput),
          keyPair.privateKey,
        )

        // Use shared helper function

        const signatureBytes = Buffer.concat([
          Buffer.from(signature.r, 'hex'),
          Buffer.from(signature.s, 'hex'),
        ])
        // Match exactly what JWTService.generateToken does
        const signatureBase64 = signatureBytes
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')

        return `${signingInput}.${signatureBase64}`
      }

      // Test with a token issued 30 seconds in the future (within allowed 60s clock skew)
      const slightFuture = Math.floor(Date.now() / 1000) + 30
      const skewToken = await createTokenWithCustomIat(slightFuture)
      const result = await jwtService.verifyToken(skewToken, keyPair.publicKey)

      // Should accept tokens with iat within 60 second clock skew
      expect(result.isValid).toBe(true)
      expect(result.payload?.vid).toBe('v-123')
    })
  })

  describe('Performance', () => {
    it('should generate tokens efficiently', async () => {
      const start = Date.now()
      const promises = []

      for (let i = 0; i < 10; i++) {
        promises.push(
          jwtService.generateToken(
            { vid: `v-${i}`, typ: 'user' },
            keyPair.privateKey,
          ),
        )
      }

      await Promise.all(promises)

      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should complete 10 tokens in under 1 second
    })

    it('should verify tokens efficiently', async () => {
      const token = await jwtService.generateToken(
        { vid: 'v-123', typ: 'user' },
        keyPair.privateKey,
      )

      const start = Date.now()
      const promises = []

      for (let i = 0; i < 20; i++) {
        promises.push(jwtService.verifyToken(token, keyPair.publicKey))
      }

      await Promise.all(promises)

      const duration = Date.now() - start

      expect(duration).toBeLessThan(500) // Should verify 20 tokens in under 500ms
    })
  })

  describe('Base64URL Encoding/Decoding', () => {
    it('should handle padding correctly', async () => {
      const testStrings = [
        'a',
        'ab',
        'abc',
        'abcd',
        'abcde',
        'abcdef',
        '{"test":"value"}',
        '{"a":"b","c":"d"}',
      ]

      for (const str of testStrings) {
        const token = await jwtService.generateToken(
          { vid: 'test', typ: 'user', custom: str },
          keyPair.privateKey,
        )

        const decoded = jwtService.decodeToken(token)

        expect(decoded?.payload.custom).toBe(str)
      }
    })

    it('should handle special characters in base64url', async () => {
      // Create claims that will result in + and / in base64
      const claims: RedemptionClaims = {
        vid: '>>>???///+++===',
        uid: '~~~!!!@@@###$$$',
        typ: 'user',
      }

      const token = await jwtService.generateToken(claims, keyPair.privateKey)

      // Token should not contain +, /, or =
      expect(token).not.toContain('+')
      expect(token).not.toContain('/')
      expect(token).not.toContain('=')

      // Should still decode correctly
      const result = await jwtService.verifyToken(token, keyPair.publicKey)

      expect(result.isValid).toBe(true)
      expect(result.payload?.vid).toBe('>>>???///+++===')
    })
  })
})
