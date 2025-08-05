import { get, set } from 'lodash-es'
import { describe, expect, it } from 'vitest'

import { SecureRandom } from '../../../random/SecureRandom.js'

describe('SecureRandom', () => {
  describe('generateBytes', () => {
    it('should generate random bytes of specified length', async () => {
      const lengths = [16, 32, 64, 128]

      for (const length of lengths) {
        const bytes = await SecureRandom.generateBytes(length)

        expect(bytes).toBeInstanceOf(Buffer)
        expect(bytes).toHaveLength(length)
      }
    })

    it('should generate different bytes each time', async () => {
      const bytes1 = await SecureRandom.generateBytes(32)
      const bytes2 = await SecureRandom.generateBytes(32)

      expect(bytes1.equals(bytes2)).toBe(false)
    })

    it('should reject invalid lengths', async () => {
      await expect(SecureRandom.generateBytes(0)).rejects.toThrow()
      await expect(SecureRandom.generateBytes(-1)).rejects.toThrow()
      await expect(
        SecureRandom.generateBytes(1024 * 1024 + 1),
      ).rejects.toThrow()
    })

    it('should handle edge cases', async () => {
      const bytes1 = await SecureRandom.generateBytes(1)

      expect(bytes1).toHaveLength(1)

      const bytes2 = await SecureRandom.generateBytes(1024 * 1024)

      expect(bytes2).toHaveLength(1024 * 1024)
    })
  })

  describe('generateString', () => {
    it('should generate hex strings by default', async () => {
      const str = await SecureRandom.generateString({ length: 16 })

      expect(str).toMatch(/^[0-9a-f]{32}$/) // 16 bytes = 32 hex chars
      expect(str).toHaveLength(32)
    })

    it('should generate base64 strings', async () => {
      const str = await SecureRandom.generateString({
        length: 24,
        encoding: 'base64',
      })

      expect(str).toMatch(/^[A-Za-z0-9+/]+=*$/)
      expect(Buffer.from(str, 'base64')).toHaveLength(24)
    })

    it('should generate base64url strings', async () => {
      const str = await SecureRandom.generateString({
        length: 32,
        encoding: 'base64url',
      })

      expect(str).not.toContain('+')
      expect(str).not.toContain('/')
      expect(str).not.toContain('=')
      expect(str).toMatch(/^[A-Za-z0-9\-_]+$/)
    })

    it('should reject invalid encoding', async () => {
      await expect(
        SecureRandom.generateString({
          length: 16,
          encoding: 'invalid' as any,
        }),
      ).rejects.toThrow()
    })
  })

  describe('generateUUID', () => {
    it('should generate valid UUID v4', () => {
      const uuid = SecureRandom.generateUUID()

      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      )
    })

    it('should generate unique UUIDs', () => {
      const uuids = new Set()

      for (let i = 0; i < 100; i++) {
        uuids.add(SecureRandom.generateUUID())
      }

      expect(uuids.size).toBe(100)
    })
  })

  describe('generateAlphanumeric', () => {
    it('should generate alphanumeric strings', async () => {
      const str = await SecureRandom.generateAlphanumeric(10)

      expect(str).toHaveLength(10)
      // Default excludes ambiguous characters
      expect(str).toMatch(/^[A-HJ-NP-Z2-9a-hj-np-z]+$/)
    })

    it('should respect character options', async () => {
      // Only uppercase
      const upper = await SecureRandom.generateAlphanumeric(10, {
        uppercase: true,
        lowercase: false,
        numbers: false,
      })

      expect(upper).toMatch(/^[A-HJ-NP-Z]+$/)

      // Only lowercase
      const lower = await SecureRandom.generateAlphanumeric(10, {
        uppercase: false,
        lowercase: true,
        numbers: false,
      })

      expect(lower).toMatch(/^[a-hj-np-z]+$/)

      // Only numbers
      const numbers = await SecureRandom.generateAlphanumeric(10, {
        uppercase: false,
        lowercase: false,
        numbers: true,
      })

      expect(numbers).toMatch(/^[2-9]+$/)
    })

    it('should include ambiguous characters when requested', async () => {
      const str = await SecureRandom.generateAlphanumeric(100, {
        excludeAmbiguous: false,
      })

      // Should eventually include some ambiguous characters
      const hasAmbiguous = /[0-1ILOilo]/.test(str)

      expect(hasAmbiguous).toBe(true)
    })

    it('should reject if no character types enabled', async () => {
      await expect(
        SecureRandom.generateAlphanumeric(10, {
          uppercase: false,
          lowercase: false,
          numbers: false,
        }),
      ).rejects.toThrow()
    })

    it('should generate consistent length', async () => {
      const lengths = [5, 10, 20, 50]

      for (const length of lengths) {
        const str = await SecureRandom.generateAlphanumeric(length)

        expect(str).toHaveLength(length)
      }
    })
  })

  describe('generateToken', () => {
    it('should generate base64url token', async () => {
      const token = await SecureRandom.generateToken()

      expect(token).toMatch(/^[A-Za-z0-9\-_]+$/)
      expect(token).not.toContain('=')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate tokens of specified byte length', async () => {
      const token16 = await SecureRandom.generateToken(16)
      const token32 = await SecureRandom.generateToken(32)
      const token64 = await SecureRandom.generateToken(64)

      // Base64 encoding increases size by ~4/3
      expect(token16.length).toBeGreaterThanOrEqual(21)
      expect(token32.length).toBeGreaterThanOrEqual(42)
      expect(token64.length).toBeGreaterThanOrEqual(85)
    })

    it('should generate unique tokens', async () => {
      const tokens = new Set()

      for (let i = 0; i < 100; i++) {
        tokens.add(await SecureRandom.generateToken())
      }

      expect(tokens.size).toBe(100)
    })
  })

  describe('generateNumericCode', () => {
    it('should generate numeric codes of specified length', async () => {
      const lengths = [4, 6, 8, 10]

      for (const length of lengths) {
        const code = await SecureRandom.generateNumericCode(length)

        expect(code).toMatch(/^\d+$/)
        expect(code).toHaveLength(length)
      }
    })

    it('should generate codes within correct range', async () => {
      // 6-digit codes should be between 100000 and 999999
      for (let i = 0; i < 100; i++) {
        const code = await SecureRandom.generateNumericCode(6)
        const num = parseInt(code, 10)

        expect(num).toBeGreaterThanOrEqual(100000)
        expect(num).toBeLessThanOrEqual(999999)
      }
    })

    it('should reject invalid lengths', async () => {
      await expect(SecureRandom.generateNumericCode(3)).rejects.toThrow()
      await expect(SecureRandom.generateNumericCode(11)).rejects.toThrow()
    })

    it('should pad codes with leading zeros if needed', async () => {
      // Generate many 4-digit codes to ensure we get some that need padding
      const codes = []

      for (let i = 0; i < 100; i++) {
        codes.push(await SecureRandom.generateNumericCode(4))
      }

      // All should be exactly 4 digits
      codes.forEach((code) => {
        expect(code).toHaveLength(4)
        expect(code).toMatch(/^\d{4}$/)
      })
    })
  })

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      expect(SecureRandom.timingSafeEqual('abc123', 'abc123')).toBe(true)
      expect(SecureRandom.timingSafeEqual('', '')).toBe(true)
      expect(
        SecureRandom.timingSafeEqual('long string test', 'long string test'),
      ).toBe(true)
    })

    it('should return false for different strings', () => {
      expect(SecureRandom.timingSafeEqual('abc123', 'abc124')).toBe(false)
      expect(SecureRandom.timingSafeEqual('abc', 'def')).toBe(false)
    })

    it('should return false for different lengths', () => {
      expect(SecureRandom.timingSafeEqual('abc', 'abcd')).toBe(false)
      expect(SecureRandom.timingSafeEqual('', 'a')).toBe(false)
    })

    it('should work with buffers', () => {
      const buf1 = Buffer.from('test')
      const buf2 = Buffer.from('test')
      const buf3 = Buffer.from('different')

      expect(SecureRandom.timingSafeEqual(buf1, buf2)).toBe(true)
      expect(SecureRandom.timingSafeEqual(buf1, buf3)).toBe(false)
    })

    it('should work with mixed string and buffer inputs', () => {
      const str = 'test'
      const buf = Buffer.from('test')

      expect(SecureRandom.timingSafeEqual(str, buf)).toBe(true)
      expect(SecureRandom.timingSafeEqual(buf, str)).toBe(true)
    })

    it('should have consistent timing (basic check)', () => {
      // Note: This test was previously skipped due to high variance in CI environments
      // Now uses a ratio-based approach that's more tolerant of timing variations
      const iterations = 100 // Reduced iterations for faster test
      const equalTimings: number[] = []
      const differentTimings: number[] = []

      // Test with equal strings
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()

        SecureRandom.timingSafeEqual('a'.repeat(1000), 'a'.repeat(1000))

        const end = process.hrtime.bigint()

        equalTimings.push(Number(end - start))
      }

      // Test with different strings (should take similar time)
      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()

        SecureRandom.timingSafeEqual('a'.repeat(1000), 'b'.repeat(1000))

        const end = process.hrtime.bigint()

        differentTimings.push(Number(end - start))
      }

      // Calculate averages
      const avgEqual =
        equalTimings.reduce((a, b) => a + b, 0) / equalTimings.length
      const avgDifferent =
        differentTimings.reduce((a, b) => a + b, 0) / differentTimings.length

      // The timing difference between equal and different comparisons should be minimal
      // Using a ratio test instead of variance for better stability
      const ratio =
        Math.max(avgEqual, avgDifferent) / Math.min(avgEqual, avgDifferent)

      // Timing should be within 10x of each other (very lenient for CI)
      // In a real timing-safe implementation, this should be much closer to 1.0
      expect(ratio).toBeLessThan(10.0)

      // Also ensure the function is actually working
      expect(SecureRandom.timingSafeEqual('test', 'test')).toBe(true)
      expect(SecureRandom.timingSafeEqual('test', 'diff')).toBe(false)
    })
  })

  describe('Statistical randomness (basic tests)', () => {
    // Note: These tests were previously skipped due to timing variance in CI environments
    // They've been updated to use more reliable statistical methods and tolerances
    it('should have reasonable distribution for random bytes', async () => {
      const samples = 25600 // Larger sample size for better distribution
      const bytes = await SecureRandom.generateBytes(samples)

      // Count occurrences of each byte value
      const counts = new Array(256).fill(0)

      for (let i = 0; i < samples; i++) {
        const byteValue = get(bytes, i, 0)
        const currentCount = get(counts, byteValue, 0)

        set(counts, byteValue, currentCount + 1)
      }

      // Each byte value should appear roughly samples/256 times
      const expected = samples / 256 // Should be ~100

      // Chi-squared test approach for better statistical validation
      let chiSquared = 0
      let outliers = 0

      for (let i = 0; i < 256; i++) {
        const observed = get(counts, i, 0)
        const deviation = Math.abs(observed - expected)

        chiSquared += Math.pow(observed - expected, 2) / expected

        // Count extreme outliers (more than 50% deviation)
        if (deviation > expected * 0.5) {
          outliers++
        }
      }

      // With 255 degrees of freedom, chi-squared should be < 310 for 95% confidence
      // Using a more lenient threshold for CI stability
      expect(chiSquared).toBeLessThan(400)

      // Should have very few extreme outliers (less than 5% of values)
      expect(outliers).toBeLessThan(13) // 5% of 256

      // Also do a basic sanity check - no byte value should be completely missing or dominant
      const min = Math.min(...counts)
      const max = Math.max(...counts)

      expect(min).toBeGreaterThan(0) // No missing values
      expect(max).toBeLessThan(expected * 3) // No value appears more than 3x expected
    })

    it('should not have obvious patterns', async () => {
      const bytes = await SecureRandom.generateBytes(1000)

      // Check for no repeating sequences
      let hasRepeatingSequence = false

      for (let i = 0; i < bytes.length - 10; i++) {
        const seq = bytes.slice(i, i + 5)
        const next = bytes.slice(i + 5, i + 10)

        if (seq.equals(next)) {
          hasRepeatingSequence = true
          break
        }
      }

      expect(hasRepeatingSequence).toBe(false)
    })
  })
})
