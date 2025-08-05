// Import shared types from @pika/types
import type {
  JWTAlgorithm as SharedJWTAlgorithm,
  JWTPayload as SharedJWTPayload,
} from '@pika/types'

/**
 * Supported ECDSA curves
 */
export type ECDSACurve = 'P-256' | 'P-384' | 'P-521' | 'secp256k1'

/**
 * Supported signature formats
 */
export type SignatureFormat = 'ieee-p1363' | 'der' | 'jwt'

/**
 * Supported key formats
 */
export type KeyFormat = 'raw' | 'pem' | 'jwk'

/**
 * ECDSA key pair interface
 */
export interface ECDSAKeyPair {
  privateKey: string // Hex encoded
  publicKey: string // Hex encoded (compressed format)
  curve: ECDSACurve
  format: KeyFormat
  createdAt: Date
  keyId?: string
}

/**
 * ECDSA signature interface
 */
export interface ECDSASignature {
  r: string // Hex encoded
  s: string // Hex encoded
  curve: ECDSACurve
  format: SignatureFormat
}

/**
 * ECDSA service configuration
 */
export interface ECDSAConfig {
  curve: ECDSACurve
  format?: KeyFormat
}

/**
 * Key storage interface for key management
 */
export interface KeyStorage {
  store(keyId: string, keyPair: ECDSAKeyPair): Promise<void>
  retrieve(keyId: string): Promise<ECDSAKeyPair | null>
  retrievePublicKey(keyId: string): Promise<string | null>
  list(filter?: KeyFilter): Promise<KeyMetadata[]>
  delete(keyId: string): Promise<void>
  rotate(oldKeyId: string, newKeyPair: ECDSAKeyPair): Promise<void>
}

/**
 * Key filter options
 */
export interface KeyFilter {
  curve?: ECDSACurve
  createdAfter?: Date
  createdBefore?: Date
  status?: KeyStatus
}

/**
 * Key status
 */
export type KeyStatus = 'active' | 'rotating' | 'expired' | 'revoked'

// Re-export for backward compatibility and add crypto-specific algorithms
export type JWTAlgorithm = SharedJWTAlgorithm | 'ES256K'

/**
 * JWT configuration
 */
export interface JWTConfig {
  algorithm: JWTAlgorithm
  issuer: string
  audience: string | string[]
  defaultTTL?: number // seconds
  keyId?: string
}

/**
 * JWT validation result
 */
export interface JWTValidationResult<T extends JWTPayload = JWTPayload> {
  isValid: boolean
  payload?: T
  header?: JWTHeader
  error?: string
}

/**
 * JWT sign options
 */
export interface JWTSignOptions {
  expiresIn?: number // seconds
  notBefore?: number // seconds
  jwtid?: string
  subject?: string
  audience?: string | string[]
  keyId?: string
}

/**
 * JWT verify options
 */
export interface JWTVerifyOptions {
  audience?: string | string[]
  issuer?: string
  algorithms?: JWTAlgorithm[]
  clockTolerance?: number // seconds
  maxAge?: number // seconds
}

/**
 * JWT header
 */
export interface JWTHeader {
  alg: JWTAlgorithm
  typ: 'JWT'
  kid?: string // Key ID
}

// Re-export for backward compatibility
export type JWTPayload = SharedJWTPayload

// Voucher-specific JWT claims - matches original pika-old structure
export interface VoucherJWTClaims extends JWTPayload {
  vid: string // Voucher ID
  uid?: string // User ID (optional for print vouchers)
  typ: 'user' | 'print' // Token type
  btc?: string // Batch code (for print vouchers)
  lmt?: number // Redemption limit
  pid?: string // Provider ID (for tracking which provider redeemed)
}

// Use VoucherJWTClaims, aliased as RedemptionClaims for backward compatibility
export type RedemptionClaims = VoucherJWTClaims

/**
 * Secure random options
 */
export interface RandomOptions {
  length: number
  encoding?: 'hex' | 'base64' | 'base64url'
}

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
  rotationInterval: number // days
  overlapPeriod: number // days
  autoRotate: boolean
}

/**
 * Security audit event
 */
/**
 * Structured audit event details with discriminated unions
 * Following industry standard for type-safe logging
 */
export type SecurityAuditEventDetails =
  | KeyOperationDetails
  | TokenOperationDetails
  | SecurityViolationDetails

export interface KeyOperationDetails {
  operation: 'key_generation' | 'key_rotation' | 'key_revocation'
  algorithm?: string
  oldKeyId?: string
  newKeyId?: string
  reason?: string
}

export interface TokenOperationDetails {
  operation: 'token_generation' | 'token_verification' | 'token_rejection'
  tokenType?: 'user' | 'print'
  algorithm?: string
  keyId?: string
  reason?: string
}

export interface SecurityViolationDetails {
  operation: 'security_violation'
  violationType: string
  source: string
  targetKeyId?: string
  errorMessage?: string
}

export interface SecurityAuditEvent {
  timestamp: Date
  eventType: SecurityEventType
  keyId?: string
  userId?: string
  details: SecurityAuditEventDetails
  severity: 'info' | 'warning' | 'error' | 'critical'
}

/**
 * Security event types
 */
export type SecurityEventType =
  | 'key_generated'
  | 'key_rotated'
  | 'key_revoked'
  | 'token_generated'
  | 'token_verified'
  | 'token_rejected'
  | 'signature_created'
  | 'signature_verified'
  | 'signature_rejected'
  | 'security_violation'

/**
 * Key information interface
 */
/**
 * Extended key metadata for audit logging and additional context
 * Contains optional extensible properties for tracking and analytics
 */
export interface KeyMetadata {
  purpose?: string
  rotationCount?: number
  lastUsed?: number // Unix timestamp
  tags?: string[]
  environment?: 'development' | 'staging' | 'production'
  source?: string
  // Compatible index signature - no Date types to avoid conflicts
  [key: string]: string | number | boolean | string[] | undefined
}

export interface KeyInfo {
  keyId: string
  algorithm: JWTAlgorithm
  curve: ECDSACurve
  publicKey: string
  privateKey: string
  status: KeyStatus
  createdAt: number
  activatedAt?: number
  expiresAt?: number
  rotateAt?: number
  metadata: KeyMetadata
}

/**
 * Key manager configuration
 */
export interface KeyManagerConfig {
  redisPrefix?: string
  defaultTTL?: number
  rotationPolicy?: KeyRotationPolicy
  auditLogger?: {
    log: (event: SecurityAuditEvent) => Promise<void>
  }
}

/**
 * Key rotation policy
 */
export interface KeyRotationPolicy {
  maxAge: number // seconds
  overlap: number // seconds
}

/**
 * Key set information for JWKS
 */
/**
 * JSON Web Key (JWK) interface for JWKS
 */
export interface JWK {
  kty: string // Key type
  use?: string // Key use
  key_ops?: string[] // Key operations
  alg?: string // Algorithm
  kid?: string // Key ID
  x5c?: string[] // X.509 Certificate Chain
  x5t?: string // X.509 Certificate SHA-1 Thumbprint
  x5u?: string // X.509 URL
  crv?: string // Curve (for EC keys)
  x?: string // X coordinate (for EC keys)
  y?: string // Y coordinate (for EC keys)
  n?: string // Modulus (for RSA keys)
  e?: string // Exponent (for RSA keys)
}

export interface KeySetInfo {
  keys: JWK[]
  rotationPolicy: KeyRotationPolicy
  metadata: {
    generated: string
    count: number
  }
}

/**
 * QR code generation metadata based on actual usage
 * Clean interface for fresh development
 */
export interface QRMetadata {
  // Core properties (always present after generation)
  byteSize: number
  complexity: 'low' | 'medium' | 'high'
  tokenType: 'user' | 'print'

  // QR-specific properties (from TokenHelpers analysis)
  qrCodeVersion: number
  estimatedScanTime: 'fast' | 'medium' | 'slow'
  mobileOptimized: boolean

  // Caching and optimization (set by VoucherQRService)
  cached?: boolean
  optimized?: boolean

  // Generation metadata
  generatedAt?: Date
  cachedUntil?: Date
}

/**
 * Voucher information extracted from JWT claims
 */
export interface VoucherInfo {
  voucherId: string
  userId?: string
  tokenType: 'user' | 'print'
  batchCode?: string
  limit?: number
  providerId?: string
  expiresAt?: Date
  issuedAt?: Date
}

/**
 * Crypto error codes
 */
export enum CryptoErrorCode {
  INVALID_KEY = 'CRYPTO_INVALID_KEY',
  INVALID_SIGNATURE = 'CRYPTO_INVALID_SIGNATURE',
  INVALID_TOKEN = 'CRYPTO_INVALID_TOKEN',
  KEY_NOT_FOUND = 'CRYPTO_KEY_NOT_FOUND',
  KEY_EXPIRED = 'CRYPTO_KEY_EXPIRED',
  TOKEN_EXPIRED = 'CRYPTO_TOKEN_EXPIRED',
  CURVE_MISMATCH = 'CRYPTO_CURVE_MISMATCH',
  ALGORITHM_MISMATCH = 'CRYPTO_ALGORITHM_MISMATCH',
  ROTATION_FAILED = 'CRYPTO_ROTATION_FAILED',
  GENERATION_FAILED = 'CRYPTO_GENERATION_FAILED',
}
