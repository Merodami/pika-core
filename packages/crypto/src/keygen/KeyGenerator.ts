import type { JWTAlgorithm, KeyPair } from '@pika/types'
import { generateKeyPairSync, randomBytes } from 'crypto'
import { get } from 'lodash-es'

import { CryptoError } from '../errors/CryptoError.js'
import { CryptoErrorCode } from '../types/crypto.types.js'

export interface KeyGeneratorOptions {
  algorithm?: JWTAlgorithm
  modulusLength?: number
}

export class KeyGenerator {
  private static readonly DEFAULT_RSA_MODULUS_LENGTH = 3072
  private static readonly DEFAULT_EC_CURVE = 'prime256v1'

  /**
   * Generate RSA key pair for JWT signing
   * Uses RS256 (RSA Signature with SHA-256) - industry standard
   */
  static generateRSAKeyPair(options?: KeyGeneratorOptions): KeyPair {
    const modulusLength =
      options?.modulusLength || this.DEFAULT_RSA_MODULUS_LENGTH

    try {
      const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      })

      return {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        algorithm: options?.algorithm || 'RS256',
      }
    } catch (error) {
      throw new CryptoError(
        'Failed to generate RSA key pair',
        CryptoErrorCode.GENERATION_FAILED,
        { algorithm: 'RS256', modulusLength },
        error as Error,
      )
    }
  }

  /**
   * Generate ECDSA key pair for compact JWT tokens
   * Uses ES256 (ECDSA with P-256 and SHA-256)
   */
  static generateECDSAKeyPair(options?: KeyGeneratorOptions): KeyPair {
    const algorithm = options?.algorithm || 'ES256'

    // Map algorithm to curve
    const curveMap: Record<string, string> = {
      ES256: 'prime256v1',
      ES384: 'secp384r1',
      ES512: 'secp521r1',
    }

    const namedCurve = get(curveMap, algorithm, this.DEFAULT_EC_CURVE)

    try {
      const { privateKey, publicKey } = generateKeyPairSync('ec', {
        namedCurve,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      })

      return {
        privateKey: privateKey.toString(),
        publicKey: publicKey.toString(),
        algorithm,
      }
    } catch (error) {
      throw new CryptoError(
        'Failed to generate ECDSA key pair',
        CryptoErrorCode.GENERATION_FAILED,
        { algorithm, curve: namedCurve },
        error as Error,
      )
    }
  }

  /**
   * Generate a secure random secret for HMAC algorithms
   */
  static generateSecret(length: number = 64): string {
    try {
      return randomBytes(length).toString('hex')
    } catch (error) {
      throw new CryptoError(
        'Failed to generate random secret',
        CryptoErrorCode.GENERATION_FAILED,
        { length },
        error as Error,
      )
    }
  }

  /**
   * Convert multiline PEM to single line for environment variables
   */
  static escapeForEnv(key: string): string {
    return key.replace(/\n/g, '\\n')
  }

  /**
   * Parse escaped PEM from environment variable
   */
  static parseFromEnv(key: string | undefined): string {
    if (!key) {
      throw new Error('Key is required')
    }

    return key.replace(/\\n/g, '\n')
  }

  /**
   * Generate all key pairs for Pika platform
   */
  static generatePlatformKeys(): {
    auth: KeyPair
    voucher: KeyPair
    redemption: KeyPair
    jwtSecret: string
  } {
    return {
      auth: this.generateRSAKeyPair(),
      voucher: this.generateRSAKeyPair(),
      redemption: this.generateRSAKeyPair(),
      jwtSecret: this.generateSecret(),
    }
  }
}
