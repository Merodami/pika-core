import type { ITranslationService } from '../services/TranslationService.js'

export class TranslationClient {
  constructor(private readonly translationService: ITranslationService) {}

  async get(key: string, language: string, fallback?: string): Promise<string> {
    return this.translationService.get(key, language, fallback)
  }

  async getBulk(
    keys: string[],
    language: string,
  ): Promise<Record<string, string>> {
    return this.translationService.getBulk(keys, language)
  }

  async set(
    key: string,
    language: string,
    value: string,
    context?: string,
    service?: string,
  ): Promise<void> {
    return this.translationService.set(key, language, value, context, service)
  }

  async setBulk(
    translations: Array<{
      key: string
      value: string
      context?: string
      service?: string
    }>,
    language: string,
  ): Promise<void> {
    return this.translationService.setBulk(translations, language)
  }

  async getUserLanguage(userId: string): Promise<string> {
    return this.translationService.getUserLanguage(userId)
  }

  async setUserLanguage(userId: string, languageCode: string): Promise<void> {
    return this.translationService.setUserLanguage(userId, languageCode)
  }
}
