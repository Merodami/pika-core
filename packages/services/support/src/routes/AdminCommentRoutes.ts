import { supportAdmin, supportCommon, supportPublic } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { AdminCommentController } from '@support/controllers/AdminCommentController.js'
import { SupportCommentRepository } from '@support/repositories/SupportCommentRepository.js'
import { AdminSupportCommentService } from '@support/services/AdminSupportCommentService.js'
import { Router } from 'express'

export function createAdminCommentRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new SupportCommentRepository(prisma, cache)
  const service = new AdminSupportCommentService(repository, cache)
  const controller = new AdminCommentController(service)

  // Admin comment management routes
  router.get(
    '/',
    requireAuth(),
    requirePermissions('admin:support'),
    controller.getAllComments,
  )

  router.get(
    '/problem/:problemId',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.ProblemIdForCommentsParam),
    validateQuery(supportAdmin.AdminCommentsByProblemQuery),
    controller.getCommentsByProblemId,
  )

  router.post(
    '/',
    requireAuth(),
    requirePermissions('admin:support'),
    validateBody(supportPublic.CreateSupportCommentRequest),
    controller.createInternalComment,
  )

  router.put(
    '/:id',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.SupportCommentIdParam),
    validateBody(supportPublic.UpdateSupportCommentRequest),
    controller.updateAnyComment,
  )

  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.SupportCommentIdParam),
    controller.deleteAnyComment,
  )

  return router
}
