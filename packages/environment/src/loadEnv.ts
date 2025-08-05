import dotenv from 'dotenv'
import { findUpSync } from 'find-up'

/**
 * Load .env files with override support
 */
export const getLocalEnv = (): void => {
  // For test environment, load .env.test
  if (process.env.NODE_ENV === 'test') {
    const testEnvPath = findUpSync('.env.test')

    if (testEnvPath) {
      dotenv.config({ path: testEnvPath })

      return
    }
  }

  // Load base .env file first
  const baseEnvPath = findUpSync('.env')

  if (baseEnvPath) {
    dotenv.config({ path: baseEnvPath })
  }

  // Then load .env.local to override specific values
  const localEnvPath = findUpSync('.env.local')

  if (localEnvPath) {
    dotenv.config({ path: localEnvPath, override: true })
  }
}

getLocalEnv()
