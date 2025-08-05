import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

export const RATE_LIMIT_ENABLE = getEnvVariable(
  'RATE_LIMIT_ENABLE',
  parseBoolean,
  true,
)
export const RATE_LIMIT_MAX = getEnvVariable('RATE_LIMIT_MAX', parseNumber, 40)
export const RATE_LIMIT_WINDOW = getEnvVariable(
  'RATE_LIMIT_WINDOW',
  parseString,
  '1 minute',
)
export const RATE_LIMIT_WINDOW_MS = getEnvVariable(
  'RATE_LIMIT_WINDOW_MS',
  parseNumber,
  900000, // 15 minutes in milliseconds
)

// PDF service specific rate limiting
export const PDF_RATE_LIMIT_MAX_REQUESTS_PER_HOUR = getEnvVariable(
  'PDF_RATE_LIMIT_MAX_REQUESTS_PER_HOUR',
  parseNumber,
  100,
)

export const PDF_RATE_LIMIT_MAX_REQUESTS_PER_DAY = getEnvVariable(
  'PDF_RATE_LIMIT_MAX_REQUESTS_PER_DAY',
  parseNumber,
  1000,
)

export const PDF_RATE_LIMIT_WINDOW_SIZE_MINUTES = getEnvVariable(
  'PDF_RATE_LIMIT_WINDOW_SIZE_MINUTES',
  parseNumber,
  60,
)
