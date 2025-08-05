import { subscriptionInternal } from '@pika/api'
import { requireServiceAuth, validateBody, validateParams } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { InternalSubscriptionController } from '@subscription/controllers/InternalSubscriptionController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { SubscriptionRepository } from '@subscription/repositories/SubscriptionRepository.js'
import { SubscriptionService } from '@subscription/services/SubscriptionService.js'
import { Router } from 'express'

export function createInternalSubscriptionRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Apply service auth to all internal routes
  router.use(requireServiceAuth())

  // Initialize repositories
  const subscriptionRepository = new SubscriptionRepository(prisma, cache)
  const planRepository = new PlanRepository(prisma, cache)

  // Initialize services
  const communicationClient = new CommunicationServiceClient()
  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    cache,
    communicationClient,
  )

  // Initialize controller
  const controller = new InternalSubscriptionController(
    subscriptionService,
    communicationClient,
  )

  // Webhook processing
  router.post(
    '/webhook',
    validateBody(subscriptionInternal.ProcessSubscriptionWebhookRequest),
    controller.processWebhook,
  )

  // Subscription updates from payment service
  router.put(
    '/update-from-payment',
    validateBody(subscriptionInternal.UpdateSubscriptionFromPaymentRequest),
    controller.updateFromPayment,
  )

  // Access checks
  router.post(
    '/check-access',
    validateBody(subscriptionInternal.CheckSubscriptionAccessRequest),
    controller.checkAccess,
  )

  // Get by Stripe ID
  router.get(
    '/stripe/:stripeSubscriptionId',
    validateParams(subscriptionInternal.StripeSubscriptionIdParam),
    controller.getByStripeId,
  )

  // Get user subscriptions
  router.get(
    '/users/:userId/subscriptions',
    validateParams(subscriptionInternal.SubscriptionByUserIdParam),
    controller.getUserSubscriptions,
  )

  // Send notification
  router.post(
    '/notify',
    validateBody(subscriptionInternal.SendSubscriptionNotificationRequest),
    controller.sendNotification,
  )

  return router
}
