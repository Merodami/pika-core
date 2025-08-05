import { subscriptionAdmin, subscriptionCommon } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, PaymentServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { AdminSubscriptionController } from '@subscription/controllers/AdminSubscriptionController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { SubscriptionRepository } from '@subscription/repositories/SubscriptionRepository.js'
import { PlanService } from '@subscription/services/PlanService.js'
import { SubscriptionService } from '@subscription/services/SubscriptionService.js'
import { Router } from 'express'

/**
 * Creates admin subscription routes
 */
export function createAdminSubscriptionRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const subscriptionRepository = new SubscriptionRepository(prisma, cache)
  const planRepository = new PlanRepository(prisma, cache)
  const communicationClient = new CommunicationServiceClient()
  const paymentClient = new PaymentServiceClient()

  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    cache,
    communicationClient,
  )

  const planService = new PlanService(planRepository, cache, paymentClient)

  const controller = new AdminSubscriptionController(
    subscriptionService,
    planService,
  )

  // ========== Subscription Management ==========

  // GET /admin/subscriptions - Get all subscriptions with admin filters
  router.get(
    '/',
    requireAuth(), // Layer 1: JWT validation
    requirePermissions('subscriptions:read:all'), // Layer 2: Admin permission check
    validateQuery(subscriptionAdmin.AdminGetSubscriptionsQuery), // Layer 3: Schema validation
    controller.getAllSubscriptions, // Layer 4: Admin business logic
  )

  // GET /admin/subscriptions/:id - Get subscription by ID
  router.get(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:read:all'),
    validateParams(subscriptionCommon.SubscriptionIdParam),
    controller.getSubscriptionById,
  )

  // POST /admin/subscriptions - Create subscription for any user
  router.post(
    '/',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateBody(subscriptionAdmin.AdminCreateSubscriptionRequest),
    controller.createSubscription,
  )

  // PUT /admin/subscriptions/:id - Update subscription
  router.put(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateParams(subscriptionCommon.SubscriptionIdParam),
    validateBody(subscriptionAdmin.AdminUpdateSubscriptionRequest),
    controller.updateSubscription,
  )

  // DELETE /admin/subscriptions/:id - Delete subscription
  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:manage:all'),
    validateParams(subscriptionCommon.SubscriptionIdParam),
    controller.deleteSubscription,
  )

  // POST /admin/subscriptions/:id/cancel - Cancel subscription
  router.post(
    '/:id/cancel',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateParams(subscriptionCommon.SubscriptionIdParam),
    validateBody(subscriptionCommon.CancelSubscriptionRequest),
    controller.cancelSubscription,
  )

  // POST /admin/subscriptions/:id/reactivate - Reactivate subscription
  router.post(
    '/:id/reactivate',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateParams(subscriptionCommon.SubscriptionIdParam),
    controller.reactivateSubscription,
  )

  return router
}

/**
 * Creates admin subscription plan routes
 */
export function createAdminPlanRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const subscriptionRepository = new SubscriptionRepository(prisma, cache)
  const planRepository = new PlanRepository(prisma, cache)
  const communicationClient = new CommunicationServiceClient()
  const paymentClient = new PaymentServiceClient()

  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    cache,
    communicationClient,
  )

  const planService = new PlanService(planRepository, cache, paymentClient)

  const controller = new AdminSubscriptionController(
    subscriptionService,
    planService,
  )

  // GET /admin/subscription-plans - Get all plans
  router.get(
    '/',
    requireAuth(),
    requirePermissions('subscriptions:read:all'),
    validateQuery(subscriptionAdmin.AdminGetPlansQuery),
    controller.getAllPlans,
  )

  // GET /admin/subscription-plans/:id - Get plan by ID
  router.get(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:read:all'),
    validateParams(subscriptionCommon.PlanIdParam),
    controller.getPlanById,
  )

  // POST /admin/subscription-plans - Create plan
  router.post(
    '/',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateBody(subscriptionAdmin.AdminCreatePlanRequest),
    controller.createPlan,
  )

  // PUT /admin/subscription-plans/:id - Update plan
  router.put(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:write:all'),
    validateParams(subscriptionCommon.PlanIdParam),
    validateBody(subscriptionAdmin.AdminUpdatePlanRequest),
    controller.updatePlan,
  )

  // DELETE /admin/subscription-plans/:id - Delete plan
  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('subscriptions:manage:all'),
    validateParams(subscriptionCommon.PlanIdParam),
    controller.deletePlan,
  )

  return router
}
