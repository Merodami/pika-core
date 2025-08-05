import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

// Booking configuration
export const MAX_BOOKING_DAYS_AHEAD = getEnvVariable(
  'MAX_BOOKING_DAYS_AHEAD',
  parseNumber,
  30,
)
export const MIN_BOOKING_HOURS_AHEAD = getEnvVariable(
  'MIN_BOOKING_HOURS_AHEAD',
  parseNumber,
  2,
)
export const SERVICE_HOUR_INCREMENT = getEnvVariable(
  'SERVICE_HOUR_INCREMENT',
  parseNumber,
  30,
)
