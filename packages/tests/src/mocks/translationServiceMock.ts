import { vi } from 'vitest'

/**
 * Reusable mock for TranslationServiceClient
 * Stores translations in memory for testing
 */

// Global translation store for tests
const mockTranslations = new Map<string, Map<string, string>>()

// Default language for tests
const DEFAULT_TEST_LANGUAGE = 'es'

/**
 * Mock TranslationServiceClient implementation
 */
export class MockTranslationServiceClient {
  /**
   * Create a translation
   */
  async createTranslation({
    key,
    value,
    language = DEFAULT_TEST_LANGUAGE,
  }: {
    key: string
    value: string
    language?: string
  }) {
    if (!mockTranslations.has(key)) {
      mockTranslations.set(key, new Map())
    }
    mockTranslations.get(key)!.set(language, value)

    return {
      key,
      value,
      language,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Update a translation
   */
  async updateTranslation({
    key,
    value,
    language = DEFAULT_TEST_LANGUAGE,
  }: {
    key: string
    value: string
    language?: string
  }) {
    if (!mockTranslations.has(key)) {
      mockTranslations.set(key, new Map())
    }
    mockTranslations.get(key)!.set(language, value)

    return {
      key,
      value,
      language,
      updatedAt: new Date(),
    }
  }

  /**
   * Get a translation
   */
  async translate(
    key: string,
    language: string = DEFAULT_TEST_LANGUAGE,
  ): Promise<string> {
    const translations = mockTranslations.get(key)

    if (!translations) {
      return key // Return key if no translation found
    }

    // Try requested language first
    const translation = translations.get(language)

    if (translation) {
      return translation
    }

    // Fallback to default language
    const defaultTranslation = translations.get(DEFAULT_TEST_LANGUAGE)

    if (defaultTranslation) {
      return defaultTranslation
    }

    // Fallback to any available language
    const anyTranslation = translations.values().next().value

    if (anyTranslation) {
      return anyTranslation
    }

    return key // Return key if no translation found
  }

  /**
   * Get all translations for a key
   */
  async getTranslations(key: string): Promise<Record<string, string>> {
    const translations = mockTranslations.get(key)

    if (!translations) {
      return {}
    }

    return Object.fromEntries(translations)
  }

  /**
   * Delete a translation
   */
  async deleteTranslation(key: string, language?: string): Promise<void> {
    if (!language) {
      mockTranslations.delete(key)
    } else {
      const translations = mockTranslations.get(key)

      if (translations) {
        translations.delete(language)
        if (translations.size === 0) {
          mockTranslations.delete(key)
        }
      }
    }
  }

  /**
   * Bulk create translations
   */
  async bulkCreateTranslations(
    translations: Array<{
      key: string
      value: string
      language?: string
    }>,
  ): Promise<void> {
    for (const translation of translations) {
      await this.createTranslation(translation)
    }
  }
}

/**
 * Clear all mock translations (useful for test cleanup)
 */
export function clearMockTranslations(): void {
  mockTranslations.clear()
}

/**
 * Get all mock translations (useful for debugging tests)
 */
export function getAllMockTranslations(): Map<string, Map<string, string>> {
  return new Map(mockTranslations)
}

/**
 * Seed mock translations for testing
 */
export function seedMockTranslations(
  translations: Array<{
    key: string
    translations: Record<string, string>
  }>,
): void {
  for (const { key, translations: translationData } of translations) {
    const translationMap = new Map<string, string>(
      Object.entries(translationData),
    )

    mockTranslations.set(key, translationMap)
  }
}

/**
 * Helper to set up the translation service mock in tests
 * Usage:
 * ```
 * import { setupTranslationServiceMock } from '@pika/tests'
 *
 * // At the top of your test file
 * setupTranslationServiceMock()
 * ```
 */
export function setupTranslationServiceMock() {
  vi.mock('@pika/shared', async () => {
    const actual =
      await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

    return {
      ...actual,
      TranslationServiceClient: MockTranslationServiceClient,
    }
  })
}

/**
 * Create a properly typed mock instance for dependency injection
 */
export function createMockTranslationServiceClient(): MockTranslationServiceClient {
  return new MockTranslationServiceClient()
}
