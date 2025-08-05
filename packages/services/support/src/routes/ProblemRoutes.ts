import { supportPublic } from '@pika/api'
import { requireAuth, validateBody, validateQuery } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { ProblemController } from '@support/controllers/ProblemController.js'
import { ProblemRepository } from '@support/repositories/ProblemRepository.js'
import { ProblemService } from '@support/services/ProblemService.js'
import { Router } from 'express'

export function createProblemRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new ProblemRepository(prisma, cache)

  // Initialize service
  const service = new ProblemService(repository, cache)

  // Initialize controller
  const controller = new ProblemController(service)

  // Public user routes only
  router.post(
    '/',
    requireAuth(),
    validateBody(supportPublic.CreateSupportProblemRequest),
    controller.createProblem,
  )

  router.get(
    '/',
    requireAuth(),
    validateQuery(supportPublic.SupportProblemSearchParams),
    controller.getUserProblems,
  )

  return router
}
