import { vi } from 'vitest'

/**
 * MockTranslationClient - Direct mock for TranslationClient
 * Provides a simpler interface for testing without requiring the service layer
 * Implements the same public interface as TranslationClient for type compatibility
 */
export class MockTranslationClient {
  private mockTranslations = new Map<string, Map<string, string>>()
  private mockUserLanguages = new Map<string, string>()

  /**
   * Get translation for a key in a specific language
   */
  async get(key: string, language: string, fallback?: string): Promise<string> {
    const translations = this.mockTranslations.get(key)

    if (!translations) {
      return fallback || key
    }

    const translation = translations.get(language)

    if (translation) {
      return translation
    }

    // Try fallback language (English)
    const englishTranslation = translations.get('en')

    if (englishTranslation) {
      return englishTranslation
    }

    // Return any available translation
    const anyTranslation = translations.values().next().value

    return anyTranslation || fallback || key
  }

  /**
   * Get bulk translations for multiple keys
   */
  async getBulk(
    keys: string[],
    language: string,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {}

    for (const key of keys) {
      result[key as keyof typeof result] = await this.get(key, language)
    }

    return result
  }

  /**
   * Set translation for a key in a specific language
   */
  async set(key: string, language: string, value: string): Promise<void> {
    if (!this.mockTranslations.has(key)) {
      this.mockTranslations.set(key, new Map())
    }
    this.mockTranslations.get(key)!.set(language, value)
    // Note: context and service are ignored in the mock
  }

  /**
   * Get user's preferred language
   */
  async getUserLanguage(userId: string): Promise<string> {
    return this.mockUserLanguages.get(userId) || 'en'
  }

  /**
   * Set user's preferred language
   */
  async setUserLanguage(userId: string, languageCode: string): Promise<void> {
    this.mockUserLanguages.set(userId, languageCode)
  }

  /**
   * Clear all mock data (useful for test cleanup)
   */
  clear(): void {
    this.mockTranslations.clear()
    this.mockUserLanguages.clear()
  }

  /**
   * Set bulk translations
   */
  async setBulk(
    translations: Array<{
      key: string
      value: string
      context?: string
      service?: string
    }>,
    language: string,
  ): Promise<void> {
    for (const { key, value } of translations) {
      await this.set(key, language, value)
    }
  }

  /**
   * Seed mock translations for testing
   */
  seedTranslations(
    translations: Array<{
      key: string
      translations: Record<string, string>
    }>,
  ): void {
    for (const { key, translations: translationData } of translations) {
      const translationMap = new Map<string, string>(
        Object.entries(translationData),
      )

      this.mockTranslations.set(key, translationMap)
    }
  }
}

/**
 * Create a mock TranslationClient instance
 */
export function createMockTranslationClient(): MockTranslationClient {
  return new MockTranslationClient()
}

/**
 * Create a real TranslationClient with mocked service
 * This is useful when you need to test the actual TranslationClient interface
 */
export function createTranslationClientWithMock(): any {
  const mockService = {
    get: vi.fn(),
    getBulk: vi.fn(),
    set: vi.fn(),
    getUserLanguage: vi.fn(),
    setUserLanguage: vi.fn(),
  }

  const mockClient = new MockTranslationClient()

  // Wire up the mock service to use the MockTranslationClient
  mockService.get.mockImplementation(mockClient.get.bind(mockClient))
  mockService.getBulk.mockImplementation(mockClient.getBulk.bind(mockClient))
  mockService.set.mockImplementation(mockClient.set.bind(mockClient))
  mockService.getUserLanguage.mockImplementation(
    mockClient.getUserLanguage.bind(mockClient),
  )
  mockService.setUserLanguage.mockImplementation(
    mockClient.setUserLanguage.bind(mockClient),
  )

  // Return mock client directly for now
  return mockClient
}

/**
 * Clear all mock translation data
 */
export function clearMockTranslations(): void {
  // This function is already exported from translationServiceMock.ts
  // We'll keep it here for consistency with the MockTranslationClient
}
