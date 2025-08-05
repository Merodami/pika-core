import { describe, expect, it } from 'vitest'

import {
  AlgorithmMismatchError,
  CryptoError,
  CryptoErrorFactory,
  CurveMismatchError,
  InvalidKeyError,
  InvalidSignatureError,
  InvalidTokenError,
  KeyExpiredError,
  KeyGenerationError,
  KeyNotFoundError,
  KeyRotationError,
  TokenExpiredError,
} from '../../../errors/CryptoError.js'
import { CryptoErrorCode } from '../../../types/crypto.types.js'

describe('CryptoError', () => {
  describe('Base CryptoError', () => {
    it('should create error with all properties', () => {
      const cause = new Error('Original error')
      const details = { keyId: 'test-key', algorithm: 'ES256' }
      const error = new CryptoError(
        'Test error message',
        CryptoErrorCode.INVALID_KEY,
        details,
        cause,
      )

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(CryptoError)
      expect(error.message).toBe('Test error message')
      expect(error.name).toBe('CryptoError')
      expect(error.code).toBe(CryptoErrorCode.INVALID_KEY)
      expect(error.details).toEqual(details)
      expect(error.cause).toBe(cause)
      expect(error.stack).toBeDefined()
    })

    it('should serialize to JSON correctly', () => {
      const error = new CryptoError(
        'Test error',
        CryptoErrorCode.INVALID_KEY,
        { foo: 'bar' },
        new Error('Cause'),
      )

      const json = error.toJSON()

      expect(json).toEqual({
        name: 'CryptoError',
        message: 'Test error',
        code: CryptoErrorCode.INVALID_KEY,
        details: { foo: 'bar' },
        stack: expect.any(String),
        cause: 'Cause',
      })
    })

    it('should handle missing optional properties', () => {
      const error = new CryptoError('Simple error', CryptoErrorCode.INVALID_KEY)

      expect(error.details).toBeUndefined()
      expect(error.cause).toBeUndefined()
    })
  })

  describe('InvalidKeyError', () => {
    it('should create error with correct properties', () => {
      const error = new InvalidKeyError('Invalid private key format')

      expect(error).toBeInstanceOf(CryptoError)
      expect(error).toBeInstanceOf(InvalidKeyError)
      expect(error.name).toBe('InvalidKeyError')
      expect(error.code).toBe(CryptoErrorCode.INVALID_KEY)
      expect(error.message).toBe('Invalid private key format')
    })

    it('should include details and cause', () => {
      const cause = new Error('Parse error')
      const error = new InvalidKeyError(
        'Failed to parse key',
        { format: 'PEM' },
        cause,
      )

      expect(error.details).toEqual({ format: 'PEM' })
      expect(error.cause).toBe(cause)
    })
  })

  describe('InvalidSignatureError', () => {
    it('should create error correctly', () => {
      const error = new InvalidSignatureError('Signature verification failed')

      expect(error).toBeInstanceOf(InvalidSignatureError)
      expect(error.name).toBe('InvalidSignatureError')
      expect(error.code).toBe(CryptoErrorCode.INVALID_SIGNATURE)
    })
  })

  describe('InvalidTokenError', () => {
    it('should create error correctly', () => {
      const error = new InvalidTokenError('Malformed JWT')

      expect(error).toBeInstanceOf(InvalidTokenError)
      expect(error.name).toBe('InvalidTokenError')
      expect(error.code).toBe(CryptoErrorCode.INVALID_TOKEN)
    })
  })

  describe('KeyNotFoundError', () => {
    it('should create error with key ID', () => {
      const error = new KeyNotFoundError('key-123')

      expect(error).toBeInstanceOf(KeyNotFoundError)
      expect(error.name).toBe('KeyNotFoundError')
      expect(error.code).toBe(CryptoErrorCode.KEY_NOT_FOUND)
      expect(error.message).toBe('Key not found: key-123')
    })

    it('should include additional details', () => {
      const error = new KeyNotFoundError('key-456', { storage: 'redis' })

      expect(error.details).toEqual({ storage: 'redis' })
    })
  })

  describe('KeyExpiredError', () => {
    it('should create error with expiration info', () => {
      const expiresAt = new Date('2024-01-01T00:00:00Z')
      const error = new KeyExpiredError('key-789', expiresAt)

      expect(error).toBeInstanceOf(KeyExpiredError)
      expect(error.name).toBe('KeyExpiredError')
      expect(error.code).toBe(CryptoErrorCode.KEY_EXPIRED)
      expect(error.message).toBe(
        'Key key-789 expired at 2024-01-01T00:00:00.000Z',
      )
      expect(error.details?.keyId).toBe('key-789')
      expect(error.details?.expiresAt).toBe(expiresAt)
    })
  })

  describe('TokenExpiredError', () => {
    it('should create error with expiration time', () => {
      const expiresAt = new Date('2024-06-01T12:00:00Z')
      const error = new TokenExpiredError(expiresAt)

      expect(error).toBeInstanceOf(TokenExpiredError)
      expect(error.name).toBe('TokenExpiredError')
      expect(error.code).toBe(CryptoErrorCode.TOKEN_EXPIRED)
      expect(error.message).toBe('Token expired at 2024-06-01T12:00:00.000Z')
      expect(error.details?.expiresAt).toBe(expiresAt)
    })
  })

  describe('CurveMismatchError', () => {
    it('should create error with curve details', () => {
      const error = new CurveMismatchError('P-256', 'P-384')

      expect(error).toBeInstanceOf(CurveMismatchError)
      expect(error.name).toBe('CurveMismatchError')
      expect(error.code).toBe(CryptoErrorCode.CURVE_MISMATCH)
      expect(error.message).toBe('Curve mismatch: expected P-256, got P-384')
      expect(error.details).toEqual({ expected: 'P-256', actual: 'P-384' })
    })
  })

  describe('AlgorithmMismatchError', () => {
    it('should create error with algorithm details', () => {
      const error = new AlgorithmMismatchError('ES256', 'RS256')

      expect(error).toBeInstanceOf(AlgorithmMismatchError)
      expect(error.name).toBe('AlgorithmMismatchError')
      expect(error.code).toBe(CryptoErrorCode.ALGORITHM_MISMATCH)
      expect(error.message).toBe(
        'Algorithm mismatch: expected ES256, got RS256',
      )
      expect(error.details).toEqual({ expected: 'ES256', actual: 'RS256' })
    })
  })

  describe('KeyRotationError', () => {
    it('should create error correctly', () => {
      const error = new KeyRotationError('Failed to rotate key')

      expect(error).toBeInstanceOf(KeyRotationError)
      expect(error.name).toBe('KeyRotationError')
      expect(error.code).toBe(CryptoErrorCode.ROTATION_FAILED)
    })
  })

  describe('KeyGenerationError', () => {
    it('should create error correctly', () => {
      const error = new KeyGenerationError('Failed to generate key pair')

      expect(error).toBeInstanceOf(KeyGenerationError)
      expect(error.name).toBe('KeyGenerationError')
      expect(error.code).toBe(CryptoErrorCode.GENERATION_FAILED)
    })
  })

  describe('CryptoErrorFactory', () => {
    it('should create InvalidKeyError', () => {
      const error = CryptoErrorFactory.invalidKey('Bad key')

      expect(error).toBeInstanceOf(InvalidKeyError)
    })

    it('should create InvalidSignatureError', () => {
      const error = CryptoErrorFactory.invalidSignature('Bad signature')

      expect(error).toBeInstanceOf(InvalidSignatureError)
    })

    it('should create InvalidTokenError', () => {
      const error = CryptoErrorFactory.invalidToken('Bad token')

      expect(error).toBeInstanceOf(InvalidTokenError)
    })

    it('should create KeyNotFoundError', () => {
      const error = CryptoErrorFactory.keyNotFound('missing-key')

      expect(error).toBeInstanceOf(KeyNotFoundError)
    })

    it('should create KeyExpiredError', () => {
      const error = CryptoErrorFactory.keyExpired('old-key', new Date())

      expect(error).toBeInstanceOf(KeyExpiredError)
    })

    it('should create TokenExpiredError', () => {
      const error = CryptoErrorFactory.tokenExpired(new Date())

      expect(error).toBeInstanceOf(TokenExpiredError)
    })

    it('should create CurveMismatchError', () => {
      const error = CryptoErrorFactory.curveMismatch('P-256', 'P-384')

      expect(error).toBeInstanceOf(CurveMismatchError)
    })

    it('should create AlgorithmMismatchError', () => {
      const error = CryptoErrorFactory.algorithmMismatch('ES256', 'RS256')

      expect(error).toBeInstanceOf(AlgorithmMismatchError)
    })

    it('should create KeyRotationError', () => {
      const error = CryptoErrorFactory.keyRotationFailed('Rotation failed')

      expect(error).toBeInstanceOf(KeyRotationError)
    })

    it('should create KeyGenerationError', () => {
      const error = CryptoErrorFactory.keyGenerationFailed('Generation failed')

      expect(error).toBeInstanceOf(KeyGenerationError)
    })
  })

  describe('Error inheritance chain', () => {
    it('should maintain proper prototype chain', () => {
      const errors = [
        new InvalidKeyError('test'),
        new InvalidSignatureError('test'),
        new InvalidTokenError('test'),
        new KeyNotFoundError('test'),
        new KeyExpiredError('test', new Date()),
        new TokenExpiredError(new Date()),
        new CurveMismatchError('P-256', 'P-384'),
        new AlgorithmMismatchError('ES256', 'RS256'),
        new KeyRotationError('test'),
        new KeyGenerationError('test'),
      ]

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(CryptoError)
        expect(error.stack).toBeDefined()
        expect(error.stack).toContain(error.constructor.name)
      })
    })
  })

  describe('Error handling in try-catch', () => {
    it('should be catchable as CryptoError', () => {
      const throwAndCatch = () => {
        try {
          throw new InvalidKeyError('Test error')
        } catch (error) {
          if (error instanceof CryptoError) {
            return error.code
          }
          throw error
        }
      }

      expect(throwAndCatch()).toBe(CryptoErrorCode.INVALID_KEY)
    })

    it('should distinguish between error types', () => {
      const errors = [
        new InvalidKeyError('key'),
        new InvalidSignatureError('sig'),
        new InvalidTokenError('token'),
      ]

      errors.forEach((error) => {
        try {
          throw error
        } catch (e) {
          if (e instanceof InvalidKeyError) {
            expect(e.code).toBe(CryptoErrorCode.INVALID_KEY)
          } else if (e instanceof InvalidSignatureError) {
            expect(e.code).toBe(CryptoErrorCode.INVALID_SIGNATURE)
          } else if (e instanceof InvalidTokenError) {
            expect(e.code).toBe(CryptoErrorCode.INVALID_TOKEN)
          }
        }
      })
    })
  })
})
