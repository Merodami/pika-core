import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseNumber } from '../parsers.js'

// Metrics configuration
export const ENABLE_METRICS = getEnvVariable(
  'ENABLE_METRICS',
  parseBoolean,
  false,
)
export const METRICS_PORT = getEnvVariable('METRICS_PORT', parseNumber, 10090)

// Debug mode
export const DEBUG = getEnvVariable('DEBUG', parseBoolean, false)
