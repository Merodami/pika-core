import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'

export const JWT_SECRET = getEnvVariable(
  'JWT_SECRET',
  String,
  'a3f2c1b4d5e6f7890a1b2c3d4e5f67890abcdeffedcba0987654321fedcba0987',
)

// JWT Algorithm Configuration (RS256 is industry standard)
export const JWT_ALGORITHM = getEnvVariable(
  'JWT_ALGORITHM',
  parseString,
  'RS256',
)

// JWT Key Pair for RS256
export const JWT_PRIVATE_KEY = getEnvVariable(
  'JWT_PRIVATE_KEY',
  (value: string) => value.replace(/\\n/g, '\n'), // Unescape newlines
  '',
)

export const JWT_PUBLIC_KEY = getEnvVariable(
  'JWT_PUBLIC_KEY',
  (value: string) => value.replace(/\\n/g, '\n'), // Unescape newlines
  '',
)
export const INTERNAL_API_TOKEN = getEnvVariable(
  'INTERNAL_API_TOKEN',
  String,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
)
export const JWT_ACCESS_TOKEN_EXPIRY = getEnvVariable(
  'JWT_ACCESS_EXPIRY',
  parseString,
  '15m',
)
export const JWT_REFRESH_TOKEN_EXPIRY = getEnvVariable(
  'JWT_REFRESH_EXPIRY',
  parseString,
  '7d',
)
export const JWT_ISSUER = getEnvVariable('JWT_ISSUER', parseString, 'pika-api')
export const JWT_AUDIENCE = getEnvVariable(
  'JWT_AUDIENCE',
  parseString,
  'pikapp',
)
export const AUTH_PROVIDER = getEnvVariable(
  'AUTH_PROVIDER',
  parseString,
  'local',
)
export const SKIP_AUTH = getEnvVariable('SKIP_AUTH', parseBoolean, false)

// JWT Secrets - Using JWT_SECRET for backward compatibility
export const JWT_ACCESS_SECRET = getEnvVariable(
  'JWT_SECRET',
  parseString,
  'your-access-token-secret',
)
export const JWT_REFRESH_SECRET = getEnvVariable(
  'JWT_SECRET',
  parseString,
  'your-refresh-token-secret',
)
export const JWT_ACCESS_EXPIRY = getEnvVariable(
  'JWT_ACCESS_EXPIRY',
  parseString,
  '15m',
)
export const JWT_REFRESH_EXPIRY = getEnvVariable(
  'JWT_REFRESH_EXPIRY',
  parseString,
  '7d',
)

// Service-to-Service Authentication
export const SERVICE_API_KEY = getEnvVariable(
  'SERVICE_API_KEY',
  parseString,
  'default-service-api-key',
)
