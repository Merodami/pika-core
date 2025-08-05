import { subscriptionPublic } from '@pika/api'
import { RequestContext, validateResponse } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { SubscriptionMapper } from '@pika/sdk'
import { logger } from '@pika/shared'
import type { ISubscriptionService } from '@subscription/services/SubscriptionService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles public subscription operations (customer-facing)
 */
export class PublicSubscriptionController {
  constructor(private readonly subscriptionService: ISubscriptionService) {
    // Bind all methods to preserve 'this' context
    this.createSubscription = this.createSubscription.bind(this)
    this.getUserSubscription = this.getUserSubscription.bind(this)
    this.cancelSubscription = this.cancelSubscription.bind(this)
    this.reactivateSubscription = this.reactivateSubscription.bind(this)
  }

  /**
   * POST /subscriptions
   * Create new subscription for current user
   */
  async createSubscription(
    request: Request<{}, {}, subscriptionPublic.CreateSubscriptionRequest>,
    response: Response<subscriptionPublic.SubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Creating subscription', { userId, planId: data.planId })

      const subscription = await this.subscriptionService.createSubscription(
        userId,
        data,
      )

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionResponse,
        dto,
        'PublicSubscriptionController.createSubscription',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /subscriptions/me
   * Get current user's active subscription
   */
  @Cache({
    ttl: 300,
    prefix: 'user-active-subscription',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserSubscription(
    request: Request,
    response: Response<subscriptionPublic.SubscriptionResponse | null>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting user active subscription', { userId })

      const subscription =
        await this.subscriptionService.getUserActiveSubscription(userId)

      if (!subscription) {
        response.json(null)

        return
      }

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionResponse,
        dto,
        'PublicSubscriptionController.getUserSubscription',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /subscriptions/me/cancel
   * Cancel current user's subscription
   */
  async cancelSubscription(
    request: Request<{}, {}, subscriptionPublic.CancelSubscriptionRequest>,
    response: Response<subscriptionPublic.SubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { cancelAtPeriodEnd = true } = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('User cancelling subscription', { userId, cancelAtPeriodEnd })

      // Get user's active subscription
      const activeSubscription =
        await this.subscriptionService.getUserActiveSubscription(userId)

      if (!activeSubscription) {
        throw new Error('No active subscription found')
      }

      const subscription = await this.subscriptionService.cancelSubscription(
        activeSubscription.id,
        cancelAtPeriodEnd,
      )

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionResponse,
        dto,
        'PublicSubscriptionController.cancelSubscription',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /subscriptions/me/reactivate
   * Reactivate current user's cancelled subscription
   */
  async reactivateSubscription(
    request: Request,
    response: Response<subscriptionPublic.SubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('User reactivating subscription', { userId })

      // Get user's cancelled subscription
      const subscriptions = await this.subscriptionService.getAllSubscriptions({
        userId,
        cancelAtPeriodEnd: true,
        page: 1,
        limit: 1,
      })

      if (!subscriptions.data.length) {
        throw new Error('No cancelled subscription found')
      }

      const subscription =
        await this.subscriptionService.reactivateSubscription(
          subscriptions.data[0].id,
        )

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionResponse,
        dto,
        'PublicSubscriptionController.reactivateSubscription',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
