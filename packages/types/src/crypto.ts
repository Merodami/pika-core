/**
 * Shared cryptographic and JWT types
 */

/**
 * JWT signing algorithms
 * Industry standard algorithms for JWT token signing
 */
export type JWTAlgorithm =
  | 'RS256'
  | 'RS384'
  | 'RS512' // RSA
  | 'ES256'
  | 'ES384'
  | 'ES512' // ECDSA
  | 'HS256'
  | 'HS384'
  | 'HS512' // HMAC

/**
 * Base JWT payload structure
 */
export interface JWTPayload {
  iss?: string // Issuer
  sub?: string // Subject
  aud?: string | string[] // Audience
  exp?: number // Expiration time
  nbf?: number // Not before
  iat?: number // Issued at
  jti?: string // JWT ID
  [key: string]: any // Additional claims
}

/**
 * Key pair structure
 */
export interface KeyPair {
  privateKey: string
  publicKey: string
  algorithm: JWTAlgorithm
}

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
