import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

// Parse Redis configuration from REDIS_URL if available (for cloud providers)
// This runs before the exports below to ensure env vars are set
if (process.env.REDIS_URL && !process.env.REDIS_HOST) {
  try {
    const url = new URL(process.env.REDIS_URL)

    // Set the individual env vars so existing code continues to work
    process.env.REDIS_HOST = url.hostname
    process.env.REDIS_PORT = url.port || '6379'

    // Extract password from the URL
    if (url.password) {
      process.env.REDIS_PASSWORD = url.password
    }

    console.info(
      `Parsed Redis configuration from REDIS_URL: ${url.hostname}:${url.port || '6379'}`,
    )
  } catch (error) {
    console.error('Failed to parse REDIS_URL:', error)
  }
}

export const REDIS_HOST = getEnvVariable('REDIS_HOST', parseString, 'localhost')

export const REDIS_PORT = getEnvVariable('REDIS_PORT', parseNumber, 6380)

export const REDIS_PASSWORD = getEnvVariable('REDIS_PASSWORD', parseString, '')

export const REDIS_PREFIX = getEnvVariable('REDIS_PREFIX', String, 'pika:')

export const REDIS_DEFAULT_TTL = getEnvVariable(
  'REDIS_DEFAULT_TTL',
  Number,
  3600,
)

export const REDIS_RETRY_DELAY = getEnvVariable(
  'REDIS_RETRY_DELAY',
  parseNumber,
  50,
)

export const REDIS_MAX_RETRY_DELAY = getEnvVariable(
  'REDIS_MAX_RETRY_DELAY',
  Number,
  2000,
)

export const CACHE_DISABLED = getEnvVariable(
  'CACHE_DISABLED',
  parseBoolean,
  false,
)
