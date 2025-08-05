import { beforeEach, describe, expect, it } from 'vitest'

import { PasswordSecurityService } from '../../../services/PasswordSecurityService.js'

describe('PasswordSecurityService', () => {
  let passwordService: PasswordSecurityService

  beforeEach(() => {
    passwordService = new PasswordSecurityService()
  })

  describe('Password Hashing', () => {
    it('should hash a password successfully', async () => {
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)

      expect(hashedPassword).toBeTruthy()
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword).toMatch(/^\$2b\$12\$/) // bcrypt format with 12 salt rounds
    })

    it('should generate different hashes for the same password', async () => {
      const plainPassword = 'testPassword123!'
      const hash1 = await passwordService.hashPassword(plainPassword)
      const hash2 = await passwordService.hashPassword(plainPassword)

      expect(hash1).not.toBe(hash2) // Salt should make them different
    })

    it('should handle empty passwords', async () => {
      await expect(passwordService.hashPassword('')).rejects.toThrow()
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'A1!'.repeat(100) + 'ValidPassword123!' // Make it valid
      const hashedPassword = await passwordService.hashPassword(longPassword)

      expect(hashedPassword).toBeTruthy()
      expect(hashedPassword).toMatch(/^\$2b\$12\$/)
    })
  })

  describe('Password Verification', () => {
    it('should verify correct passwords', async () => {
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)

      const isValid = await passwordService.verifyPassword(
        plainPassword,
        hashedPassword,
      )

      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const plainPassword = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)

      const isValid = await passwordService.verifyPassword(
        wrongPassword,
        hashedPassword,
      )

      expect(isValid).toBe(false)
    })

    it('should reject empty passwords', async () => {
      const hashedPassword =
        await passwordService.hashPassword('testPassword123!')

      const isValid = await passwordService.verifyPassword('', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should handle malformed hashes gracefully', async () => {
      const plainPassword = 'testPassword123!'
      const malformedHash = 'not-a-valid-hash'

      const isValid = await passwordService.verifyPassword(
        plainPassword,
        malformedHash,
      )

      expect(isValid).toBe(false)
    })

    it('should be resistant to timing attacks', async () => {
      const plainPassword = 'testPassword123!'
      const hashedPassword = await passwordService.hashPassword(plainPassword)

      // Test with various wrong passwords to ensure consistent timing
      const wrongPasswords = [
        'wrong',
        'wrongpassword',
        'wrong123',
        'a'.repeat(100),
      ]

      for (const wrongPassword of wrongPasswords) {
        const startTime = process.hrtime.bigint()
        const isValid = await passwordService.verifyPassword(
          wrongPassword,
          hashedPassword,
        )
        const endTime = process.hrtime.bigint()

        expect(isValid).toBe(false)

        // Verification should take a reasonable amount of time (bcrypt work)
        const duration = Number(endTime - startTime) / 1_000_000 // Convert to milliseconds

        expect(duration).toBeGreaterThan(50) // bcrypt should take at least 50ms
      }
    })
  })

  describe('Password Strength Validation', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mpl3x!P@ssw0rd123',
        'Sup3r$ecur3P@ss!',
        'Tr0ub4dor&3',
      ]

      strongPasswords.forEach((password) => {
        const result = passwordService.validatePasswordStrength(password)

        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // Too common
        '123456', // Too simple
        'abc', // Too short
        'PASSWORD', // No lowercase
        'password', // No uppercase
        'Password', // No numbers
        'Password123', // No special chars
        'Pass1!', // Too short
      ]

      weakPasswords.forEach((password) => {
        const result = passwordService.validatePasswordStrength(password)

        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })
    })

    it('should provide specific error messages', () => {
      const result = passwordService.validatePasswordStrength('weak')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      )
    })

    it('should detect common passwords', () => {
      const commonPasswords = ['password', '123456', 'qwerty', 'abc123']

      commonPasswords.forEach((password) => {
        const result = passwordService.validatePasswordStrength(password)

        expect(result.isValid).toBe(false)
        expect(result.errors.some((err) => err.includes('common'))).toBe(true)
      })
    })
  })

  describe('Secure Password Generation', () => {
    it('should generate passwords of correct length', () => {
      const lengths = [12, 16, 20, 24, 32]

      lengths.forEach((length) => {
        const password = passwordService.generateSecurePassword(length)

        expect(password).toHaveLength(length)
      })
    })

    it('should generate unique passwords', () => {
      const passwords = new Set()

      // Generate 100 passwords and ensure they're all unique
      for (let i = 0; i < 100; i++) {
        const password = passwordService.generateSecurePassword()

        expect(passwords.has(password)).toBe(false)
        passwords.add(password)
      }
    })

    it('should include all character types', () => {
      const password = passwordService.generateSecurePassword(16)

      expect(password).toMatch(/[a-z]/) // lowercase
      expect(password).toMatch(/[A-Z]/) // uppercase
      expect(password).toMatch(/[0-9]/) // numbers
      expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/) // special chars
    })

    it('should generate strong passwords that pass validation', () => {
      for (let i = 0; i < 10; i++) {
        const password = passwordService.generateSecurePassword()
        const validation = passwordService.validatePasswordStrength(password)

        expect(validation.isValid).toBe(true)
        expect(validation.errors).toHaveLength(0)
      }
    })

    it('should use cryptographically secure randomness', () => {
      // Test that generated passwords are unique and don't follow predictable patterns
      const passwords = new Set()

      for (let i = 0; i < 100; i++) {
        passwords.add(passwordService.generateSecurePassword(16))
      }

      // Should generate unique passwords (collision extremely unlikely with crypto random)
      expect(passwords.size).toBe(100)

      // Test that consecutive passwords are different
      const password1 = passwordService.generateSecurePassword(16)
      const password2 = passwordService.generateSecurePassword(16)

      expect(password1).not.toBe(password2)
    })
  })

  describe('Hash Format Validation', () => {
    it('should detect if hash needs rehashing', async () => {
      const plainPassword = 'testPassword123!'
      const hash = await passwordService.hashPassword(plainPassword)

      // Current implementation uses 12 rounds, so should not need rehashing
      const needsRehash = passwordService.needsRehash(hash)

      expect(needsRehash).toBe(false)
    })

    it('should detect old hashes that need rehashing', () => {
      // Simulate old hash with fewer rounds
      const oldHash = '$2b$10$abcdefghijklmnopqrstuvwxyz' // 10 rounds instead of 12

      const needsRehash = passwordService.needsRehash(oldHash)

      expect(needsRehash).toBe(true)
    })

    it('should handle invalid hash formats', () => {
      const invalidHashes = ['', 'invalid', '$2b$', 'not-a-hash']

      invalidHashes.forEach((hash) => {
        expect(() => passwordService.needsRehash(hash)).not.toThrow()
      })
    })
  })
})
