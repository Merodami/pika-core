import type { JWTAlgorithm } from '@pika/types'
import { describe, expect, it } from 'vitest'

import { KeyGenerator } from '../../../keygen/KeyGenerator.js'

describe('KeyGenerator', () => {
  describe('generateRSAKeyPair', () => {
    it('should generate valid RSA key pair with default modulus length', () => {
      const keyPair = KeyGenerator.generateRSAKeyPair()

      expect(keyPair).toBeDefined()
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
      expect(keyPair.privateKey).toContain('-----END PRIVATE KEY-----')
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
      expect(keyPair.publicKey).toContain('-----END PUBLIC KEY-----')
      expect(keyPair.algorithm).toBe('RS256')
    })

    it('should generate RSA key pair with custom modulus length', () => {
      const keyPair = KeyGenerator.generateRSAKeyPair({
        modulusLength: 4096,
      })

      expect(keyPair).toBeDefined()
      expect(keyPair.privateKey).toBeTruthy()
      expect(keyPair.publicKey).toBeTruthy()
      expect(keyPair.algorithm).toBe('RS256')

      // 4096-bit keys should be longer than 2048-bit keys
      const defaultKeyPair = KeyGenerator.generateRSAKeyPair()

      expect(keyPair.privateKey.length).toBeGreaterThan(
        defaultKeyPair.privateKey.length,
      )
    })

    it('should generate different key pairs each time', () => {
      const keyPair1 = KeyGenerator.generateRSAKeyPair()
      const keyPair2 = KeyGenerator.generateRSAKeyPair()

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
    })

    it('should generate even with small modulus length (though not recommended)', () => {
      // 512-bit keys work but are not secure - just testing the functionality
      const keyPair = KeyGenerator.generateRSAKeyPair({ modulusLength: 512 })

      expect(keyPair).toBeDefined()
      expect(keyPair.privateKey).toBeTruthy()
      expect(keyPair.publicKey).toBeTruthy()
    })
  })

  describe('generateECDSAKeyPair', () => {
    it('should generate valid ECDSA key pair with P-256 curve', () => {
      const keyPair = KeyGenerator.generateECDSAKeyPair()

      expect(keyPair).toBeDefined()
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
      expect(keyPair.privateKey).toContain('-----END PRIVATE KEY-----')
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
      expect(keyPair.publicKey).toContain('-----END PUBLIC KEY-----')
      expect(keyPair.algorithm).toBe('ES256')
    })

    it('should generate different ECDSA key pairs each time', () => {
      const keyPair1 = KeyGenerator.generateECDSAKeyPair()
      const keyPair2 = KeyGenerator.generateECDSAKeyPair()

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
    })
  })

  describe('generateSecret', () => {
    it('should generate hex secret of default length', () => {
      const secret = KeyGenerator.generateSecret()

      expect(secret).toBeDefined()
      expect(secret).toHaveLength(128) // 64 bytes * 2 (hex)
      expect(secret).toMatch(/^[0-9a-f]+$/) // Hex pattern
    })

    it('should generate secret of custom length', () => {
      const length = 48
      const secret = KeyGenerator.generateSecret(length)

      expect(secret).toHaveLength(length * 2) // Hex encoding doubles length
      expect(secret).toMatch(/^[0-9a-f]+$/)
    })

    it('should generate different secrets each time', () => {
      const secret1 = KeyGenerator.generateSecret()
      const secret2 = KeyGenerator.generateSecret()

      expect(secret1).not.toBe(secret2)
    })
  })

  describe('Algorithm support', () => {
    const rsaAlgorithms: JWTAlgorithm[] = ['RS256', 'RS384', 'RS512']
    const ecdsaAlgorithms: JWTAlgorithm[] = ['ES256', 'ES384', 'ES512']

    it.each(rsaAlgorithms)('should support %s algorithm', (algorithm) => {
      const keyPair = KeyGenerator.generateRSAKeyPair({ algorithm })

      expect(keyPair.algorithm).toBe(algorithm)
      expect(keyPair.privateKey).toBeTruthy()
      expect(keyPair.publicKey).toBeTruthy()
    })

    it.each(ecdsaAlgorithms)('should support %s algorithm', (algorithm) => {
      const keyPair = KeyGenerator.generateECDSAKeyPair({ algorithm })

      expect(keyPair.algorithm).toBe(algorithm)
      expect(keyPair.privateKey).toBeTruthy()
      expect(keyPair.publicKey).toBeTruthy()
    })
  })
})
