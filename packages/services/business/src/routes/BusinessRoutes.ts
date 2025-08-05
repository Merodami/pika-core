import { BusinessController } from '@business/controllers/BusinessController.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessService } from '@business/services/BusinessService.js'
import { businessPublic, shared } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

/**
 * Creates public business routes
 */
export function createBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache)
  const controller = new BusinessController(service)

  // Public routes (require authentication but available to all users)
  // GET /businesses - List all active businesses
  router.get(
    '/',
    requireAuth(),
    validateQuery(businessPublic.BusinessQueryParams),
    controller.getAllBusinesses,
  )

  // Business owner routes (require auth and business permissions)
  // GET /businesses/me - Get current user's business (must come before /:id)
  router.get(
    '/me',
    requireAuth(),
    requirePermissions('businesses:read:own'),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getMyBusiness,
  )

  // POST /businesses/me - Create business for current user
  router.post(
    '/me',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.CreateMyBusinessRequest),
    controller.createMyBusiness,
  )

  // PUT /businesses/me - Update current user's business
  router.put(
    '/me',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.UpdateMyBusinessRequest),
    controller.updateMyBusiness,
  )

  // GET /businesses/user/:id - Get business by user ID (must come before /:id)
  router.get(
    '/user/:id',
    requireAuth(),
    validateParams(shared.UserIdParam),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessByUserId,
  )

  // GET /businesses/:id - Get business by ID (must come last to avoid conflicts)
  router.get(
    '/:id',
    requireAuth(),
    validateParams(businessPublic.BusinessPathParams),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessById,
  )

  return router
}
