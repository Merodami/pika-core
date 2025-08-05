import type { NextFunction, Request, Response } from 'express'

import type { ITranslationService } from '../services/TranslationService.js'

export class TranslationController {
  constructor(private readonly translationService: ITranslationService) {
    this.getTranslations = this.getTranslations.bind(this)
    this.setTranslation = this.setTranslation.bind(this)
    this.getLanguages = this.getLanguages.bind(this)
    this.setUserLanguage = this.setUserLanguage.bind(this)
  }

  async getTranslations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { keys, language } = req.body

      if (!keys || !Array.isArray(keys)) {
        res.status(400).json({ error: 'Keys must be an array' })

        return
      }

      if (!language || typeof language !== 'string') {
        res.status(400).json({ error: 'Language is required' })

        return
      }

      const translations = await this.translationService.getBulk(keys, language)

      res.json({ translations })
    } catch (error) {
      next(error)
    }
  }

  async setTranslation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { key, language, value, context, service } = req.body

      if (!key || !language || !value) {
        res.status(400).json({ error: 'Key, language, and value are required' })

        return
      }

      await this.translationService.set(key, language, value, context, service)

      res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  async getLanguages(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // This would need to be implemented in the service
      // For now, return the supported languages
      res.json({
        languages: [
          { code: 'es', name: 'Español', isDefault: true },
          { code: 'en', name: 'English', isDefault: false },
          { code: 'gn', name: 'Guaraní', isDefault: false },
        ],
      })
    } catch (error) {
      next(error)
    }
  }

  async setUserLanguage(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, language } = req.body

      if (!userId || !language) {
        res.status(400).json({ error: 'UserId and language are required' })

        return
      }

      await this.translationService.setUserLanguage(userId, language)

      res.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}
