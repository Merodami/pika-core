import type { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'

import { TranslationRepository } from '../repositories/TranslationRepository.js'
import { TranslationCache } from '../services/TranslationCache.js'
import { TranslationService } from '../services/TranslationService.js'

export function createTranslationService(
  prisma: PrismaClient,
  redis: Redis,
): TranslationService {
  const repository = new TranslationRepository(prisma)
  const cache = new TranslationCache(redis)

  return new TranslationService(repository, cache)
}
