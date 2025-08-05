import { getEnvVariable } from '../getEnvVariable.js'

export const PAGINATION_DEFAULT_LIMIT = getEnvVariable(
  'PAGINATION_DEFAULT_LIMIT',
  Number,
  10,
)
export const PAGINATION_MAX_LIMIT = getEnvVariable(
  'PAGINATION_MAX_LIMIT',
  Number,
  100,
)
