import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'
import { NODE_ENV } from './node.js'

export const CORS_ORIGIN = getEnvVariable('CORS_ORIGIN', parseString, '*')
export const ENABLE_HELMET = getEnvVariable('ENABLE_HELMET', parseBoolean, true)
export const ENABLE_CORS = getEnvVariable('ENABLE_CORS', parseBoolean, true)
export const ENABLE_COMPRESSION = getEnvVariable(
  'ENABLE_COMPRESSION',
  parseBoolean,
  true,
)
export const API_GATEWAY_PORT = getEnvVariable('API_GATEWAY_PORT', Number, 5500)

// Dynamic API Gateway base URL based on environment
export const API_GATEWAY_BASE_URL = getEnvVariable(
  'API_GATEWAY_BASE_URL',
  String,
  NODE_ENV === 'production'
    ? 'https://api.pika.com'
    : NODE_ENV === 'staging'
      ? 'https://staging-api.pikaom'
      : `http://localhost:${API_GATEWAY_PORT}`,
)
