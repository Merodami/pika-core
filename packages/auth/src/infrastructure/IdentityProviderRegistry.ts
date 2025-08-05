import { logger } from '@pika/shared'

import {
  IdentityProvider,
  IdentityProviderFactory,
  IdentityProviderOptions,
} from '../domain/interfaces/IdentityProvider.js'

/**
 * Registry for identity providers.
 *
 * This class manages the registration and retrieval of identity provider factories
 * and configured provider instances.
 */
export class IdentityProviderRegistry {
  private static instance: IdentityProviderRegistry
  private factories: Map<string, IdentityProviderFactory> = new Map()
  private providers: Map<string, IdentityProvider> = new Map()

  private constructor() {}

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): IdentityProviderRegistry {
    if (!IdentityProviderRegistry.instance) {
      IdentityProviderRegistry.instance = new IdentityProviderRegistry()
    }

    return IdentityProviderRegistry.instance
  }

  /**
   * Register an identity provider factory
   *
   * @param type The provider type (e.g., 'cognito', 'auth0')
   * @param factory The factory for creating providers of this type
   */
  registerFactory(type: string, factory: IdentityProviderFactory): void {
    if (this.factories.has(type)) {
      logger.warn(
        `Overriding existing identity provider factory for type: ${type}`,
      )
    }
    this.factories.set(type, factory)
    logger.debug(`Registered identity provider factory for type: ${type}`)
  }

  /**
   * Configure an identity provider instance
   *
   * @param options The configuration options for the provider
   * @throws Error if no factory is registered for the provider type
   */
  async configureProvider(
    options: IdentityProviderOptions,
  ): Promise<IdentityProvider> {
    if (!options.type) {
      throw new Error('Identity provider type not specified in options')
    }

    const factory = this.factories.get(options.type)

    if (!factory) {
      throw new Error(
        `No factory registered for identity provider type: ${options.type}`,
      )
    }

    try {
      const provider = await factory.createProvider(options)

      this.providers.set(options.type, provider)
      logger.info(`Configured identity provider of type: ${options.type}`)

      return provider
    } catch (error) {
      logger.error(
        `Failed to configure identity provider of type: ${options.type}`,
        error,
      )
      throw error
    }
  }

  /**
   * Get a configured identity provider instance
   *
   * @param type The provider type
   * @returns The configured provider instance
   * @throws Error if no provider is configured for the specified type
   */
  getProvider(type: string): IdentityProvider {
    const provider = this.providers.get(type)

    if (!provider) {
      throw new Error(`No configured provider found for type: ${type}`)
    }

    return provider
  }

  /**
   * Get the default identity provider.
   * Returns the first configured provider.
   *
   * @returns The default identity provider
   * @throws Error if no providers are configured
   */
  getDefaultProvider(): IdentityProvider {
    if (this.providers.size === 0) {
      throw new Error('No identity providers are configured')
    }

    // Return the first provider in the map, TypeScript null check added
    const provider = this.providers.values().next().value

    if (!provider) {
      throw new Error('Default provider is undefined')
    }

    return provider
  }

  /**
   * Check if a provider type is registered
   *
   * @param type The provider type
   * @returns True if a factory is registered for the type
   */
  hasFactory(type: string): boolean {
    return this.factories.has(type)
  }

  /**
   * Check if a provider is configured
   *
   * @param type The provider type
   * @returns True if a provider is configured for the type
   */
  hasProvider(type: string): boolean {
    return this.providers.has(type)
  }
}
