import { JWT_ALGORITHM, JWT_PRIVATE_KEY, JWT_SECRET } from '@pika/environment'
import { UserStatus } from '@pika/types'
import jwt from 'jsonwebtoken'

/**
 * Get the appropriate signing key based on algorithm
 */
function getSigningKey(algorithm: jwt.Algorithm): string | Buffer {
  if (algorithm.startsWith('HS')) {
    if (!JWT_SECRET) {
      throw new Error(
        'JWT_SECRET environment variable is required for HMAC algorithms',
      )
    }

    return JWT_SECRET
  } else if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
    if (!JWT_PRIVATE_KEY) {
      throw new Error(
        'JWT_PRIVATE_KEY environment variable is required for RSA/ECDSA algorithms',
      )
    }

    return JWT_PRIVATE_KEY
  }
  throw new Error(`Unsupported algorithm: ${algorithm}`)
}

/**
 * Generate a test access token for integration tests
 */
export function generateAccessToken(
  payload: {
    userId: string
    email: string
    role: string
    type?: string
    status?: UserStatus
  },
  expiresInSeconds: number = 900,
): string {
  const now = Math.floor(Date.now() / 1000)
  const algorithm = (JWT_ALGORITHM || 'HS256') as jwt.Algorithm
  const signingKey = getSigningKey(algorithm)

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status || UserStatus.ACTIVE,
      type: payload.type || 'access',
      iat: now,
      exp: now + expiresInSeconds,
      iss: 'pika-api',
      aud: 'pikapp',
    },
    signingKey,
    { algorithm },
  )
}

/**
 * Generate a test refresh token for integration tests
 */
export function generateRefreshToken(
  payload: {
    userId: string
    email: string
    role: string
    status?: UserStatus
  },
  expiresInDays: number = 7,
): string {
  const now = Math.floor(Date.now() / 1000)
  const expiresInSeconds = expiresInDays * 24 * 60 * 60
  const algorithm = (JWT_ALGORITHM || 'HS256') as jwt.Algorithm
  const signingKey = getSigningKey(algorithm)

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status || UserStatus.ACTIVE,
      type: 'refresh',
      iat: now,
      exp: now + expiresInSeconds,
      iss: 'pikapi',
      aud: 'pikapp',
    },
    signingKey,
    { algorithm },
  )
}
