import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

export const APP_NAME = getEnvVariable('APP_NAME', String, 'Pika Gym Platform')
export const BASE_URL = getEnvVariable(
  'BASE_URL',
  String,
  'http://localhost:4000',
)
export const FRONTEND_URL = getEnvVariable(
  'FRONTEND_URL',
  String,
  'http://localhost:3000',
)
export const API_PREFIX = getEnvVariable('API_PREFIX', parseString, '/api/v1')
