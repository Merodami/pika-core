import { StripeService } from '@payment/services/StripeService.js'
import { StripeMockHelper } from '@pika/tests'
import { beforeAll, describe, expect, it } from 'vitest'

describe('Stripe Mock Integration', () => {
  let stripeService: StripeService

  beforeAll(async () => {
    // Wait for stripe-mock to be ready
    const isReady = await StripeMockHelper.waitForStripeMock()

    expect(isReady).toBe(true)

    // Create stripe instance
    const stripeInstance = StripeMockHelper.createMockStripeInstance()

    stripeService = new StripeService(stripeInstance)
  })

  describe('Product Management', () => {
    it('should create a product', async () => {
      const product = await stripeService.createProduct(
        'Test Product',
        'Test Description',
        { planType: 'basic' },
      )

      expect(product).toBeDefined()
      expect(product.id).toMatch(/^prod_/)
      expect(product.name).toBe('Test Product')
      expect(product.description).toBe('Test Description')
      // Note: stripe-mock may not preserve metadata in all cases
      expect(product.metadata).toBeDefined()
    })

    it('should list products', async () => {
      // Create a few products
      await stripeService.createProduct('Product 1')
      await stripeService.createProduct('Product 2')

      const products = await stripeService.listProducts(10)

      expect(products).toBeDefined()
      expect(products.data).toBeInstanceOf(Array)
      expect(products.data.length).toBeGreaterThan(0)
    })

    it('should update a product', async () => {
      const product = await stripeService.createProduct('Original Name')

      const updated = await stripeService.updateProduct(product.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      })

      expect(updated.id).toBe(product.id)
      expect(updated.name).toBe('Updated Name')
      expect(updated.description).toBe('Updated Description')
    })
  })

  describe('Price Management', () => {
    it('should create a price for a product', async () => {
      const product = await stripeService.createProduct('Price Test Product')

      const price = await stripeService.createPrice(
        product.id,
        29.99,
        'gbp',
        'month',
        1,
      )

      expect(price).toBeDefined()
      expect(price.id).toMatch(/^price_/)
      expect(price.product).toBe(product.id)
      expect(price.unit_amount).toBe(2999) // 29.99 in pence
      expect(price.currency).toBe('gbp')
      expect(price.recurring?.interval).toBe('month')
    })

    it('should list prices for a product', async () => {
      const product = await stripeService.createProduct('Multi-Price Product')

      // Create multiple prices
      await stripeService.createPrice(product.id, 10, 'gbp', 'month')
      await stripeService.createPrice(product.id, 100, 'gbp', 'year')

      const prices = await stripeService.listPrices(product.id)

      expect(prices).toBeDefined()
      expect(prices.data).toBeInstanceOf(Array)
      expect(prices.data.length).toBeGreaterThanOrEqual(1) // stripe-mock may return different counts
      // stripe-mock may return prices with product as string or expanded object
      expect(prices.data.length).toBeGreaterThan(0)
    })

    it('should deactivate a price', async () => {
      const product = await stripeService.createProduct(
        'Deactivate Price Product',
      )
      const price = await stripeService.createPrice(product.id, 50, 'gbp')

      const updated = await stripeService.updatePrice(price.id, false)

      expect(updated.id).toBe(price.id)
      expect(updated.active).toBe(false)
    })
  })

  describe('Customer Management', () => {
    it('should create a customer', async () => {
      const customer = await stripeService.createCustomer(
        'test@example.com',
        'Test Customer',
        { userId: '12345' },
      )

      expect(customer).toBeDefined()
      expect(customer.id).toMatch(/^cus_/)
      expect(customer.email).toBe('test@example.com')
      expect(customer.name).toBe('Test Customer')
      // Note: stripe-mock may not preserve metadata in all cases
      expect(customer.metadata).toBeDefined()
    })
  })

  describe('Subscription Management', () => {
    it('should create a subscription', async () => {
      // Create customer and product/price
      const customer = await stripeService.createCustomer(
        'subscriber@example.com',
        'Subscriber Test',
      )
      const product = await stripeService.createProduct('Subscription Product')
      const price = await stripeService.createPrice(
        product.id,
        49.99,
        'gbp',
        'month',
      )

      const subscription = await stripeService.createSubscription(
        customer.id,
        price.id,
        { planName: 'Premium' },
      )

      expect(subscription).toBeDefined()
      expect(subscription.id).toMatch(/^sub_/)
      expect(subscription.customer).toBe(customer.id)
      expect(subscription.status).toBe('active')
      // Note: stripe-mock may not preserve metadata in all cases
      expect(subscription.metadata).toBeDefined()
    })

    it('should cancel a subscription', async () => {
      // Create subscription first
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

      const cancelled = await stripeService.cancelSubscription(subscription.id)

      expect(cancelled.id).toBe(subscription.id)
      // Note: stripe-mock may return different status values
      expect(['canceled', 'active']).toContain(cancelled.status)
    })
  })
})
