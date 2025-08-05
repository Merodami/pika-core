import { StripeService } from '@payment/services/StripeService.js'
import { StripeMockHelper } from '@pika/tests'
import { beforeAll, describe, expect, it } from 'vitest'

describe('StripeService', () => {
  let stripeService: StripeService

  beforeAll(async () => {
    // Wait for stripe-mock to be ready
    await StripeMockHelper.waitForStripeMock()

    // Create StripeService with stripe-mock instance
    const stripeInstance = StripeMockHelper.createMockStripeInstance()

    stripeService = new StripeService(stripeInstance)
  })

  describe('Payment Intent operations', () => {
    it('should create a payment intent', async () => {
      const amount = 10 // £10.00
      const currency = 'gbp'
      const metadata = { orderId: 'test-123' }

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency,
        metadata,
      )

      expect(paymentIntent).toBeDefined()
      expect(paymentIntent.id).toMatch(/^pi_/)
      expect(paymentIntent.amount).toBe(1000) // Converted to pence
      expect(paymentIntent.currency).toBe('gbp')
      expect(paymentIntent.status).toBeDefined()
    })

    it('should confirm a payment intent', async () => {
      // First create a payment intent
      const paymentIntent = await stripeService.createPaymentIntent(10, 'gbp')

      // Confirm the payment intent
      const confirmed = await stripeService.confirmPaymentIntent(
        paymentIntent.id,
      )

      expect(confirmed).toBeDefined()
      expect(confirmed.id).toBe(paymentIntent.id)
      expect(confirmed.status).toBeDefined()
    })
  })

  describe('Product and Price operations', () => {
    it('should create a product', async () => {
      const name = 'Test Subscription Plan'
      const description = 'A test plan for unit testing'
      const metadata = { planType: 'test' }

      const product = await stripeService.createProduct(
        name,
        description,
        metadata,
      )

      expect(product).toBeDefined()
      expect(product.id).toMatch(/^prod_/)
      expect(product.name).toBe(name)
      expect(product.description).toBe(description)
      expect(product.active).toBe(true)
    })

    it('should update a product', async () => {
      // First create a product
      const product = await stripeService.createProduct('Original Name')

      // Then update it
      const updated = await stripeService.updateProduct(product.id, {
        name: 'Updated Name',
        description: 'Updated description',
      })

      expect(updated.id).toBe(product.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated description')
    })

    it('should create a price', async () => {
      // First create a product
      const product = await stripeService.createProduct('Price Test Product')
      const amount = 29.99 // £29.99
      const currency = 'gbp'
      const interval = 'month'

      const price = await stripeService.createPrice(
        product.id,
        amount,
        currency,
        interval,
        1,
      )

      expect(price).toBeDefined()
      expect(price.id).toMatch(/^price_/)
      expect(price.product).toBe(product.id)
      expect(price.unit_amount).toBe(2999) // Stripe returns in pence
      expect(price.currency).toBe(currency)
      expect(price.recurring).toMatchObject({
        interval: 'month',
        interval_count: 1,
      })
    })

    it('should list products', async () => {
      // Create a few products first
      await stripeService.createProduct('Product 1', 'First product')
      await stripeService.createProduct('Product 2', 'Second product')

      // List products
      const products = await stripeService.listProducts(10)

      expect(products).toBeDefined()
      expect(products.data).toBeInstanceOf(Array)
      expect(products.data.length).toBeGreaterThan(0)
      expect(products.data[0]).toHaveProperty('id')
      expect(products.data[0]).toHaveProperty('name')
    })

    it('should list prices for a product', async () => {
      // Create a product and prices
      const product = await stripeService.createProduct('Multi-Price Product')

      await stripeService.createPrice(product.id, 19.99, 'gbp', 'month')
      await stripeService.createPrice(product.id, 199.99, 'gbp', 'year')

      // List prices
      const prices = await stripeService.listPrices(product.id, 10)

      expect(prices).toBeDefined()
      expect(prices.data).toBeInstanceOf(Array)
      expect(prices.data.length).toBeGreaterThan(0)
    })
  })

  describe('Customer operations', () => {
    it('should create a customer', async () => {
      const email = 'test@example.com'
      const name = 'Test User'
      const metadata = { userId: 'user-123' }

      const customer = await stripeService.createCustomer(email, name, metadata)

      expect(customer).toBeDefined()
      expect(customer.id).toMatch(/^cus_/)
      expect(customer.email).toBe(email)
      expect(customer.name).toBe(name)
    })
  })

  describe('Subscription operations', () => {
    it('should create a subscription', async () => {
      // Create customer and product/price first
      const customer = await stripeService.createCustomer(
        'sub@example.com',
        'Sub Test',
      )
      const product = await stripeService.createProduct('Subscription Product')
      const price = await stripeService.createPrice(
        product.id,
        29.99,
        'gbp',
        'month',
      )
      const metadata = { planId: 'test-plan' }

      const subscription = await stripeService.createSubscription(
        customer.id,
        price.id,
        metadata,
      )

      expect(subscription).toBeDefined()
      expect(subscription.id).toMatch(/^sub_/)
      expect(subscription.customer).toBe(customer.id)
      expect(subscription.status).toBe('active')
    })

    it('should cancel a subscription', async () => {
      // First create customer, product, price and subscription
      const customer = await stripeService.createCustomer(
        'cancel@example.com',
        'Cancel Test',
      )
      const product = await stripeService.createProduct('Cancel Product')
      const price = await stripeService.createPrice(
        product.id,
        25,
        'gbp',
        'month',
      )
      const subscription = await stripeService.createSubscription(
        customer.id,
        price.id,
      )

      // Cancel the subscription
      const cancelled = await stripeService.cancelSubscription(subscription.id)

      expect(cancelled).toBeDefined()
      expect(cancelled.id).toBe(subscription.id)
      // Note: stripe-mock may return different status values
      expect(['active', 'canceled']).toContain(cancelled.status)
    })
  })
})
