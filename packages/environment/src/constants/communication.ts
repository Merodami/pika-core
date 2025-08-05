import { getEnvVariable } from '../getEnvVariable.js'
import { parseBoolean, parseString } from '../parsers.js'

// Email Providers
export const EMAIL_PROVIDER_PRIMARY = getEnvVariable(
  'EMAIL_PROVIDER_PRIMARY',
  parseString,
  'console', // console | aws-ses | resend
)
export const EMAIL_PROVIDER_FALLBACK = getEnvVariable(
  'EMAIL_PROVIDER_FALLBACK',
  parseString,
  'console',
)

// Resend Configuration
export const RESEND_API_KEY = getEnvVariable('RESEND_API_KEY', parseString, '')

// SMS Configuration
export const SMS_PROVIDER_PRIMARY = getEnvVariable(
  'SMS_PROVIDER_PRIMARY',
  parseString,
  'console', // console | aws-sns | twilio
)
export const SMS_SENDER_ID = getEnvVariable(
  'SMS_SENDER_ID',
  parseString,
  'Pika',
)
export const SMS_TYPE = getEnvVariable(
  'SMS_TYPE',
  parseString,
  'Transactional', // Transactional | Promotional
)

// Push Notification Configuration (Future)
export const PUSH_PROVIDER = getEnvVariable(
  'PUSH_PROVIDER',
  parseString,
  'console', // console | aws-sns | firebase
)

// LocalStack Configuration for Testing
export const USE_LOCALSTACK = getEnvVariable(
  'USE_LOCALSTACK',
  parseBoolean,
  false,
)
export const LOCALSTACK_ENDPOINT = getEnvVariable(
  'LOCALSTACK_ENDPOINT',
  parseString,
  'http://localhost:4566',
)

// Queue Configuration
export const EMAIL_QUEUE_ENABLED = getEnvVariable(
  'EMAIL_QUEUE_ENABLED',
  parseBoolean,
  false,
)
export const EMAIL_QUEUE_CONCURRENCY = getEnvVariable(
  'EMAIL_QUEUE_CONCURRENCY',
  Number,
  5,
)
export const EMAIL_RETRY_ATTEMPTS = getEnvVariable(
  'EMAIL_RETRY_ATTEMPTS',
  Number,
  3,
)
export const EMAIL_RETRY_DELAY = getEnvVariable(
  'EMAIL_RETRY_DELAY',
  Number,
  5000, // 5 seconds
)

// Rate Limiting
export const EMAIL_RATE_LIMIT_MAX = getEnvVariable(
  'EMAIL_RATE_LIMIT_MAX',
  Number,
  100, // max emails per window
)
export const EMAIL_RATE_LIMIT_WINDOW = getEnvVariable(
  'EMAIL_RATE_LIMIT_WINDOW',
  Number,
  3600000, // 1 hour in milliseconds
)
export const SMS_RATE_LIMIT_MAX = getEnvVariable(
  'SMS_RATE_LIMIT_MAX',
  Number,
  50, // max SMS per window
)
export const SMS_RATE_LIMIT_WINDOW = getEnvVariable(
  'SMS_RATE_LIMIT_WINDOW',
  Number,
  3600000, // 1 hour in milliseconds
)

// Deployment Environment Detection
export const IS_VERCEL = getEnvVariable('VERCEL', parseString, '') === '1'
export const IS_CI = getEnvVariable('CI', parseString, '') === 'true'
export const IS_GITHUB_ACTIONS =
  getEnvVariable('GITHUB_ACTIONS', parseString, '') === 'true'

// MailHog Configuration for Development
export const MAILHOG_SMTP_HOST = getEnvVariable(
  'MAILHOG_SMTP_HOST',
  parseString,
  'localhost',
)
export const MAILHOG_SMTP_PORT = getEnvVariable(
  'MAILHOG_SMTP_PORT',
  Number,
  1025,
)
export const MAILHOG_UI_PORT = getEnvVariable('MAILHOG_UI_PORT', Number, 8025)

// Template Configuration
export const TEMPLATE_CACHE_TTL = getEnvVariable(
  'TEMPLATE_CACHE_TTL',
  Number,
  3600, // 1 hour
)
export const NOTIFICATION_CACHE_TTL = getEnvVariable(
  'NOTIFICATION_CACHE_TTL',
  Number,
  60, // 1 minute
)
