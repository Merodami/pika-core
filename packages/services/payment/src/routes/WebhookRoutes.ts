import { WebhookController } from '@payment/controllers/WebhookController.js'
import { StripeService } from '@payment/services/StripeService.js'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import express, { Router } from 'express'
import type Stripe from 'stripe'

export function createWebhookRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  stripeInstance?: Stripe,
): Router {
  const router = Router()

  // Initialize services
  const stripeService = new StripeService(stripeInstance)

  // Initialize controller
  const webhookController = new WebhookController(stripeService)

  // SECURITY NOTE: No JWT/API key authentication required for webhooks
  // Authentication is handled via Stripe signature verification in the controller
  // The raw body is required for signature validation (industry standard)
  // Modern industry standard: Raw body parsing for webhook signature verification
  router.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    webhookController.handleStripeWebhook,
  )

  return router
}
