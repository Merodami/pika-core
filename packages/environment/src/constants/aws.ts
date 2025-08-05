import { getEnvVariable } from '../getEnvVariable.js'
import { parseString } from '../parsers.js'

export const AWS_REGION = getEnvVariable('AWS_REGION', parseString, 'us-east-1')
export const AWS_ACCESS_KEY_ID = getEnvVariable(
  'AWS_ACCESS_KEY_ID',
  String,
  'test',
)
export const AWS_SECRET_ACCESS_KEY = getEnvVariable(
  'AWS_SECRET_ACCESS_KEY',
  String,
  'test',
)
export const AWS_ENDPOINT_URL = getEnvVariable(
  'AWS_ENDPOINT_URL',
  String,
  'http://localhost:9000', // MinIO default (was LocalStack 5567)
)
export const AWS_S3_BUCKET = getEnvVariable(
  'AWS_S3_BUCKET',
  String,
  'pika-uploads',
)

// S3-specific configuration (for MinIO compatibility)
export const AWS_S3_ENDPOINT = getEnvVariable(
  'AWS_S3_ENDPOINT',
  String,
  'http://localhost:9000', // MinIO default
)
export const AWS_S3_REGION = getEnvVariable(
  'AWS_S3_REGION',
  parseString,
  'us-east-1',
)
export const AWS_S3_ACCESS_KEY_ID = getEnvVariable(
  'AWS_S3_ACCESS_KEY_ID',
  String,
  'minioadmin', // MinIO default
)
export const AWS_S3_SECRET_ACCESS_KEY = getEnvVariable(
  'AWS_S3_SECRET_ACCESS_KEY',
  String,
  'minioadmin', // MinIO default
)

export const MAX_UPLOAD_SIZE = getEnvVariable(
  'MAX_UPLOAD_SIZE',
  Number,
  5 * 1024 * 1024,
) // 5MB

// Storage Provider Configuration
export const STORAGE_PROVIDER_PRIMARY = getEnvVariable(
  'STORAGE_PROVIDER_PRIMARY',
  parseString,
  'aws-s3', // Default to AWS S3 (with MinIO for development)
)
export const STORAGE_PROVIDER_FALLBACK = getEnvVariable(
  'STORAGE_PROVIDER_FALLBACK',
  parseString,
  'console',
)
// AWS Cognito
export const COGNITO_USER_POOL_ID = getEnvVariable(
  'COGNITO_USER_POOL_ID',
  parseString,
  '',
)
export const COGNITO_CLIENT_ID = getEnvVariable(
  'COGNITO_CLIENT_ID',
  parseString,
  '',
)
