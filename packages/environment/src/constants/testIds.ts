import { getEnvVariable } from '../getEnvVariable.js'

export const TEST_BUSINESS_ID = getEnvVariable(
  'TEST_BUSINESS_ID',
  String,
  '20b1abc9-4b63-46d1-b390-34f4dcbcb145',
)

export const TEST_USER_ID = getEnvVariable(
  'TEST_USER_ID',
  String,
  '94a4148d-33a5-478f-b376-1dd5cf6fb1fc',
)
