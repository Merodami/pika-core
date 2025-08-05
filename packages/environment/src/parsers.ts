/**
 * Common parsers for environment variables
 */

/**
 * Parse a boolean string value
 * - "true" (case insensitive) -> true
 * - Everything else -> false
 */
export const parseBoolean = (value: string): boolean => {
  return value.toLowerCase() === 'true'
}

/**
 * Parse a number string value with validation
 */
export const parseNumber = (value: string): number => {
  const num = Number(value)

  if (isNaN(num)) {
    throw new Error(`Invalid number value: ${value}`)
  }

  return num
}

/**
 * Parse a string value (identity function for consistency)
 */
export const parseString = (value: string): string => {
  return value
}

/**
 * Parse a comma-separated list into an array
 */
export const parseList = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Parse a JSON string
 */
export const parseJson = <T = any>(value: string): T => {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Invalid JSON value: ${value}`)
  }
}
