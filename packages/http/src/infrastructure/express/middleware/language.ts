import type { ITranslationService } from '@pika/translation'
import type { NextFunction, Request, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      language: string
    }
    interface Locals {
      t: (key: string, fallback?: string) => Promise<string>
    }
  }
}

export function createLanguageMiddleware(
  translationService: ITranslationService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Detect and set language
      const language = await translationService.detectLanguage(req)

      // Add to request object
      req.language = language

      // Add translation helper to response locals
      res.locals.t = (key: string, fallback?: string) =>
        translationService.get(key, language, fallback)

      // Set Content-Language header
      res.setHeader('Content-Language', language)

      next()
    } catch {
      // If language detection fails, use default and continue
      req.language = 'en'
      res.locals.t = (key: string, fallback?: string) =>
        translationService.get(key, 'en', fallback)
      res.setHeader('Content-Language', 'en')
      next()
    }
  }
}
