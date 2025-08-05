import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber, parseString } from '../parsers.js'

// Stripe configuration
export const STRIPE_SECRET_KEY = getEnvVariable(
  'STRIPE_SECRET_KEY',
  parseString,
  'sk_test_dummy_key_for_local_development',
)

export const STRIPE_WEBHOOK_SECRET = getEnvVariable(
  'STRIPE_WEBHOOK_SECRET',
  parseString,
  'whsec_test_dummy_webhook_secret_for_local_development',
)

export const STRIPE_MOCK_HOST = getEnvVariable(
  'STRIPE_MOCK_HOST',
  parseString,
  '127.0.0.1',
)

export const STRIPE_MOCK_PORT = getEnvVariable(
  'STRIPE_MOCK_PORT',
  parseNumber,
  12111,
)
