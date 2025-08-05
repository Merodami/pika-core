import { NotificationController } from '@communication/controllers/NotificationController.js'
import { CommunicationLogRepository } from '@communication/repositories/CommunicationLogRepository.js'
import { NotificationRepository } from '@communication/repositories/NotificationRepository.js'
import type { EmailConfig } from '@communication/services/EmailService.js'
import { EmailService } from '@communication/services/EmailService.js'
import { NotificationService } from '@communication/services/NotificationService.js'
import { communicationCommon, communicationPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

export function createNotificationRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  emailConfig: EmailConfig,
): Router {
  const router = Router()

  // Initialize repositories
  const notificationRepository = new NotificationRepository(prisma, cache)
  const communicationLogRepository = new CommunicationLogRepository(
    prisma,
    cache,
  )
  // Initialize services
  const emailService = new EmailService(
    communicationLogRepository,
    cache,
    emailConfig,
  )
  const notificationService = new NotificationService(
    notificationRepository,
    emailService,
    cache,
  )

  // Initialize controller
  const controller = new NotificationController(notificationService)

  // Notification routes
  router.post(
    '/',
    requireAuth(),
    validateBody(communicationPublic.CreateNotificationRequest),
    controller.createNotification,
  )

  router.get(
    '/',
    requireAuth(),
    validateQuery(communicationPublic.NotificationSearchParams),
    controller.getNotifications,
  )

  // Place specific routes before parameterized routes
  router.put('/read-all', requireAuth(), controller.markAllAsRead)

  router.get(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.getNotificationById,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    validateBody(communicationPublic.UpdateNotificationStatusRequest),
    controller.updateNotification,
  )

  router.put(
    '/:id/read',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.markAsRead,
  )

  router.delete(
    '/:id',
    requireAuth(),
    validateParams(communicationCommon.NotificationIdParam),
    controller.deleteNotification,
  )

  // ADMIN ENDPOINTS EXCLUDED - Global notification functionality moved to internal routes
  // router.post(
  //   '/global',
  //   requireAdmin(),
  //   validateBody(communicationPublic.CreateNotificationRequest),
  //   controller.createGlobalNotification,
  // )

  return router
}
