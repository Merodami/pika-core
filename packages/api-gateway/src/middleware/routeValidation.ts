// Import Zod schemas from the api package
import * as publicSchemas from '@pika/api/public'
import { validateBody } from '@pika/http'
import { logger } from '@pika/shared'
import { Router } from 'express'

/**
 * Apply validation middlewares to API routes using Zod schemas
 * This provides early validation at the gateway level before forwarding to services
 */
export function applyRouteValidation(router: Router): void {
  // ============= Auth Routes =============

  // OAuth 2.0 Token endpoint
  router.post(
    '/api/v1/auth/token',
    validateBody(publicSchemas.TokenRequest),
    (req, res, next) => next(),
  )

  // POST /api/v1/auth/register (kept for user registration)
  router.post(
    '/api/v1/auth/register',
    validateBody(publicSchemas.RegisterRequest),
    (req, res, next) => next(),
  )

  logger.info('API Gateway route validation enabled with Zod schemas')
}

/**
 * Create a validation router that can be mounted before the proxy middleware
 * This allows us to validate requests at the gateway level
 *
 * NOTE: Currently returns an empty router as validation is disabled at gateway level
 */
export function createValidationRouter(): Router {
  const router = Router()

  applyRouteValidation(router)

  return router
}
