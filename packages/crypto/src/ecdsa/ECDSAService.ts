import { p256 } from '@noble/curves/p256'
import { p384 } from '@noble/curves/p384'
import { p521 } from '@noble/curves/p521'
import { secp256k1 } from '@noble/curves/secp256k1'
import { sha256 } from '@noble/hashes/sha256'
import { sha384, sha512 } from '@noble/hashes/sha512'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils'

import { CryptoErrorFactory } from '../errors/CryptoError.js'
import type {
  ECDSAConfig,
  ECDSACurve,
  ECDSAKeyPair,
  ECDSASignature,
} from '../types/crypto.types.js'

/**
 * ECDSA cryptographic service for key generation, signing, and verification
 */
export class ECDSAService {
  private readonly curve: ECDSACurve
  private readonly curveImpl: any
  private readonly hashFn: (data: Uint8Array) => Uint8Array

  constructor(config: ECDSAConfig) {
    this.curve = config.curve

    // Select curve implementation
    switch (config.curve) {
      case 'P-256':
        this.curveImpl = p256
        this.hashFn = sha256
        break
      case 'P-384':
        this.curveImpl = p384
        this.hashFn = sha384
        break
      case 'P-521':
        this.curveImpl = p521
        this.hashFn = sha512
        break
      case 'secp256k1':
        this.curveImpl = secp256k1
        this.hashFn = sha256
        break
      default:
        throw CryptoErrorFactory.invalidKey(
          `Unsupported curve: ${config.curve}`,
        )
    }
  }

  /**
   * Generate a new ECDSA key pair
   */
  async generateKeyPair(): Promise<ECDSAKeyPair> {
    try {
      const privateKeyBytes = this.curveImpl.utils.randomPrivateKey()
      const publicKeyBytes = this.curveImpl.getPublicKey(privateKeyBytes)

      return {
        privateKey: bytesToHex(privateKeyBytes),
        publicKey: bytesToHex(publicKeyBytes),
        curve: this.curve,
        format: 'raw',
        createdAt: new Date(),
      }
    } catch (error) {
      throw CryptoErrorFactory.keyGenerationFailed(
        `Failed to generate ${this.curve} key pair`,
        { curve: this.curve },
        error as Error,
      )
    }
  }

  /**
   * Sign a message with a private key
   */
  async sign(message: Buffer, privateKey: string): Promise<ECDSASignature> {
    try {
      const messageBytes = new Uint8Array(message)
      const privateKeyBytes = hexToBytes(privateKey)

      // Validate private key
      if (!this.isValidPrivateKey(privateKeyBytes)) {
        throw CryptoErrorFactory.invalidKey(
          'Invalid private key format or value',
        )
      }

      // Hash the message
      const messageHash = this.hashFn(messageBytes)

      // Sign with deterministic k (RFC 6979)
      const signature = this.curveImpl.sign(messageHash, privateKeyBytes)

      // Ensure low-s form for malleability protection
      const normalizedSig = signature.normalizeS()

      return {
        r: normalizedSig.r.toString(16).padStart(this.getByteLength() * 2, '0'),
        s: normalizedSig.s.toString(16).padStart(this.getByteLength() * 2, '0'),
        curve: this.curve,
        format: 'ieee-p1363',
      }
    } catch (error) {
      // Always throw invalid key error for signing failures
      throw CryptoErrorFactory.invalidKey(
        'Invalid private key format or value',
        { curve: this.curve },
        error as Error,
      )
    }
  }

  /**
   * Verify a signature
   */
  async verify(
    message: Buffer,
    signature: ECDSASignature,
    publicKey: string,
  ): Promise<boolean> {
    try {
      // Quick validation
      if (signature.curve !== this.curve) {
        return false
      }

      const messageBytes = new Uint8Array(message)
      const publicKeyBytes = hexToBytes(publicKey)

      // Validate signature components
      if (
        !this.isValidSignatureComponent(signature.r) ||
        !this.isValidSignatureComponent(signature.s)
      ) {
        return false
      }

      // Hash the message
      const messageHash = this.hashFn(messageBytes)

      // Reconstruct signature object
      const sig = {
        r: BigInt('0x' + signature.r),
        s: BigInt('0x' + signature.s),
      }

      // Verify
      return this.curveImpl.verify(sig, messageHash, publicKeyBytes)
    } catch {
      // Invalid signatures should return false, not throw
      return false
    }
  }

  /**
   * Export public key to PEM format
   */
  async exportPublicKey(publicKey: string): Promise<string> {
    try {
      const publicKeyBytes = hexToBytes(publicKey)

      // For now, use a simplified PEM format
      // In production, use proper ASN.1 encoding library
      const base64 = Buffer.from(publicKeyBytes).toString('base64')

      // Format as PEM
      const chunks = this.chunkString(base64, 64)
      const pem = [
        '-----BEGIN PUBLIC KEY-----',
        ...chunks,
        '-----END PUBLIC KEY-----',
      ].join('\n')

      return pem
    } catch (error) {
      throw CryptoErrorFactory.invalidKey(
        'Failed to export public key',
        { format: 'PEM' },
        error as Error,
      )
    }
  }

  /**
   * Import public key from PEM format
   */
  async importPublicKey(pem: string): Promise<string> {
    try {
      // Extract base64 content
      const base64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\s/g, '')

      // Decode base64
      const publicKeyBytes = Buffer.from(base64, 'base64')

      // Validate it's for the correct curve
      if (!this.isValidPublicKey(publicKeyBytes)) {
        throw CryptoErrorFactory.curveMismatch(this.curve, 'unknown')
      }

      return bytesToHex(publicKeyBytes)
    } catch (error) {
      if (error instanceof Error && error.message.includes('curve')) {
        throw error
      }
      throw CryptoErrorFactory.invalidKey(
        'Failed to import public key',
        { format: 'PEM' },
        error as Error,
      )
    }
  }

  /**
   * Export private key to PEM format
   */
  async exportPrivateKey(privateKey: string): Promise<string> {
    try {
      const privateKeyBytes = hexToBytes(privateKey)

      // Create PKCS#8 structure (simplified)
      const pkcs8 = this.createPKCS8(privateKeyBytes)

      // Base64 encode
      const base64 = Buffer.from(pkcs8).toString('base64')

      // Format as PEM
      const pem = [
        '-----BEGIN EC PRIVATE KEY-----',
        ...this.chunkString(base64, 64),
        '-----END EC PRIVATE KEY-----',
      ].join('\n')

      return pem
    } catch (error) {
      throw CryptoErrorFactory.invalidKey(
        'Failed to export private key',
        { format: 'PEM' },
        error as Error,
      )
    }
  }

  /**
   * Import private key from PEM format
   */
  async importPrivateKey(pem: string): Promise<string> {
    try {
      // Extract base64 content
      const base64 = pem
        .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
        .replace(/-----END EC PRIVATE KEY-----/g, '')
        .replace(/\s/g, '')

      // Decode base64
      const pkcs8 = Buffer.from(base64, 'base64')

      // Extract private key from PKCS#8 (simplified)
      const privateKeyBytes = this.extractPrivateKeyFromPKCS8(pkcs8)

      // Validate
      if (!this.isValidPrivateKey(privateKeyBytes)) {
        throw CryptoErrorFactory.invalidKey('Invalid private key')
      }

      return bytesToHex(privateKeyBytes)
    } catch (error) {
      throw CryptoErrorFactory.invalidKey(
        'Failed to import private key',
        { format: 'PEM' },
        error as Error,
      )
    }
  }

  /**
   * Convert signature to DER format
   */
  async signatureToDER(signature: ECDSASignature): Promise<string> {
    try {
      const r = BigInt('0x' + signature.r)
      const s = BigInt('0x' + signature.s)

      // Create DER encoding
      const rBytes = this.bigIntToBytes(r)
      const sBytes = this.bigIntToBytes(s)

      const rDER = this.createDERInteger(rBytes)
      const sDER = this.createDERInteger(sBytes)

      const sequence = Buffer.concat([rDER, sDER])
      const der = Buffer.concat([
        Buffer.from([0x30, sequence.length]),
        sequence,
      ])

      return der.toString('hex')
    } catch (error) {
      throw CryptoErrorFactory.invalidSignature(
        'Failed to convert signature to DER',
        { format: 'DER' },
        error as Error,
      )
    }
  }

  /**
   * Convert signature from DER format
   */
  async signatureFromDER(
    der: string,
    curve: ECDSACurve,
  ): Promise<ECDSASignature> {
    try {
      const derBytes = Buffer.from(der, 'hex')

      // Parse DER (simplified - real implementation would properly parse ASN.1)
      if (derBytes[0] !== 0x30) {
        throw new Error('Invalid DER sequence')
      }

      // Extract r and s (simplified parsing)
      const { r, s } = this.parseDERSignature(derBytes)

      return {
        r: r.toString(16).padStart(this.getByteLength() * 2, '0'),
        s: s.toString(16).padStart(this.getByteLength() * 2, '0'),
        curve,
        format: 'ieee-p1363',
      }
    } catch (error) {
      throw CryptoErrorFactory.invalidSignature(
        'Failed to parse DER signature',
        { format: 'DER' },
        error as Error,
      )
    }
  }

  /**
   * Get the byte length for the current curve
   */
  private getByteLength(): number {
    switch (this.curve) {
      case 'P-256':
      case 'secp256k1':
        return 32
      case 'P-384':
        return 48
      case 'P-521':
        return 66
      default:
        return 32
    }
  }

  /**
   * Validate private key
   */
  private isValidPrivateKey(key: Uint8Array): boolean {
    try {
      // Check length
      if (key.length !== this.getByteLength()) {
        return false
      }

      // Check if it's within the valid range
      const keyBigInt = BigInt('0x' + bytesToHex(key))

      if (keyBigInt === 0n || keyBigInt >= this.curveImpl.CURVE.n) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Validate public key
   */
  private isValidPublicKey(key: Uint8Array): boolean {
    try {
      // Try to parse the point
      this.curveImpl.ProjectivePoint.fromHex(key)

      return true
    } catch {
      return false
    }
  }

  /**
   * Validate signature component
   */
  private isValidSignatureComponent(component: string): boolean {
    try {
      const value = BigInt('0x' + component)

      return value > 0n && value < this.curveImpl.CURVE.n
    } catch {
      return false
    }
  }

  /**
   * Convert BigInt to bytes with proper padding
   */
  private bigIntToBytes(value: bigint): Uint8Array {
    const hex = value.toString(16)
    const padded = hex.padStart(this.getByteLength() * 2, '0')

    return hexToBytes(padded)
  }

  /**
   * Create DER integer encoding
   */
  private createDERInteger(bytes: Uint8Array): Buffer {
    // Add padding byte if high bit is set
    const needsPadding = bytes[0] >= 0x80
    const content = needsPadding
      ? Buffer.concat([Buffer.from([0x00]), bytes])
      : bytes

    return Buffer.concat([Buffer.from([0x02, content.length]), content])
  }

  /**
   * Parse DER signature (simplified)
   */
  private parseDERSignature(der: Buffer): { r: bigint; s: bigint } {
    let offset = 2 // Skip sequence tag and length

    // Parse r
    // eslint-disable-next-line security/detect-object-injection
    if (der[offset] !== 0x02) throw new Error('Expected INTEGER tag for r')
    offset++

    // eslint-disable-next-line security/detect-object-injection
    const rLength = der[offset]

    offset++

    const rBytes = der.slice(offset, offset + rLength)

    offset += rLength

    // Parse s
    // eslint-disable-next-line security/detect-object-injection
    if (der[offset] !== 0x02) throw new Error('Expected INTEGER tag for s')
    offset++

    // eslint-disable-next-line security/detect-object-injection
    const sLength = der[offset]

    offset++

    const sBytes = der.slice(offset, offset + sLength)

    return {
      r: BigInt('0x' + rBytes.toString('hex')),
      s: BigInt('0x' + sBytes.toString('hex')),
    }
  }

  /**
   * Create PKCS#8 structure (simplified)
   */
  private createPKCS8(privateKey: Uint8Array): Uint8Array {
    // This is a simplified version
    return Buffer.concat([
      Buffer.from(
        '308187020100301306072a8648ce3d020106082a8648ce3d030107046d306b0201010420',
        'hex',
      ),
      privateKey,
      Buffer.from('a144034200', 'hex'),
      this.curveImpl.getPublicKey(privateKey),
    ])
  }

  /**
   * Extract private key from PKCS#8 (simplified)
   */
  private extractPrivateKeyFromPKCS8(pkcs8: Buffer): Uint8Array {
    // This is a simplified version
    // Look for the private key value (usually after specific markers)
    const markerIndex = pkcs8.indexOf(Buffer.from('0420', 'hex'))

    if (markerIndex === -1) throw new Error('Private key not found')

    return pkcs8.slice(markerIndex + 2, markerIndex + 2 + this.getByteLength())
  }

  /**
   * Chunk string into lines
   */
  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = []

    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size))
    }

    return chunks
  }
}
