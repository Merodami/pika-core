import { supportCommon, supportPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { SupportCommentController } from '@support/controllers/SupportCommentController.js'
import { SupportCommentRepository } from '@support/repositories/SupportCommentRepository.js'
import { SupportCommentService } from '@support/services/SupportCommentService.js'
import { Router } from 'express'

export function createSupportCommentRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new SupportCommentRepository(prisma, cache)

  // Initialize service
  const service = new SupportCommentService(repository, cache)

  // Initialize controller
  const controller = new SupportCommentController(service)

  // Comment routes (all require authentication)
  router.get(
    '/problem/:problemId',
    requireAuth(),
    validateParams(supportCommon.ProblemIdForCommentsParam),
    validateQuery(supportPublic.SupportCommentSearchParams),
    controller.getCommentsByProblemId,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(supportCommon.SupportCommentIdParam),
    controller.getCommentById,
  )

  router.post(
    '/',
    requireAuth(),
    validateBody(supportPublic.CreateSupportCommentRequest),
    controller.createComment,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(supportCommon.SupportCommentIdParam),
    validateBody(supportPublic.UpdateSupportCommentRequest),
    controller.updateComment,
  )

  router.delete(
    '/:id',
    requireAuth(),
    validateParams(supportCommon.SupportCommentIdParam),
    controller.deleteComment,
  )

  return router
}
