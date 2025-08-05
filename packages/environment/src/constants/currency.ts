import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

/**
 * Default currency for the platform
 * TODO: Make this configurable per gym in the future
 */
export const DEFAULT_CURRENCY = getEnvVariable(
  'DEFAULT_CURRENCY',
  parseString,
  'GBP',
)

/**
 * Currency codes supported by the platform
 */
export const SUPPORTED_CURRENCIES = ['GBP', 'USD', 'EUR'] as const

export type Currency = (typeof SUPPORTED_CURRENCIES)[number]

/**
 * Currency symbols for display
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
}
