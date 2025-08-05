import { logger } from '@pika/shared'

import { initializeIdentityProviders } from '../config/identityProviderConfig.js'
import { IdentityProviderRegistry } from '../infrastructure/IdentityProviderRegistry.js'

let isInitialized = false

/**
 * Get a JWT verifier that delegates to the configured identity provider.
 * This is a thin adapter layer to maintain compatibility with existing code
 * while using the new identity provider abstraction.
 */
export async function getJwtVerifier() {
  // Initialize identity providers if not already done
  if (!isInitialized) {
    try {
      await initializeIdentityProviders()
      isInitialized = true
    } catch (error) {
      logger.error('Failed to initialize identity providers:', error)

      return null
    }
  }

  // Get the registry and default provider
  const registry = IdentityProviderRegistry.getInstance()

  try {
    // Get the default provider (currently Cognito)
    const provider = registry.getDefaultProvider()

    // Return a verifier interface that's compatible with the existing code
    return {
      verify: async (token: string) => {
        return provider.verifyToken(token)
      },
    }
  } catch (error) {
    logger.error('Failed to get identity provider:', error)

    return null
  }
}
