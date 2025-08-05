import { createStripeInstance } from '@payment/config/stripe.config.js'
import { STRIPE_MOCK_HOST } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'
import Stripe from 'stripe'

export interface IStripeService {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent>
  confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>
  createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer>
  createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Subscription>
  cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription>
  // Webhook handling
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event
  // Product and Price management
  createProduct(
    name: string,
    description?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Product>
  updateProduct(
    productId: string,
    updates: {
      name?: string
      description?: string
      active?: boolean
      metadata?: Record<string, string>
    },
  ): Promise<Stripe.Product>
  createPrice(
    productId: string,
    amount: number,
    currency: string,
    interval?: 'day' | 'week' | 'month' | 'year',
    intervalCount?: number,
  ): Promise<Stripe.Price>
  updatePrice(priceId: string, active: boolean): Promise<Stripe.Price>
  listProducts(limit?: number): Promise<Stripe.ApiList<Stripe.Product>>
  listPrices(
    productId?: string,
    limit?: number,
  ): Promise<Stripe.ApiList<Stripe.Price>>
}

export class StripeService implements IStripeService {
  private stripe: Stripe
  private isStripeMock: boolean = false

  constructor(stripeInstance?: Stripe) {
    if (stripeInstance) {
      // Use injected Stripe instance (for testing)
      this.stripe = stripeInstance

      // Check if this is stripe-mock by looking at the config
      const host = (this.stripe as any)._api?.host

      this.isStripeMock = host === STRIPE_MOCK_HOST
    } else {
      // Create Stripe instance using configuration
      this.stripe = createStripeInstance()
      this.isStripeMock = false
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'gbp',
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    try {
      logger.info('Creating Stripe payment intent', {
        amount,
        currency,
        metadata,
      })

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents/pence
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      })

      logger.info('Successfully created payment intent', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      })

      return paymentIntent
    } catch (error) {
      logger.error('Failed to create payment intent', {
        amount,
        currency,
        error,
      })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to create payment intent',
        error,
      )
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      logger.info('Confirming payment intent', { paymentIntentId })

      const paymentIntent =
        await this.stripe.paymentIntents.confirm(paymentIntentId)

      logger.info('Successfully confirmed payment intent', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      })

      return paymentIntent
    } catch (error) {
      logger.error('Failed to confirm payment intent', {
        paymentIntentId,
        error,
      })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to confirm payment intent',
        error,
      )
    }
  }

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    try {
      logger.info('Creating Stripe customer', { email, name, metadata })

      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata || {},
      })

      logger.info('Successfully created customer', {
        customerId: customer.id,
        email: customer.email,
      })

      return customer
    } catch (error) {
      logger.error('Failed to create customer', { email, name, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to create customer',
        error,
      )
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Creating Stripe subscription', {
        customerId,
        priceId,
        metadata,
      })

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
      })

      logger.info('Successfully created subscription', {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
      })

      return subscription
    } catch (error) {
      logger.error('Failed to create subscription', {
        customerId,
        priceId,
        error,
      })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to create subscription',
        error,
      )
    }
  }

  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      logger.info('Cancelling Stripe subscription', { subscriptionId })

      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId)

      logger.info('Successfully cancelled subscription', {
        subscriptionId: subscription.id,
        status: subscription.status,
      })

      return subscription
    } catch (error) {
      logger.error('Failed to cancel subscription', { subscriptionId, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to cancel subscription',
        error,
      )
    }
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    try {
      if (this.isStripeMock) {
        // stripe-mock doesn't support webhook signature validation
        // Parse the payload directly for testing
        logger.debug(
          'stripe-mock detected: bypassing webhook signature validation',
        )

        const payloadString = Buffer.isBuffer(payload)
          ? payload.toString('utf8')
          : payload

        return JSON.parse(payloadString) as Stripe.Event
      }

      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      )
    } catch (error) {
      logger.error('Failed to construct webhook event', { error })
      throw ErrorFactory.businessRuleViolation(
        'Invalid webhook signature',
        'Webhook signature verification failed',
      )
    }
  }

  async createProduct(
    name: string,
    description?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Product> {
    try {
      logger.info('Creating Stripe product', { name, description, metadata })

      const product = await this.stripe.products.create({
        name,
        description: description || undefined,
        metadata: metadata || {},
      })

      logger.info('Successfully created product', {
        productId: product.id,
        name: product.name,
      })

      return product
    } catch (error) {
      logger.error('Failed to create product', { name, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to create product',
        error,
      )
    }
  }

  async updateProduct(
    productId: string,
    updates: {
      name?: string
      description?: string
      active?: boolean
      metadata?: Record<string, string>
    },
  ): Promise<Stripe.Product> {
    try {
      logger.info('Updating Stripe product', { productId, updates })

      const product = await this.stripe.products.update(productId, {
        name: updates.name,
        description: updates.description,
        active: updates.active,
        metadata: updates.metadata,
      })

      logger.info('Successfully updated product', {
        productId: product.id,
        name: product.name,
      })

      return product
    } catch (error) {
      logger.error('Failed to update product', { productId, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to update product',
        error,
      )
    }
  }

  async createPrice(
    productId: string,
    amount: number,
    currency: string = 'gbp',
    interval?: 'day' | 'week' | 'month' | 'year',
    intervalCount?: number,
  ): Promise<Stripe.Price> {
    try {
      logger.info('Creating Stripe price', {
        productId,
        amount,
        currency,
        interval,
        intervalCount,
      })

      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: Math.round(amount * 100), // Convert to cents/pence
        currency,
      }

      if (interval) {
        priceData.recurring = {
          interval,
          interval_count: intervalCount || 1,
        }
      }

      const price = await this.stripe.prices.create(priceData)

      logger.info('Successfully created price', {
        priceId: price.id,
        productId: price.product,
        amount: price.unit_amount,
      })

      return price
    } catch (error) {
      logger.error('Failed to create price', { productId, amount, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to create price',
        error,
      )
    }
  }

  async updatePrice(priceId: string, active: boolean): Promise<Stripe.Price> {
    try {
      logger.info('Updating Stripe price', { priceId, active })

      const price = await this.stripe.prices.update(priceId, {
        active,
      })

      logger.info('Successfully updated price', {
        priceId: price.id,
        active: price.active,
      })

      return price
    } catch (error) {
      logger.error('Failed to update price', { priceId, error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to update price',
        error,
      )
    }
  }

  async listProducts(
    limit: number = 100,
  ): Promise<Stripe.ApiList<Stripe.Product>> {
    try {
      logger.info('Listing Stripe products', { limit })

      const products = await this.stripe.products.list({
        limit,
        active: true,
      })

      logger.info('Successfully listed products', {
        count: products.data.length,
      })

      return products
    } catch (error) {
      logger.error('Failed to list products', { error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to list products',
        error,
      )
    }
  }

  async listPrices(
    productId?: string,
    limit: number = 100,
  ): Promise<Stripe.ApiList<Stripe.Price>> {
    try {
      logger.info('Listing Stripe prices', { productId, limit })

      const params: Stripe.PriceListParams = {
        limit,
        active: true,
      }

      if (productId) {
        params.product = productId
      }

      const prices = await this.stripe.prices.list(params)

      logger.info('Successfully listed prices', {
        count: prices.data.length,
      })

      return prices
    } catch (error) {
      logger.error('Failed to list prices', { error })
      throw ErrorFactory.externalServiceError(
        'Stripe',
        'Failed to list prices',
        error,
      )
    }
  }

  // Utility method to convert amount from pence/cents to major currency unit
  static fromStripeAmount(amount: number): number {
    return amount / 100
  }

  // Utility method to convert amount to pence/cents for Stripe
  static toStripeAmount(amount: number): number {
    return Math.round(amount * 100)
  }
}
