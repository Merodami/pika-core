import { createHash, randomBytes } from 'crypto'

import { ECDSAService } from '../ecdsa/ECDSAService.js'
import { CryptoErrorFactory } from '../errors/CryptoError.js'
import type {
  ECDSACurve,
  JWTAlgorithm,
  JWTConfig,
  JWTHeader,
  JWTValidationResult,
  RedemptionClaims,
} from '../types/crypto.types.js'

/**
 * JWT service for secure token generation and validation using ECDSA
 */
export class JWTService {
  private readonly ecdsaService: ECDSAService
  private readonly issuer: string
  private readonly audience: string
  private readonly algorithm: JWTAlgorithm
  private readonly keyId?: string

  constructor(config: JWTConfig) {
    this.issuer = config.issuer
    this.audience =
      typeof config.audience === 'string' ? config.audience : config.audience[0]
    this.algorithm = config.algorithm
    this.keyId = config.keyId

    // Initialize ECDSA service based on algorithm
    const curve = this.algorithmToCurve(config.algorithm)

    this.ecdsaService = new ECDSAService({ curve })
  }

  /**
   * Generate a JWT token for voucher redemption
   */
  async generateToken(
    claims: RedemptionClaims,
    privateKey: string,
    ttl?: number,
  ): Promise<string> {
    try {
      // Build header
      const header: JWTHeader = {
        alg: this.algorithm,
        typ: 'JWT',
        ...(this.keyId && { kid: this.keyId }),
      }

      // Build payload with standard claims
      const now = Math.floor(Date.now() / 1000)
      const payload: RedemptionClaims = {
        ...claims,
        iss: this.issuer,
        aud: this.audience,
        iat: now,
        jti: this.generateJTI(),
        ...(ttl && { exp: now + ttl }),
      }

      // Create signature
      const headerBase64 = this.base64urlEncode(JSON.stringify(header))
      const payloadBase64 = this.base64urlEncode(JSON.stringify(payload))
      const signingInput = `${headerBase64}.${payloadBase64}`

      const signature = await this.ecdsaService.sign(
        Buffer.from(signingInput),
        privateKey,
      )

      // Combine signature components
      const signatureBytes = Buffer.concat([
        Buffer.from(signature.r, 'hex'),
        Buffer.from(signature.s, 'hex'),
      ])
      // Convert bytes directly to base64url
      const signatureBase64 = signatureBytes
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

      return `${signingInput}.${signatureBase64}`
    } catch (error) {
      throw CryptoErrorFactory.invalidToken(
        'Failed to generate JWT token',
        { algorithm: this.algorithm },
        error as Error,
      )
    }
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(
    token: string,
    publicKey: string,
  ): Promise<JWTValidationResult<RedemptionClaims>> {
    try {
      // Split token
      const parts = token.split('.')

      if (parts.length !== 3) {
        return {
          isValid: false,
          error: 'Invalid token format: expected 3 parts',
        }
      }

      const [headerBase64, payloadBase64, signatureBase64] = parts

      // Decode header
      let header: JWTHeader

      try {
        header = JSON.parse(this.base64urlDecode(headerBase64))
      } catch {
        return {
          isValid: false,
          error: 'Invalid token header',
        }
      }

      // Verify algorithm
      if (header.alg !== this.algorithm) {
        return {
          isValid: false,
          error: `Algorithm mismatch: expected ${this.algorithm}, got ${header.alg}`,
        }
      }

      // Decode payload
      let payload: RedemptionClaims

      try {
        payload = JSON.parse(this.base64urlDecode(payloadBase64))
      } catch {
        return {
          isValid: false,
          error: 'Invalid token payload',
        }
      }

      // Verify signature
      const signingInput = `${headerBase64}.${payloadBase64}`
      // Convert base64url to base64 and then to buffer
      const padding = (4 - (signatureBase64.length % 4)) % 4
      const paddedSignature = signatureBase64 + '='.repeat(padding)
      const base64Signature = paddedSignature
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      const signatureBytes = Buffer.from(base64Signature, 'base64')

      // Split signature into r and s components
      const halfLength = signatureBytes.length / 2
      const r = signatureBytes.slice(0, halfLength).toString('hex')
      const s = signatureBytes.slice(halfLength).toString('hex')

      const isValidSignature = await this.ecdsaService.verify(
        Buffer.from(signingInput),
        {
          r,
          s,
          curve: this.algorithmToCurve(this.algorithm),
          format: 'ieee-p1363',
        },
        publicKey,
      )

      if (!isValidSignature) {
        return {
          isValid: false,
          error: 'Invalid signature',
        }
      }

      // Verify standard claims
      const now = Math.floor(Date.now() / 1000)

      // Check expiration
      if (payload.exp && payload.exp < now) {
        throw CryptoErrorFactory.tokenExpired(new Date(payload.exp * 1000))
      }

      // Check not before
      if (payload.nbf && payload.nbf > now) {
        return {
          isValid: false,
          error: 'Token not yet valid',
        }
      }

      // Check issued at
      if (payload.iat && payload.iat > now + 60) {
        // Allow 1 minute clock skew
        return {
          isValid: false,
          error: 'Token issued in the future',
        }
      }

      // Check issuer
      if (payload.iss !== this.issuer) {
        return {
          isValid: false,
          error: `Invalid issuer: expected ${this.issuer}, got ${payload.iss}`,
        }
      }

      // Check audience
      if (payload.aud !== this.audience) {
        return {
          isValid: false,
          error: `Invalid audience: expected ${this.audience}, got ${payload.aud}`,
        }
      }

      return {
        isValid: true,
        payload,
        header,
      }
    } catch (error) {
      if (error instanceof Error && error.name.includes('TokenExpired')) {
        throw error // Re-throw token expired errors
      }

      return {
        isValid: false,
        error:
          error instanceof Error ? error.message : 'Token validation failed',
      }
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): {
    header: JWTHeader
    payload: RedemptionClaims
  } | null {
    try {
      const parts = token.split('.')

      if (parts.length !== 3) {
        return null
      }

      const header = JSON.parse(this.base64urlDecode(parts[0]))
      const payload = JSON.parse(this.base64urlDecode(parts[1]))

      return { header, payload }
    } catch {
      return null
    }
  }

  /**
   * Generate a unique JWT ID
   */
  private generateJTI(): string {
    // Use cryptographically secure random bytes
    const randomBytesBuffer = randomBytes(16)
    const timestamp = Buffer.from(Date.now().toString())

    return createHash('sha256')
      .update(Buffer.concat([randomBytesBuffer, timestamp]))
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Map JWT algorithm to ECDSA curve
   */
  private algorithmToCurve(algorithm: JWTAlgorithm): ECDSACurve {
    switch (algorithm) {
      case 'ES256':
        return 'P-256'
      case 'ES384':
        return 'P-384'
      case 'ES512':
        return 'P-521'
      case 'ES256K':
        return 'secp256k1'
      default:
        throw CryptoErrorFactory.algorithmMismatch(
          'ES256/ES384/ES512/ES256K',
          algorithm,
        )
    }
  }

  /**
   * Base64URL encode
   */
  private base64urlEncode(input: string | Buffer): string {
    const buffer = typeof input === 'string' ? Buffer.from(input) : input

    return buffer
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  /**
   * Base64URL decode
   */
  private base64urlDecode(input: string): string {
    // Add padding if needed
    const padding = (4 - (input.length % 4)) % 4
    const padded = input + '='.repeat(padding)

    // Convert base64url to base64
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    return Buffer.from(base64, 'base64').toString()
  }
}
