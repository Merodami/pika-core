import { getEnvVariable } from '../getEnvVariable.js'
import { API_GATEWAY_BASE_URL } from './apiGateway.js'

export const USER_API_URL = getEnvVariable(
  'USER_API_URL',
  String,
  'http://localhost:5501',
)

export const AUTH_API_URL = getEnvVariable(
  'AUTH_API_URL',
  String,
  'http://localhost:5502',
)

export const PAYMENT_API_URL = getEnvVariable(
  'PAYMENT_API_URL',
  String,
  'http://localhost:5505',
)

export const SUBSCRIPTION_API_URL = getEnvVariable(
  'SUBSCRIPTION_API_URL',
  String,
  'http://localhost:5506',
)

export const COMMUNICATION_API_URL = getEnvVariable(
  'COMMUNICATION_API_URL',
  String,
  'http://localhost:5507',
)

export const SUPPORT_API_URL = getEnvVariable(
  'SUPPORT_API_URL',
  String,
  'http://localhost:5508',
)

export const FILE_STORAGE_API_URL = getEnvVariable(
  'FILE_STORAGE_API_URL',
  String,
  'http://localhost:5510',
)

export const BUSINESS_API_URL = getEnvVariable(
  'BUSINESS_API_URL',
  String,
  'http://localhost:5511',
)

export const CATEGORY_API_URL = getEnvVariable(
  'CATEGORY_API_URL',
  String,
  'http://localhost:5512',
)

export const PDF_API_URL = getEnvVariable(
  'PDF_API_URL',
  String,
  'http://localhost:5513',
)

export const VOUCHER_API_URL = getEnvVariable(
  'VOUCHER_API_URL',
  String,
  'http://localhost:5514',
)

export const LOCAL_AUTH_URL = getEnvVariable(
  'LOCAL_AUTH_URL',
  String,
  `${API_GATEWAY_BASE_URL}/local-env-user`,
)
