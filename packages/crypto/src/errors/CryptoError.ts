import { CryptoErrorCode } from '../types/crypto.types.js'

/**
 * Base error class for all crypto-related errors
 */
export class CryptoError extends Error {
  public readonly code: CryptoErrorCode
  public readonly details?: Record<string, any>
  public readonly cause?: Error

  constructor(
    message: string,
    code: CryptoErrorCode,
    details?: Record<string, any>,
    cause?: Error,
  ) {
    super(message)
    this.name = 'CryptoError'
    this.code = code
    this.details = details
    this.cause = cause

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
      cause: this.cause?.message,
    }
  }
}

/**
 * Error thrown when a cryptographic key is invalid
 */
export class InvalidKeyError extends CryptoError {
  constructor(message: string, details?: Record<string, any>, cause?: Error) {
    super(message, CryptoErrorCode.INVALID_KEY, details, cause)
    this.name = 'InvalidKeyError'
  }
}

/**
 * Error thrown when a signature is invalid
 */
export class InvalidSignatureError extends CryptoError {
  constructor(message: string, details?: Record<string, any>, cause?: Error) {
    super(message, CryptoErrorCode.INVALID_SIGNATURE, details, cause)
    this.name = 'InvalidSignatureError'
  }
}

/**
 * Error thrown when a token is invalid
 */
export class InvalidTokenError extends CryptoError {
  constructor(message: string, details?: Record<string, any>, cause?: Error) {
    super(message, CryptoErrorCode.INVALID_TOKEN, details, cause)
    this.name = 'InvalidTokenError'
  }
}

/**
 * Error thrown when a key is not found
 */
export class KeyNotFoundError extends CryptoError {
  constructor(keyId: string, details?: Record<string, any>) {
    super(`Key not found: ${keyId}`, CryptoErrorCode.KEY_NOT_FOUND, details)
    this.name = 'KeyNotFoundError'
  }
}

/**
 * Error thrown when a key has expired
 */
export class KeyExpiredError extends CryptoError {
  constructor(keyId: string, expiresAt: Date, details?: Record<string, any>) {
    super(
      `Key ${keyId} expired at ${expiresAt.toISOString()}`,
      CryptoErrorCode.KEY_EXPIRED,
      { keyId, expiresAt, ...details },
    )
    this.name = 'KeyExpiredError'
  }
}

/**
 * Error thrown when a token has expired
 */
export class TokenExpiredError extends CryptoError {
  constructor(expiresAt: Date, details?: Record<string, any>) {
    super(
      `Token expired at ${expiresAt.toISOString()}`,
      CryptoErrorCode.TOKEN_EXPIRED,
      { expiresAt, ...details },
    )
    this.name = 'TokenExpiredError'
  }
}

/**
 * Error thrown when there's a curve mismatch
 */
export class CurveMismatchError extends CryptoError {
  constructor(expected: string, actual: string, details?: Record<string, any>) {
    super(
      `Curve mismatch: expected ${expected}, got ${actual}`,
      CryptoErrorCode.CURVE_MISMATCH,
      { expected, actual, ...details },
    )
    this.name = 'CurveMismatchError'
  }
}

/**
 * Error thrown when there's an algorithm mismatch
 */
export class AlgorithmMismatchError extends CryptoError {
  constructor(expected: string, actual: string, details?: Record<string, any>) {
    super(
      `Algorithm mismatch: expected ${expected}, got ${actual}`,
      CryptoErrorCode.ALGORITHM_MISMATCH,
      { expected, actual, ...details },
    )
    this.name = 'AlgorithmMismatchError'
  }
}

/**
 * Error thrown when key rotation fails
 */
export class KeyRotationError extends CryptoError {
  constructor(message: string, details?: Record<string, any>, cause?: Error) {
    super(message, CryptoErrorCode.ROTATION_FAILED, details, cause)
    this.name = 'KeyRotationError'
  }
}

/**
 * Error thrown when key generation fails
 */
export class KeyGenerationError extends CryptoError {
  constructor(message: string, details?: Record<string, any>, cause?: Error) {
    super(message, CryptoErrorCode.GENERATION_FAILED, details, cause)
    this.name = 'KeyGenerationError'
  }
}

/**
 * Factory for creating crypto errors
 */
export class CryptoErrorFactory {
  static invalidKey(
    message: string,
    details?: Record<string, any>,
    cause?: Error,
  ): InvalidKeyError {
    return new InvalidKeyError(message, details, cause)
  }

  static invalidSignature(
    message: string,
    details?: Record<string, any>,
    cause?: Error,
  ): InvalidSignatureError {
    return new InvalidSignatureError(message, details, cause)
  }

  static invalidToken(
    message: string,
    details?: Record<string, any>,
    cause?: Error,
  ): InvalidTokenError {
    return new InvalidTokenError(message, details, cause)
  }

  static keyNotFound(
    keyId: string,
    details?: Record<string, any>,
  ): KeyNotFoundError {
    return new KeyNotFoundError(keyId, details)
  }

  static keyExpired(
    keyId: string,
    expiresAt: Date,
    details?: Record<string, any>,
  ): KeyExpiredError {
    return new KeyExpiredError(keyId, expiresAt, details)
  }

  static tokenExpired(
    expiresAt: Date,
    details?: Record<string, any>,
  ): TokenExpiredError {
    return new TokenExpiredError(expiresAt, details)
  }

  static curveMismatch(
    expected: string,
    actual: string,
    details?: Record<string, any>,
  ): CurveMismatchError {
    return new CurveMismatchError(expected, actual, details)
  }

  static algorithmMismatch(
    expected: string,
    actual: string,
    details?: Record<string, any>,
  ): AlgorithmMismatchError {
    return new AlgorithmMismatchError(expected, actual, details)
  }

  static keyRotationFailed(
    message: string,
    details?: Record<string, any>,
    cause?: Error,
  ): KeyRotationError {
    return new KeyRotationError(message, details, cause)
  }

  static keyGenerationFailed(
    message: string,
    details?: Record<string, any>,
    cause?: Error,
  ): KeyGenerationError {
    return new KeyGenerationError(message, details, cause)
  }
}
