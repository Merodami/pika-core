import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

// Database seed configuration
export const SEED_CLEAR_DATABASE = getEnvVariable(
  'SEED_CLEAR_DATABASE',
  parseBoolean,
  true,
)

export const SEED_SUPERUSER_EMAIL = getEnvVariable(
  'SEED_SUPERUSER_EMAIL',
  parseString,
  'admin@pika.com',
)

export const SEED_SUPERUSER_PASSWORD = getEnvVariable(
  'SEED_SUPERUSER_PASSWORD',
  parseString,
  'Admin123!',
)

export const SEED_USER_COUNT = getEnvVariable(
  'SEED_USER_COUNT',
  parseNumber,
  10,
)

// User counts
export const SEED_ADMIN_USERS_COUNT = getEnvVariable(
  'SEED_ADMIN_USERS_COUNT',
  parseNumber,
  2,
)
