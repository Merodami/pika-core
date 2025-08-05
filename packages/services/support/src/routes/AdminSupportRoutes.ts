import { supportAdmin, supportCommon } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { AdminSupportController } from '@support/controllers/AdminSupportController.js'
import { ProblemRepository } from '@support/repositories/ProblemRepository.js'
import { ProblemService } from '@support/services/ProblemService.js'
import { Router } from 'express'

export function createAdminSupportRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new ProblemRepository(prisma, cache)
  const service = new ProblemService(repository, cache)
  const controller = new AdminSupportController(service)

  // Admin ticket management routes
  router.get(
    '/tickets',
    requireAuth(),
    requirePermissions('admin:support'),
    validateQuery(supportAdmin.AdminTicketQueryParams),
    controller.getAllTickets,
  )

  router.get(
    '/tickets/:id',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    controller.getTicketById,
  )

  router.put(
    '/tickets/:id/status',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    validateBody(supportAdmin.UpdateTicketStatusRequest),
    controller.updateTicketStatus,
  )

  router.post(
    '/tickets/:id/assign',
    requireAuth(),
    requirePermissions('admin:support'),
    validateParams(supportCommon.TicketIdParam),
    validateBody(supportAdmin.AssignTicketRequest),
    controller.assignTicket,
  )

  return router
}
