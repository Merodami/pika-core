import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber, parseString } from '../parsers.js'

export const PG_HOST = getEnvVariable('PG_HOST', parseString, 'localhost')
export const PG_PORT = getEnvVariable('PG_PORT', parseNumber, 5435)
export const PG_DATABASE = getEnvVariable('PG_DATABASE', parseString, 'pika')
export const PG_USER = getEnvVariable('PG_USER', parseString, 'postgres')
export const PG_PASSWORD = getEnvVariable(
  'PG_PASSWORD',
  parseString,
  'postgres',
)
export const PG_SSL = getEnvVariable('PG_SSL', parseBoolean, false)
export const PG_MAX_CONNECTIONS = getEnvVariable(
  'PG_MAX_CONNECTIONS',
  parseNumber,
  20,
)
export const PG_IDLE_TIMEOUT = getEnvVariable(
  'PG_IDLE_TIMEOUT',
  parseNumber,
  30000,
)
export const PG_CONNECTION_TIMEOUT = getEnvVariable(
  'PG_CONNECTION_TIMEOUT',
  parseNumber,
  2000,
)
export const DATABASE_URL = getEnvVariable(
  'DATABASE_URL',
  parseString,
  `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`,
)
