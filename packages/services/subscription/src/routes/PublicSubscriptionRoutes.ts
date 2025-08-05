import { subscriptionPublic } from '@pika/api'
import { requireAuth, requirePermissions, validateBody } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { PublicSubscriptionController } from '@subscription/controllers/PublicSubscriptionController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { SubscriptionRepository } from '@subscription/repositories/SubscriptionRepository.js'
import { SubscriptionService } from '@subscription/services/SubscriptionService.js'
import { Router } from 'express'

/**
 * Creates public subscription routes
 */
export function createPublicSubscriptionRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const subscriptionRepository = new SubscriptionRepository(prisma, cache)
  const planRepository = new PlanRepository(prisma, cache)
  const communicationClient = new CommunicationServiceClient()

  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    cache,
    communicationClient,
  )

  const controller = new PublicSubscriptionController(subscriptionService)

  // All public subscription routes require authentication
  router.use(requireAuth())

  // GET /subscriptions/me - Get current user's active subscription
  router.get(
    '/me',
    requirePermissions('subscriptions:read:own'),
    controller.getUserSubscription,
  )

  // POST /subscriptions - Create subscription for current user
  router.post(
    '/',
    requirePermissions('subscriptions:write:own'),
    validateBody(subscriptionPublic.CreateSubscriptionRequest),
    controller.createSubscription,
  )

  // POST /subscriptions/me/cancel - Cancel current user's subscription
  router.post(
    '/me/cancel',
    requirePermissions('subscriptions:write:own'),
    validateBody(subscriptionPublic.CancelSubscriptionRequest),
    controller.cancelSubscription,
  )

  // POST /subscriptions/me/reactivate - Reactivate current user's cancelled subscription
  router.post(
    '/me/reactivate',
    requirePermissions('subscriptions:write:own'),
    controller.reactivateSubscription,
  )

  return router
}
