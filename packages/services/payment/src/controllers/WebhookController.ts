import type { IStripeService } from '@payment/services/StripeService.js'
import { STRIPE_WEBHOOK_SECRET } from '@pika/environment'
import { ErrorFactory, logger, SubscriptionServiceClient } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'
import Stripe from 'stripe'

/**
 * Handles Stripe webhook events
 */
export class WebhookController {
  private subscriptionClient: SubscriptionServiceClient

  constructor(private readonly stripeService: IStripeService) {
    // Bind all methods to preserve 'this' context
    this.handleStripeWebhook = this.handleStripeWebhook.bind(this)
    this.subscriptionClient = new SubscriptionServiceClient()
  }

  /**
   * POST /webhooks/stripe
   * Process Stripe webhook events
   */
  async handleStripeWebhook(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const signature = request.headers['stripe-signature'] as string
      const rawBody = request.body

      if (!signature) {
        throw ErrorFactory.businessRuleViolation(
          'Missing stripe-signature header',
          'Webhook signature is required for security validation',
        )
      }

      if (!rawBody) {
        throw ErrorFactory.businessRuleViolation(
          'Missing request body',
          'Webhook payload is required',
        )
      }

      // Debug logging for test environment
      if (process.env.NODE_ENV === 'test') {
        logger.info('Webhook debug', {
          bodyType: typeof rawBody,
          isBuffer: Buffer.isBuffer(rawBody),
          signature: signature,
          webhookSecret: STRIPE_WEBHOOK_SECRET ? 'present' : 'missing',
          webhookSecretValue: STRIPE_WEBHOOK_SECRET,
          bodyLength: Buffer.isBuffer(rawBody)
            ? rawBody.length
            : (rawBody as string).length,
        })
      }

      let event: Stripe.Event

      try {
        // Verify webhook signature using injected Stripe service
        event = this.stripeService.constructWebhookEvent(
          rawBody,
          signature,
          STRIPE_WEBHOOK_SECRET || '',
        )
      } catch (error) {
        logger.error('Webhook signature verification failed', { error })
        throw ErrorFactory.businessRuleViolation(
          'Invalid webhook signature',
          'Webhook signature verification failed',
        )
      }

      logger.info('Processing Stripe webhook event', {
        type: event.type,
        id: event.id,
      })

      // Handle subscription service integration
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription,
          )
          break

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          )
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          )
          break

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice,
          )
          break

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice,
          )
          break

        default:
          logger.info('Unhandled webhook event type', { type: event.type })
      }

      logger.info('Successfully processed webhook event', {
        type: event.type,
        id: event.id,
      })

      response.json({ received: true })
    } catch (error) {
      next(error)
    }
  }

  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info('Processing subscription.created webhook', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
    })

    // Extract metadata
    const userId = subscription.metadata?.userId
    const planId = subscription.metadata?.planId

    if (!userId || !planId) {
      logger.warn('Missing required metadata in subscription', {
        subscriptionId: subscription.id,
        metadata: subscription.metadata,
      })

      return
    }

    // Create subscription in Subscription Service
    await this.subscriptionClient.createSubscriptionFromStripe({
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000,
      ).toISOString(),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ).toISOString(),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined,
    })

    logger.info('Successfully created subscription via webhook', {
      subscriptionId: subscription.id,
      userId,
      planId,
    })
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info('Processing subscription.updated webhook', {
      subscriptionId: subscription.id,
      status: subscription.status,
    })

    // Update subscription status in Subscription Service
    await this.subscriptionClient.updateSubscriptionStatus({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000,
      ).toISOString(),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ).toISOString(),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : undefined,
      endedAt: subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : undefined,
    })

    logger.info('Successfully updated subscription via webhook', {
      subscriptionId: subscription.id,
      status: subscription.status,
    })
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info('Processing subscription.deleted webhook', {
      subscriptionId: subscription.id,
    })

    // Update subscription status to canceled
    await this.subscriptionClient.updateSubscriptionStatus({
      subscriptionId: subscription.id,
      status: 'canceled',
      endedAt: new Date().toISOString(),
    })

    // Update user membership status
    const userId = subscription.metadata?.userId

    if (userId) {
      await this.subscriptionClient.updateUserMembership({
        userId,
        isActive: false,
      })
    }

    logger.info('Successfully processed subscription deletion via webhook', {
      subscriptionId: subscription.id,
      userId,
    })
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    logger.info('Processing invoice.payment_succeeded webhook', {
      invoiceId: invoice.id,
      subscriptionId: (invoice as any).subscription,
      amount: invoice.amount_paid,
    })

    if (!(invoice as any).subscription) {
      logger.info('Invoice not associated with subscription, skipping', {
        invoiceId: invoice.id,
      })

      return
    }

    // Get subscription from Subscription Service
    const subscription =
      await this.subscriptionClient.getSubscriptionByStripeId(
        (invoice as any).subscription as string,
      )

    if (!subscription) {
      logger.warn('Subscription not found for invoice', {
        invoiceId: invoice.id,
        subscriptionId: (invoice as any).subscription,
      })

      return
    }

    // Credit processing removed - no credit tables in database

    // Update user membership to active
    await this.subscriptionClient.updateUserMembership({
      userId: subscription.userId,
      isActive: true,
    })

    logger.info('Successfully processed invoice payment success', {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
    })
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    logger.warn('Processing invoice.payment_failed webhook', {
      invoiceId: invoice.id,
      subscriptionId: (invoice as any).subscription,
      amount: invoice.amount_due,
    })

    if (!(invoice as any).subscription) {
      logger.info('Invoice not associated with subscription, skipping', {
        invoiceId: invoice.id,
      })

      return
    }

    // Get subscription from Subscription Service
    const subscription =
      await this.subscriptionClient.getSubscriptionByStripeId(
        (invoice as any).subscription as string,
      )

    if (!subscription) {
      logger.warn('Subscription not found for failed invoice', {
        invoiceId: invoice.id,
        subscriptionId: (invoice as any).subscription,
      })

      return
    }

    // Note: Payment failures are handled by Stripe's built-in retry logic
    // We could send notifications here, but that's better handled by the Communication Service
    // when subscription status changes to 'past_due' or 'unpaid'

    logger.info('Payment failure logged, Stripe will handle retries', {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
      userId: subscription.userId,
    })
  }
}
