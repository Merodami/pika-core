import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

// Service configuration
export const SERVICE_HOST = getEnvVariable('SERVICE_HOST', String, '0.0.0.0')

// User service name
export const USER_SERVICE_NAME = getEnvVariable(
  'USER_SERVICE_NAME',
  String,
  'user_service',
)

// User service port
export const USER_SERVICE_PORT = getEnvVariable(
  'USER_SERVICE_PORT',
  parseNumber,
  5501,
)

// User service host
export const USER_SERVICE_HOST = getEnvVariable(
  'USER_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Auth service name
export const AUTH_SERVICE_NAME = getEnvVariable(
  'AUTH_SERVICE_NAME',
  String,
  'auth_service',
)

// Auth service port
export const AUTH_SERVICE_PORT = getEnvVariable(
  'AUTH_SERVICE_PORT',
  parseNumber,
  5502,
)

// Auth service host
export const AUTH_SERVICE_HOST = getEnvVariable(
  'AUTH_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Payment service name
export const PAYMENT_SERVICE_NAME = getEnvVariable(
  'PAYMENT_SERVICE_NAME',
  String,
  'payment_service',
)

// Payment service port
export const PAYMENT_SERVICE_PORT = getEnvVariable(
  'PAYMENT_SERVICE_PORT',
  parseNumber,
  5505,
)

// Payment service host
export const PAYMENT_SERVICE_HOST = getEnvVariable(
  'PAYMENT_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Subscription service name
export const SUBSCRIPTION_SERVICE_NAME = getEnvVariable(
  'SUBSCRIPTION_SERVICE_NAME',
  String,
  'subscription_service',
)

// Subscription service port
export const SUBSCRIPTION_SERVICE_PORT = getEnvVariable(
  'SUBSCRIPTION_SERVICE_PORT',
  parseNumber,
  5506,
)

// Subscription service host
export const SUBSCRIPTION_SERVICE_HOST = getEnvVariable(
  'SUBSCRIPTION_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Communication service name
export const COMMUNICATION_SERVICE_NAME = getEnvVariable(
  'COMMUNICATION_SERVICE_NAME',
  String,
  'communication_service',
)

// Communication service port
export const COMMUNICATION_SERVICE_PORT = getEnvVariable(
  'COMMUNICATION_SERVICE_PORT',
  parseNumber,
  5507,
)

// Communication service host
export const COMMUNICATION_SERVICE_HOST = getEnvVariable(
  'COMMUNICATION_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Support service name
export const SUPPORT_SERVICE_NAME = getEnvVariable(
  'SUPPORT_SERVICE_NAME',
  String,
  'support_service',
)

// Support service port
export const SUPPORT_SERVICE_PORT = getEnvVariable(
  'SUPPORT_SERVICE_PORT',
  parseNumber,
  5508,
)

// Support service host
export const SUPPORT_SERVICE_HOST = getEnvVariable(
  'SUPPORT_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// File Storage service name
export const FILE_STORAGE_SERVICE_NAME = getEnvVariable(
  'FILE_STORAGE_SERVICE_NAME',
  String,
  'file_storage_service',
)

// File Storage service port
export const FILE_STORAGE_SERVICE_PORT = getEnvVariable(
  'FILE_STORAGE_SERVICE_PORT',
  parseNumber,
  5510,
)

// File Storage service host
export const FILE_STORAGE_SERVICE_HOST = getEnvVariable(
  'FILE_STORAGE_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Business service name
export const BUSINESS_SERVICE_NAME = getEnvVariable(
  'BUSINESS_SERVICE_NAME',
  String,
  'business_service',
)

// Business service port
export const BUSINESS_SERVICE_PORT = getEnvVariable(
  'BUSINESS_SERVICE_PORT',
  parseNumber,
  5511,
)

// Business service host
export const BUSINESS_SERVICE_HOST = getEnvVariable(
  'BUSINESS_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Category service name
export const CATEGORY_SERVICE_NAME = getEnvVariable(
  'CATEGORY_SERVICE_NAME',
  String,
  'category_service',
)

// Category service port
export const CATEGORY_SERVICE_PORT = getEnvVariable(
  'CATEGORY_SERVICE_PORT',
  parseNumber,
  5512,
)

// Category service host
export const CATEGORY_SERVICE_HOST = getEnvVariable(
  'CATEGORY_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// PDF service name
export const PDF_SERVICE_NAME = getEnvVariable(
  'PDF_SERVICE_NAME',
  String,
  'pdf_service',
)

// PDF service port
export const PDF_SERVICE_PORT = getEnvVariable(
  'PDF_SERVICE_PORT',
  parseNumber,
  5513,
)

// PDF service host
export const PDF_SERVICE_HOST = getEnvVariable(
  'PDF_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Voucher service name
export const VOUCHER_SERVICE_NAME = getEnvVariable(
  'VOUCHER_SERVICE_NAME',
  String,
  'voucher_service',
)

// Voucher service port
export const VOUCHER_SERVICE_PORT = getEnvVariable(
  'VOUCHER_SERVICE_PORT',
  parseNumber,
  5514,
)

// Voucher service host
export const VOUCHER_SERVICE_HOST = getEnvVariable(
  'VOUCHER_SERVICE_HOST',
  String,
  '0.0.0.0',
)

// Translation service configuration
export const DEFAULT_LANGUAGE = getEnvVariable('DEFAULT_LANGUAGE', String, 'es')

export const SUPPORTED_LANGUAGES = ['es', 'en', 'gn'] as const

// Voucher service configuration
export const VOUCHER_CODE_ALPHABET = getEnvVariable(
  'VOUCHER_CODE_ALPHABET',
  String,
  'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // No ambiguous chars
)

export const VOUCHER_SHORT_CODE_LENGTH = getEnvVariable(
  'VOUCHER_SHORT_CODE_LENGTH',
  parseNumber,
  8,
)

export const VOUCHER_JWT_ALGORITHM = getEnvVariable(
  'VOUCHER_JWT_ALGORITHM',
  String,
  'RS256',
)

export const VOUCHER_JWT_PRIVATE_KEY = getEnvVariable(
  'VOUCHER_JWT_PRIVATE_KEY',
  String,
  '',
)
