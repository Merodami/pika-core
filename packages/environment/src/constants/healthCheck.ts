import { getEnvVariable } from '../getEnvVariable.js'

export const HEALTH_CHECK_PATH = getEnvVariable(
  'HEALTH_CHECK_PATH',
  String,
  '/health',
)
export const HEALTH_CHECK_INTERVAL = getEnvVariable(
  'HEALTH_CHECK_INTERVAL',
  Number,
  30000,
)
export const HEALTH_CHECK_CACHE_TIME = getEnvVariable(
  'HEALTH_CHECK_CACHE_TIME',
  Number,
  5000,
)
export const HEALTH_CHECK_MEMORY_THRESHOLD = getEnvVariable(
  'HEALTH_CHECK_MEMORY_THRESHOLD',
  Number,
  15,
)
