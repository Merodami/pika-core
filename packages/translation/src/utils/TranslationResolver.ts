import type { LanguageCode } from '@pika/types'
import { set, unset } from 'lodash-es'

import type { TranslationClient } from '../clients/TranslationClient.js'

/**
 * Options for configuring translation resolution behavior
 */
export interface TranslationResolverOptions {
  /**
   * Pattern to identify translation key fields (default: /Key$/)
   * Matches fields ending in "Key" like titleKey, descriptionKey
   */
  keyPattern?: RegExp

  /**
   * Fields to resolve translations for
   * If not provided, auto-detects fields ending in "Key"
   */
  fieldsToResolve?: string[]

  /**
   * Whether to preserve original key fields (default: true)
   * If false, removes the *Key fields after resolution
   */
  preserveKeys?: boolean

  /**
   * Prefix for resolved field names (default: none)
   * Example: "resolved" -> titleKey becomes resolvedTitle
   */
  resolvedFieldPrefix?: string

  /**
   * Whether to fallback to key if translation not found (default: true)
   */
  fallbackToKey?: boolean
}

/**
 * Generic Translation Resolver
 *
 * Automatically resolves translations for domain objects following convention:
 * - Fields ending in "Key" (titleKey, descriptionKey) contain translation keys
 * - Resolved content is mapped to fields without "Key" suffix (title, description)
 * - Uses efficient bulk translation calls
 * - Works with any object type
 *
 * Industry standard pattern for scalable internationalization
 */
export class TranslationResolver {
  private readonly defaultOptions: Required<TranslationResolverOptions> = {
    keyPattern: /Key$/,
    fieldsToResolve: [],
    preserveKeys: true,
    resolvedFieldPrefix: '',
    fallbackToKey: true,
  }

  constructor(private readonly translationClient: TranslationClient) {}

  /**
   * Resolves translations for a single object
   *
   * @example
   * ```typescript
   * const voucher = { titleKey: 'voucher.title.123', descriptionKey: 'voucher.desc.123' }
   * const resolved = await resolver.resolve(voucher, 'es')
   * // Result: { titleKey: 'voucher.title.123', title: 'Descuento Especial', descriptionKey: 'voucher.desc.123', description: 'Ahorra 20%' }
   * ```
   */
  async resolve<T extends Record<string, any>>(
    object: T,
    language: LanguageCode,
    options: TranslationResolverOptions = {},
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options }

    try {
      // Find translation key fields
      const keyFields = this.findTranslationKeyFields(object, opts)

      if (keyFields.length === 0) {
        return object // No translation keys found
      }

      // Extract translation keys
      const translationKeys = keyFields
        .map((field) => object[field as keyof typeof object])
        .filter((key) => typeof key === 'string' && key.length > 0)

      if (translationKeys.length === 0) {
        return object // No valid translation keys
      }

      // Bulk resolve translations
      const translations = await this.translationClient.getBulk(
        translationKeys,
        language,
      )

      // Map translations back to object
      return this.mapTranslationsToObject(object, keyFields, translations, opts)
    } catch (error) {
      console.warn('Failed to resolve translations for object', {
        error,
        objectKeys: Object.keys(object),
        language,
      })

      return object // Return original object on error
    }
  }

  /**
   * Resolves translations for an array of objects efficiently
   *
   * Uses a single bulk translation call for all objects
   *
   * @example
   * ```typescript
   * const vouchers = [
   *   { titleKey: 'voucher.title.123' },
   *   { titleKey: 'voucher.title.456' }
   * ]
   * const resolved = await resolver.resolveArray(vouchers, 'es')
   * ```
   */
  async resolveArray<T extends Record<string, any>>(
    objects: T[],
    language: LanguageCode,
    options: TranslationResolverOptions = {},
  ): Promise<T[]> {
    const opts = { ...this.defaultOptions, ...options }

    if (objects.length === 0) {
      return objects
    }

    try {
      // Collect ALL translation keys from ALL objects
      const allTranslationKeys = new Set<string>()
      const objectKeyMappings: Array<{ object: T; keyFields: string[] }> = []

      for (const object of objects) {
        const keyFields = this.findTranslationKeyFields(object, opts)

        objectKeyMappings.push({ object, keyFields })

        // Collect translation keys
        keyFields.forEach((field) => {
          const key = object[field as keyof typeof object]

          if (typeof key === 'string' && key.length > 0) {
            allTranslationKeys.add(key)
          }
        })
      }

      if (allTranslationKeys.size === 0) {
        return objects // No translation keys found
      }

      // Single bulk translation call for ALL objects
      const translations = await this.translationClient.getBulk(
        Array.from(allTranslationKeys),
        language,
      )

      // Map translations back to each object
      return objectKeyMappings.map(({ object, keyFields }) =>
        this.mapTranslationsToObject(object, keyFields, translations, opts),
      )
    } catch (error) {
      console.warn('Failed to resolve translations for object array', {
        error,
        objectCount: objects.length,
        language,
      })

      return objects // Return original objects on error
    }
  }

  /**
   * Finds fields that contain translation keys based on pattern
   */
  private findTranslationKeyFields<T extends Record<string, any>>(
    object: T,
    options: Required<TranslationResolverOptions>,
  ): string[] {
    // Use explicit fields if provided
    if (options.fieldsToResolve.length > 0) {
      return options.fieldsToResolve.filter((field) => field in object)
    }

    // Auto-detect based on pattern
    return Object.keys(object).filter((key) => options.keyPattern.test(key))
  }

  /**
   * Maps resolved translations back to the object
   */
  private mapTranslationsToObject<T extends Record<string, any>>(
    object: T,
    keyFields: string[],
    translations: Record<string, string>,
    options: Required<TranslationResolverOptions>,
  ): T {
    const result = { ...object }

    for (const keyField of keyFields) {
      const translationKey = object[keyField as keyof typeof object]

      if (typeof translationKey === 'string') {
        const resolvedContent =
          translations[translationKey as keyof typeof translations]

        if (resolvedContent || options.fallbackToKey) {
          // Determine target field name by removing the key pattern
          // titleKey -> title, descriptionKey -> description
          const baseField: string = keyField.replace(options.keyPattern, '')

          // Add prefix if specified: title -> resolvedTitle
          const prefix: string = options.resolvedFieldPrefix || ''
          const targetField: string = prefix + baseField

          // Set resolved content
          const value =
            resolvedContent || (options.fallbackToKey ? translationKey : '')

          set(result, targetField, value)
        }

        // Remove key field if not preserving
        if (!options.preserveKeys) {
          unset(result, keyField)
        }
      }
    }

    return result
  }
}

/**
 * Factory function for creating TranslationResolver instances
 */
export function createTranslationResolver(
  translationClient: TranslationClient,
): TranslationResolver {
  return new TranslationResolver(translationClient)
}
