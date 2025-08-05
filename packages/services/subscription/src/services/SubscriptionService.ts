import { REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import type {
  CreateSubscriptionDTO,
  CreateSubscriptionFromWebhookDTO,
  SubscriptionDomain,
  SubscriptionPlanDomain,
  SubscriptionWithPlanDomain,
  UpdateSubscriptionDTO,
} from '@pika/sdk'
import {
  CommunicationServiceClient,
  ErrorFactory,
  isUuidV4,
  logger,
} from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import type { IPlanRepository } from '@subscription/repositories/PlanRepository.js'
import type {
  ISubscriptionRepository,
  SubscriptionSearchParams,
} from '@subscription/repositories/SubscriptionRepository.js'
import {
  CACHE_TTL_MULTIPLIERS,
  TEMPLATE_KEYS,
} from '@subscription/types/constants.js'

export interface ISubscriptionService {
  createSubscription(
    userId: string,
    data: CreateSubscriptionDTO,
  ): Promise<SubscriptionDomain>
  getSubscriptionById(id: string): Promise<SubscriptionWithPlanDomain>
  getUserActiveSubscription(
    userId: string,
  ): Promise<SubscriptionWithPlanDomain | null>
  getAllSubscriptions(
    params: SubscriptionSearchParams,
  ): Promise<PaginatedResult<SubscriptionDomain>>
  updateSubscription(
    id: string,
    data: UpdateSubscriptionDTO,
  ): Promise<SubscriptionDomain>
  cancelSubscription(
    id: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<SubscriptionDomain>
  reactivateSubscription(id: string): Promise<SubscriptionDomain>
  deleteSubscription(id: string): Promise<void>
  // Webhook-driven subscription creation
  createSubscriptionFromWebhook(
    data: CreateSubscriptionFromWebhookDTO,
  ): Promise<SubscriptionDomain>
  // Removed credit processing methods - no credit tables in database
  processAllActiveSubscriptions(): Promise<number>
  // Additional methods for internal use
  getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDomain | null>
  getUserSubscriptions(
    userId: string,
  ): Promise<PaginatedResult<SubscriptionDomain>>
}

export class SubscriptionService implements ISubscriptionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly planRepository: IPlanRepository,
    private readonly cache: ICacheService,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {}

  async createSubscription(
    userId: string,
    data: CreateSubscriptionDTO,
  ): Promise<SubscriptionDomain> {
    logger.info('Creating subscription', { userId, planId: data.planId })

    // Check if user already has an active subscription
    const existingSubscription =
      await this.subscriptionRepository.findByUserId(userId)

    if (existingSubscription) {
      throw ErrorFactory.businessRuleViolation(
        'User already has an active subscription',
        'Only one active subscription per user is allowed',
      )
    }

    // Get the plan details
    const plan = await this.planRepository.findById(data.planId)

    if (!plan) {
      throw ErrorFactory.resourceNotFound('SubscriptionPlan', data.planId)
    }

    if (!plan.isActive) {
      throw ErrorFactory.businessRuleViolation(
        'Plan is not active',
        'Cannot subscribe to an inactive plan',
      )
    }

    try {
      // Create subscription record (user-initiated subscription creation)
      const subscription = await this.subscriptionRepository.create({
        userId,
        planId: plan.id,
        status: 'unpaid', // Will be updated by webhook
        stripeCustomerId: data.stripeCustomerId,
        trialEnd: data.trialEnd,
        metadata: data.metadata,
      })

      // Credits processing removed - no credit tables in database

      // Clear user subscription cache
      await this.clearUserSubscriptionCache(userId)

      // Send welcome email notification
      if (this.communicationClient && subscription.status === 'active') {
        await this.sendSubscriptionCreatedEmail(userId, subscription, plan)
      }

      return subscription
    } catch (error) {
      logger.error('Failed to create subscription', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL * CACHE_TTL_MULTIPLIERS.SUBSCRIPTION,
    prefix: 'subscription',
  })
  async getSubscriptionById(id: string): Promise<SubscriptionWithPlanDomain> {
    // Validate UUID format
    if (!isUuidV4(id)) {
      throw ErrorFactory.badRequest('Invalid subscription ID format')
    }

    const subscription = await this.subscriptionRepository.findByIdWithPlan(id)

    if (!subscription) {
      throw ErrorFactory.resourceNotFound('Subscription', id)
    }

    return subscription
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL * CACHE_TTL_MULTIPLIERS.USER_SUBSCRIPTION,
    prefix: 'user-subscription',
  })
  async getUserActiveSubscription(
    userId: string,
  ): Promise<SubscriptionWithPlanDomain | null> {
    return this.subscriptionRepository.findByUserIdWithPlan(userId)
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL * CACHE_TTL_MULTIPLIERS.SUBSCRIPTIONS_LIST,
    prefix: 'subscriptions',
  })
  async getAllSubscriptions(
    params: SubscriptionSearchParams,
  ): Promise<PaginatedResult<SubscriptionDomain>> {
    return this.subscriptionRepository.findAll(params)
  }

  async updateSubscription(
    id: string,
    data: UpdateSubscriptionDTO,
  ): Promise<SubscriptionDomain> {
    logger.info('Updating subscription', { id })

    const subscription = await this.getSubscriptionById(id)

    // Validate plan change if provided
    if (data.planId && data.planId !== subscription.planId) {
      const plan = await this.planRepository.findById(data.planId)

      if (!plan) {
        throw ErrorFactory.resourceNotFound('SubscriptionPlan', data.planId)
      }

      if (!plan.isActive) {
        throw ErrorFactory.businessRuleViolation(
          'Plan is not active',
          'Cannot change to an inactive plan',
        )
      }
    }

    const updatedSubscription = await this.subscriptionRepository.update(
      id,
      data,
    )

    // Clear subscription cache
    await this.clearSubscriptionCache(id, updatedSubscription.userId)

    return updatedSubscription
  }

  async cancelSubscription(
    id: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<SubscriptionDomain> {
    logger.info('Cancelling subscription', { id, cancelAtPeriodEnd })

    const subscription = await this.getSubscriptionById(id)

    if (subscription.status === 'canceled') {
      throw ErrorFactory.businessRuleViolation(
        'Subscription already cancelled',
        'This subscription is already cancelled',
      )
    }

    // Update subscription record (Stripe cancellation handled by Payment Service)
    const updatedSubscription = await this.subscriptionRepository.update(id, {
      cancelAtPeriodEnd,
      cancelledAt: cancelAtPeriodEnd ? undefined : new Date(),
      status: cancelAtPeriodEnd ? subscription.status : 'canceled',
    })

    // Clear subscription cache
    await this.clearSubscriptionCache(id, updatedSubscription.userId)

    // Send cancellation notification
    if (this.communicationClient) {
      await this.sendSubscriptionCancelledEmail(
        updatedSubscription.userId,
        updatedSubscription,
        cancelAtPeriodEnd,
      )
    }

    return updatedSubscription
  }

  async reactivateSubscription(id: string): Promise<SubscriptionDomain> {
    logger.info('Reactivating subscription', { id })

    const subscription = await this.getSubscriptionById(id)

    if (!subscription.cancelAtPeriodEnd) {
      throw ErrorFactory.businessRuleViolation(
        'Subscription not scheduled for cancellation',
        'This subscription is not scheduled for cancellation',
      )
    }

    // Update subscription record (Stripe reactivation handled by Payment Service)
    const updatedSubscription = await this.subscriptionRepository.update(id, {
      cancelAtPeriodEnd: false,
      cancelledAt: undefined,
    })

    // Clear subscription cache
    await this.clearSubscriptionCache(id, updatedSubscription.userId)

    return updatedSubscription
  }

  async deleteSubscription(id: string): Promise<void> {
    logger.info('Deleting subscription', { id })

    const subscription = await this.getSubscriptionById(id)

    // Soft delete the subscription
    await this.subscriptionRepository.delete(id)

    // Clear subscription cache
    await this.clearSubscriptionCache(id, subscription.userId)

    logger.info('Successfully deleted subscription', { id })
  }

  async createSubscriptionFromWebhook(
    data: CreateSubscriptionFromWebhookDTO,
  ): Promise<SubscriptionDomain> {
    logger.info('Creating subscription from webhook', {
      userId: data.userId,
      planId: data.planId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    })

    // Get the plan details
    const plan = await this.planRepository.findById(data.planId)

    if (!plan) {
      throw ErrorFactory.resourceNotFound('SubscriptionPlan', data.planId)
    }

    try {
      // Create subscription record from webhook data
      const subscription = await this.subscriptionRepository.create({
        userId: data.userId,
        planId: data.planId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        trialEnd: data.trialEnd,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
      })

      // Credits processing removed - no credit tables in database

      // Clear user subscription cache
      await this.clearUserSubscriptionCache(data.userId)

      logger.info('Successfully created subscription from webhook', {
        subscriptionId: subscription.id,
        userId: data.userId,
        planId: data.planId,
      })

      // Send welcome email notification
      if (this.communicationClient && subscription.status === 'active') {
        await this.sendSubscriptionCreatedEmail(data.userId, subscription, plan)
      }

      return subscription
    } catch (error) {
      logger.error('Failed to create subscription from webhook', {
        userId: data.userId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  // Credit processing method removed - no credit tables in database
  async processSubscriptionCredits(subscriptionId: string): Promise<never> {
    logger.info('Processing subscription credits', { subscriptionId })

    const subscription =
      await this.subscriptionRepository.findByIdWithPlan(subscriptionId)

    if (!subscription) {
      throw ErrorFactory.resourceNotFound('Subscription', subscriptionId)
    }

    if (!subscription.plan) {
      throw ErrorFactory.businessRuleViolation(
        'Subscription has no plan',
        'Cannot process credits for subscription without a plan',
      )
    }

    // Credits processing removed - no credit tables in database
    throw ErrorFactory.businessRuleViolation(
      'Credits not supported',
      'Credit processing is not available in this system',
    )
  }

  async processAllActiveSubscriptions(): Promise<number> {
    logger.info('Processing all active subscriptions')

    const activeSubscriptions =
      await this.subscriptionRepository.findAllActive()

    const processedCount = 0

    for (const subscription of activeSubscriptions) {
      try {
        // Credits processing removed - no credit tables in database
        // Skip credit processing for this subscription
      } catch (error) {
        logger.error('Failed to process subscription', {
          subscriptionId: subscription.id,
          error,
        })
      }
    }

    logger.info('Completed processing active subscriptions', { processedCount })

    return processedCount
  }

  private async clearSubscriptionCache(
    subscriptionId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.cache.del(`subscription:${subscriptionId}`)
      await this.cache.del(`user-subscription:${userId}`)
      await this.cache.delPattern('subscriptions:*')
    } catch (error) {
      logger.error('Failed to clear subscription cache', error)
    }
  }

  private async clearUserSubscriptionCache(userId: string): Promise<void> {
    try {
      await this.cache.del(`user-subscription:${userId}`)
      await this.cache.delPattern('subscriptions:*')
    } catch (error) {
      logger.error('Failed to clear user subscription cache', error)
    }
  }

  private async sendSubscriptionCreatedEmail(
    userId: string,
    subscription: SubscriptionDomain,
    plan: SubscriptionPlanDomain,
  ): Promise<void> {
    if (!this.communicationClient) return

    try {
      await this.communicationClient.sendTransactionalEmail({
        userId: userId as any, // Communication client expects branded UserId
        templateKey: TEMPLATE_KEYS.SUBSCRIPTION_ACTIVATED,
        variables: {
          planName: plan.name,
          price: `$${(plan.price / 100).toFixed(2)}`,
          features: plan.features.join(', '),
          nextBillingDate: subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
            : 'N/A',
        },
        trackOpens: true,
        trackClicks: true,
      })

      logger.info('Subscription created email sent', {
        userId,
        subscriptionId: subscription.id,
      })
    } catch (error) {
      logger.error('Failed to send subscription created email', {
        userId,
        subscriptionId: subscription.id,
        error,
      })
      // Don't throw - email failure shouldn't break subscription creation
    }
  }

  private async sendSubscriptionCancelledEmail(
    userId: string,
    subscription: SubscriptionDomain,
    cancelAtPeriodEnd: boolean,
  ): Promise<void> {
    if (!this.communicationClient) return

    try {
      await this.communicationClient.sendTransactionalEmail({
        userId: userId as any, // Communication client expects branded UserId
        templateKey: TEMPLATE_KEYS.SUBSCRIPTION_CANCELLED,
        variables: {
          planType: 'Standard', // planType field removed
          cancelAtPeriodEnd: cancelAtPeriodEnd.toString(),
          endDate: subscription.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
            : 'Immediately',
        },
        trackOpens: true,
        trackClicks: true,
      })

      logger.info('Subscription cancelled email sent', {
        userId,
        subscriptionId: subscription.id,
      })
    } catch (error) {
      logger.error('Failed to send subscription cancelled email', {
        userId,
        subscriptionId: subscription.id,
        error,
      })
      // Don't throw - email failure shouldn't break subscription cancellation
    }
  }

  async getSubscriptionByStripeId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDomain | null> {
    try {
      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          stripeSubscriptionId,
        )

      return subscription
    } catch (error) {
      logger.error('Failed to get subscription by Stripe ID', {
        stripeSubscriptionId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserSubscriptions(
    userId: string,
  ): Promise<PaginatedResult<SubscriptionDomain>> {
    try {
      const subscriptions = await this.subscriptionRepository.findAll({
        userId,
      })

      return subscriptions
    } catch (error) {
      logger.error('Failed to get user subscriptions', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }
}
