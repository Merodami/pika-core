import { get } from 'lodash-es'

/**
 * Retrieve and cast an env var, with optional fallback
 */
export const getEnvVariable = <T>(
  name: string,
  cast: (raw: string) => T,
  fallback?: T,
): T => {
  const value = get(process.env, name)

  if (value == null) {
    if (fallback != null) {
      // Note: Using console.warn to avoid circular dependency with logger
      console.warn(`No "${name}" environment variable found. Using fallback.`)

      return fallback
    }
    // Note: Using console.warn to avoid circular dependency with logger
    console.warn(`Missing environment variable "${name}".`)

    return null as any
  }

  return cast(value)
}
