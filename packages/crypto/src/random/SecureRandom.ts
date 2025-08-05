import { randomBytes, randomUUID } from 'crypto'

import { CryptoErrorFactory } from '../errors/CryptoError.js'
import type { RandomOptions } from '../types/crypto.types.js'

/**
 * Secure random generation utilities
 */
export class SecureRandom {
  /**
   * Generate cryptographically secure random bytes
   */
  static async generateBytes(length: number): Promise<Buffer> {
    if (length <= 0 || length > 1024 * 1024) {
      // Max 1MB
      throw CryptoErrorFactory.invalidKey(
        `Invalid length: ${length}. Must be between 1 and 1048576`,
      )
    }

    return new Promise((resolve, reject) => {
      randomBytes(length, (err, buffer) => {
        if (err) {
          reject(
            CryptoErrorFactory.keyGenerationFailed(
              'Failed to generate random bytes',
              { length },
              err,
            ),
          )
        } else {
          resolve(buffer)
        }
      })
    })
  }

  /**
   * Generate random string with specified encoding
   */
  static async generateString(options: RandomOptions): Promise<string> {
    const bytes = await this.generateBytes(options.length)

    switch (options.encoding || 'hex') {
      case 'hex':
        return bytes.toString('hex')
      case 'base64':
        return bytes.toString('base64')
      case 'base64url':
        return bytes
          .toString('base64')
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
      default:
        throw CryptoErrorFactory.invalidKey(
          `Invalid encoding: ${options.encoding}`,
        )
    }
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return randomUUID()
  }

  /**
   * Generate alphanumeric string (useful for short codes)
   */
  static async generateAlphanumeric(
    length: number,
    options?: {
      uppercase?: boolean
      lowercase?: boolean
      numbers?: boolean
      excludeAmbiguous?: boolean
    },
  ): Promise<string> {
    const opts = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      excludeAmbiguous: true,
      ...options,
    }

    let charset = ''

    if (opts.uppercase) {
      charset += opts.excludeAmbiguous
        ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Exclude I, O
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }

    if (opts.lowercase) {
      charset += opts.excludeAmbiguous
        ? 'abcdefghjkmnpqrstuvwxyz' // Exclude i, l, o
        : 'abcdefghijklmnopqrstuvwxyz'
    }

    if (opts.numbers) {
      charset += opts.excludeAmbiguous
        ? '23456789' // Exclude 0, 1
        : '0123456789'
    }

    if (charset.length === 0) {
      throw CryptoErrorFactory.invalidKey(
        'At least one character type must be enabled',
      )
    }

    const bytes = await this.generateBytes(length * 2) // Generate extra for better distribution

    let result = ''

    for (let i = 0; i < length; i++) {
      const index = bytes.readUInt16BE(i * 2) % charset.length

      // eslint-disable-next-line security/detect-object-injection
      result += charset[index]
    }

    return result
  }

  /**
   * Generate secure token for URLs (base64url with no padding)
   */
  static async generateToken(byteLength: number = 32): Promise<string> {
    return this.generateString({
      length: byteLength,
      encoding: 'base64url',
    })
  }

  /**
   * Generate numeric code (useful for SMS verification)
   */
  static async generateNumericCode(length: number = 6): Promise<string> {
    if (length < 4 || length > 10) {
      throw CryptoErrorFactory.invalidKey(
        'Numeric code length must be between 4 and 10',
      )
    }

    const max = Math.pow(10, length) - 1
    const min = Math.pow(10, length - 1)
    const range = max - min + 1

    // Generate enough random bytes to ensure uniform distribution

    const bytesNeeded = Math.ceil(Math.log2(range) / 8) + 1
    const bytes = await this.generateBytes(bytesNeeded)

    // Convert to number and scale to range

    let value = 0

    for (let i = 0; i < bytes.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      value = value * 256 + bytes[i]
    }

    const code = min + (value % range)

    return code.toString().padStart(length, '0')
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  static timingSafeEqual(a: string | Buffer, b: string | Buffer): boolean {
    const bufferA = typeof a === 'string' ? Buffer.from(a) : a
    const bufferB = typeof b === 'string' ? Buffer.from(b) : b

    if (bufferA.length !== bufferB.length) {
      return false
    }

    // Use crypto.timingSafeEqual for constant-time comparison

    try {
      return require('crypto').timingSafeEqual(bufferA, bufferB)
    } catch {
      // Fallback for environments without timingSafeEqual
      let result = 0

      for (let i = 0; i < bufferA.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        result |= bufferA[i] ^ bufferB[i]
      }

      return result === 0
    }
  }
}
