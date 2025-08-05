import { ECDSAService } from '../ecdsa/ECDSAService.js'
import { CryptoErrorFactory } from '../errors/CryptoError.js'
import { SecureRandom } from '../random/SecureRandom.js'
import type {
  ECDSACurve,
  JWTAlgorithm,
  KeyInfo,
  KeyManagerConfig,
  KeyMetadata,
  KeyRotationPolicy,
  KeySetInfo,
  KeyStatus,
} from '../types/crypto.types.js'

/**
 * Key management service with Redis storage for secure key rotation
 */
export class KeyManager {
  private readonly redisPrefix: string
  private readonly defaultTTL: number
  private readonly rotationPolicy: KeyRotationPolicy
  private readonly ecdsaServices: Map<ECDSACurve, ECDSAService>
  private readonly pendingTimeouts: Set<NodeJS.Timeout> = new Set()

  constructor(
    private readonly config: KeyManagerConfig,
    private readonly redisClient: Pick<
      import('ioredis').Redis,
      'keys' | 'get' | 'set' | 'del'
    >,
  ) {
    this.redisPrefix = config.redisPrefix || 'crypto:keys'
    this.defaultTTL = config.defaultTTL || 86400 * 30 // 30 days
    this.rotationPolicy = config.rotationPolicy || {
      maxAge: 86400 * 7, // 7 days
      overlap: 3600, // 1 hour overlap
    }

    // Initialize ECDSA services for each curve
    this.ecdsaServices = new Map()
  }

  /**
   * Get or create ECDSA service for a curve
   */
  private getECDSAService(curve: ECDSACurve): ECDSAService {
    if (!this.ecdsaServices.has(curve)) {
      this.ecdsaServices.set(curve, new ECDSAService({ curve }))
    }

    return this.ecdsaServices.get(curve)!
  }

  /**
   * Generate and store a new key pair
   */
  async generateKeyPair(
    keyId: string,
    algorithm: JWTAlgorithm,
    metadata?: Record<string, any>,
  ): Promise<KeyInfo> {
    try {
      const curve = this.algorithmToCurve(algorithm)
      const ecdsaService = this.getECDSAService(curve)

      // Generate key pair
      const keyPair = await ecdsaService.generateKeyPair()

      // Create key info
      const now = Date.now()
      const keyInfo: KeyInfo = {
        keyId,
        algorithm,
        curve,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        status: 'active',
        createdAt: now,
        activatedAt: now,
        rotateAt: now + this.rotationPolicy.maxAge * 1000,
        metadata: (metadata || {}) as KeyMetadata,
      }

      // Store in Redis
      await this.storeKeyInfo(keyInfo)

      // Store public key separately for verification
      await this.storePublicKey(keyId, keyPair.publicKey, algorithm)

      return keyInfo
    } catch (error) {
      throw CryptoErrorFactory.keyGenerationFailed(
        'Failed to generate key pair',
        { keyId, algorithm },
        error as Error,
      )
    }
  }

  /**
   * Get active signing key for an algorithm
   */
  async getActiveSigningKey(algorithm: JWTAlgorithm): Promise<KeyInfo | null> {
    const pattern = `${this.redisPrefix}:active:${algorithm}:*`
    const keys = await this.redisClient.keys(pattern)

    if (keys.length === 0) {
      return null
    }

    // Get all active keys
    const keyInfos: KeyInfo[] = []

    for (const key of keys) {
      const data = await this.redisClient.get(key)

      if (data) {
        keyInfos.push(JSON.parse(data))
      }
    }

    // Sort by activation time (newest first)
    keyInfos.sort((a, b) => (b.activatedAt || 0) - (a.activatedAt || 0))

    // Return the newest active key
    return keyInfos[0] || null
  }

  /**
   * Get public key for verification
   */
  async getPublicKey(keyId: string): Promise<string | null> {
    const key = `${this.redisPrefix}:public:${keyId}`

    return await this.redisClient.get(key)
  }

  /**
   * Get key info by ID
   */
  async getKeyInfo(keyId: string): Promise<KeyInfo | null> {
    const pattern = `${this.redisPrefix}:*:*:${keyId}`
    const keys = await this.redisClient.keys(pattern)

    if (keys.length === 0) {
      return null
    }

    const data = await this.redisClient.get(keys[0])

    return data ? JSON.parse(data) : null
  }

  /**
   * List all keys with optional filtering
   */
  async listKeys(options?: {
    algorithm?: JWTAlgorithm
    status?: KeyStatus
    includeExpired?: boolean
  }): Promise<KeyInfo[]> {
    const pattern = `${this.redisPrefix}:${options?.status || '*'}:${
      options?.algorithm || '*'
    }:*`
    const keys = await this.redisClient.keys(pattern)

    const keyInfos: KeyInfo[] = []
    const now = Date.now()

    for (const key of keys) {
      const data = await this.redisClient.get(key)

      if (data) {
        const keyInfo: KeyInfo = JSON.parse(data)

        // Filter expired keys if requested
        if (
          !options?.includeExpired &&
          keyInfo.expiresAt &&
          keyInfo.expiresAt < now
        ) {
          continue
        }

        keyInfos.push(keyInfo)
      }
    }

    return keyInfos
  }

  /**
   * Rotate keys for an algorithm
   */
  async rotateKeys(algorithm: JWTAlgorithm): Promise<void> {
    try {
      // Get current active key
      const currentKey = await this.getActiveSigningKey(algorithm)

      // Generate new key
      const newKeyId = await this.generateKeyId()
      const newKey = await this.generateKeyPair(newKeyId, algorithm, {
        rotatedFrom: currentKey?.keyId,
      })

      // If there's a current key, update its status
      if (currentKey) {
        await this.updateKeyStatus(currentKey.keyId, 'rotating')

        // Schedule deactivation after overlap period
        const timeout = setTimeout(async () => {
          await this.updateKeyStatus(currentKey.keyId, 'expired')
          this.pendingTimeouts.delete(timeout)
        }, this.rotationPolicy.overlap * 1000)

        this.pendingTimeouts.add(timeout)
      }

      // Log rotation event
      if (this.config.auditLogger) {
        await this.config.auditLogger.log({
          timestamp: new Date(),
          eventType: 'key_rotated',
          keyId: newKey.keyId,
          details: {
            operation: 'key_rotation',
            algorithm,
            oldKeyId: currentKey?.keyId,
            newKeyId: newKey.keyId,
          },
          severity: 'info',
        })
      }
    } catch (error) {
      throw CryptoErrorFactory.keyRotationFailed(
        'Failed to rotate keys',
        { algorithm },
        error as Error,
      )
    }
  }

  /**
   * Update key status
   */
  async updateKeyStatus(keyId: string, status: KeyStatus): Promise<void> {
    const keyInfo = await this.getKeyInfo(keyId)

    if (!keyInfo) {
      throw CryptoErrorFactory.keyNotFound(keyId)
    }

    // Remove old key
    const oldKey = `${this.redisPrefix}:${keyInfo.status}:${keyInfo.algorithm}:${keyId}`

    await this.redisClient.del(oldKey)

    // Update status
    keyInfo.status = status
    if (status === 'expired' || status === 'revoked') {
      keyInfo.expiresAt = Date.now()
    }

    // Store with new status
    await this.storeKeyInfo(keyInfo)

    // Log status change
    if (this.config.auditLogger) {
      await this.config.auditLogger.log({
        timestamp: new Date(),
        eventType: 'key_revoked',
        keyId,
        details: {
          operation: 'key_revocation',
          oldKeyId: keyId,
          reason: `Status changed from ${keyInfo.status} to ${status}`,
        },
        severity: 'info',
      })
    }
  }

  /**
   * Get key set for JWKS endpoint
   */
  async getKeySet(includePrivate = false): Promise<KeySetInfo> {
    const keys = await this.listKeys({
      status: 'active',
      includeExpired: false,
    })

    const jwks = await Promise.all(
      keys.map(async (keyInfo) => {
        const ecdsaService = this.getECDSAService(keyInfo.curve)

        await ecdsaService.exportPublicKey(keyInfo.publicKey)

        return {
          kid: keyInfo.keyId,
          alg: keyInfo.algorithm,
          use: 'sig',
          kty: 'EC',
          crv: this.curveToJWKCurve(keyInfo.curve),
          // In a real implementation, we'd extract x and y coordinates
          // This is a simplified version
          x: Buffer.from(keyInfo.publicKey, 'hex')
            .slice(1, 33)
            .toString('base64url'),
          y: Buffer.from(keyInfo.publicKey, 'hex')
            .slice(33)
            .toString('base64url'),
          ...(includePrivate && keyInfo.privateKey
            ? {
                d: Buffer.from(keyInfo.privateKey, 'hex').toString('base64url'),
              }
            : {}),
        }
      }),
    )

    return {
      keys: jwks,
      rotationPolicy: this.rotationPolicy,
      metadata: {
        generated: new Date().toISOString(),
        count: jwks.length,
      },
    }
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const keys = await this.listKeys({ includeExpired: true })
    const now = Date.now()

    let cleaned = 0

    for (const keyInfo of keys) {
      if (
        keyInfo.expiresAt &&
        keyInfo.expiresAt < now - 86400 * 7 * 1000 // 7 days after expiry
      ) {
        await this.deleteKey(keyInfo.keyId)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Delete a key
   */
  private async deleteKey(keyId: string): Promise<void> {
    const keyInfo = await this.getKeyInfo(keyId)

    if (!keyInfo) {
      return
    }

    // Delete key info
    const key = `${this.redisPrefix}:${keyInfo.status}:${keyInfo.algorithm}:${keyId}`

    await this.redisClient.del(key)

    // Delete public key
    const publicKey = `${this.redisPrefix}:public:${keyId}`

    await this.redisClient.del(publicKey)
  }

  /**
   * Store key info in Redis
   */
  private async storeKeyInfo(keyInfo: KeyInfo): Promise<void> {
    const key = `${this.redisPrefix}:${keyInfo.status}:${keyInfo.algorithm}:${keyInfo.keyId}`
    const ttl = keyInfo.expiresAt
      ? Math.floor((keyInfo.expiresAt - Date.now()) / 1000)
      : this.defaultTTL

    if (ttl > 0) {
      await this.redisClient.set(key, JSON.stringify(keyInfo), 'EX', ttl)
    }
  }

  /**
   * Store public key separately
   */
  private async storePublicKey(
    keyId: string,
    publicKey: string,
    algorithm: JWTAlgorithm,
  ): Promise<void> {
    const key = `${this.redisPrefix}:public:${keyId}`

    await this.redisClient.set(
      key,
      JSON.stringify({ publicKey, algorithm }),
      'EX',
      this.defaultTTL,
    )
  }

  /**
   * Generate unique key ID
   */
  private async generateKeyId(): Promise<string> {
    return SecureRandom.generateAlphanumeric(16, {
      uppercase: true,
      lowercase: false,
      numbers: true,
    })
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
   * Map ECDSA curve to JWK curve name
   */
  private curveToJWKCurve(curve: ECDSACurve): string {
    switch (curve) {
      case 'P-256':
        return 'P-256'
      case 'P-384':
        return 'P-384'
      case 'P-521':
        return 'P-521'
      case 'secp256k1':
        return 'secp256k1'
      default:
        return curve
    }
  }

  /**
   * Clean up pending timeouts and resources
   */
  dispose(): void {
    // Clear all pending timeouts
    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout)
    }

    this.pendingTimeouts.clear()
  }
}
