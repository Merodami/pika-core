import { ProductService } from '@payment/services/ProductService.js'
import type { IStripeService } from '@payment/services/StripeService.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ProductService', () => {
  let productService: ProductService
  let mockStripeService: Partial<IStripeService>

  beforeEach(() => {
    // Create mock StripeService
    mockStripeService = {
      createProduct: vi.fn().mockResolvedValue({
        id: 'prod_test_123',
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: { planId: 'test-plan' },
      }),
      updateProduct: vi.fn().mockResolvedValue({
        id: 'prod_test_123',
        name: 'Updated Product',
        description: 'Updated Description',
        active: false,
        metadata: { planId: 'test-plan' },
      }),
      listProducts: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'prod_test_123',
            name: 'Test Product',
            description: 'Test Description',
            active: true,
            metadata: {
              planId: 'test-plan',
              features: '["Feature 1","Feature 2"]',
            },
          },
        ],
        has_more: false,
      }),
      createPrice: vi.fn().mockResolvedValue({
        id: 'price_test_123',
        product: 'prod_test_123',
        unit_amount: 2999,
        currency: 'gbp',
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      }),
      listPrices: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'price_test_123',
            product: 'prod_test_123',
            unit_amount: 2999,
            currency: 'gbp',
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
        ],
        has_more: false,
      }),
    }

    // Create ProductService with mock
    productService = new ProductService(mockStripeService as IStripeService)
  })

  describe('Product operations', () => {
    it('should create a product', async () => {
      const product = await productService.createProduct({
        name: 'Test Product',
        description: 'Test Description',
        metadata: { planId: 'test-plan' },
      })

      expect(mockStripeService.createProduct).toHaveBeenCalledWith(
        'Test Product',
        'Test Description',
        { planId: 'test-plan' },
      )
      expect(product).toMatchObject({
        id: 'prod_test_123',
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: { planId: 'test-plan' },
      })
    })

    it('should update a product', async () => {
      const product = await productService.updateProduct('prod_test_123', {
        name: 'Updated Product',
        description: 'Updated Description',
        active: false,
      })

      expect(mockStripeService.updateProduct).toHaveBeenCalledWith(
        'prod_test_123',
        {
          name: 'Updated Product',
          description: 'Updated Description',
          active: false,
        },
      )
      expect(product).toMatchObject({
        id: 'prod_test_123',
        name: 'Updated Product',
        description: 'Updated Description',
        active: false,
      })
    })

    it('should list products', async () => {
      const products = await productService.listProducts(10)

      expect(mockStripeService.listProducts).toHaveBeenCalledWith(10)
      expect(products).toHaveLength(1)
      expect(products[0]).toMatchObject({
        id: 'prod_test_123',
        name: 'Test Product',
        description: 'Test Description',
        active: true,
        metadata: {
          planId: 'test-plan',
          features: '["Feature 1","Feature 2"]', // Raw JSON string as stored
        },
      })
    })
  })

  describe('Price operations', () => {
    it('should create a price with proper amount conversion', async () => {
      const price = await productService.createPrice({
        productId: 'prod_test_123',
        amount: 29.99, // £29.99
        currency: 'gbp',
        interval: 'month',
        intervalCount: 1,
      })

      expect(mockStripeService.createPrice).toHaveBeenCalledWith(
        'prod_test_123',
        29.99,
        'gbp',
        'month',
        1,
      )
      expect(price).toMatchObject({
        id: 'price_test_123',
        productId: 'prod_test_123',
        amount: 29.99, // Converted back from pence
        currency: 'gbp',
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
      })
    })

    it('should list prices with proper amount conversion', async () => {
      const prices = await productService.listPrices('prod_test_123', 10)

      expect(mockStripeService.listPrices).toHaveBeenCalledWith(
        'prod_test_123',
        10,
      )
      expect(prices).toHaveLength(1)
      expect(prices[0]).toMatchObject({
        id: 'price_test_123',
        productId: 'prod_test_123',
        amount: 29.99, // Converted from 2999 pence
        currency: 'gbp',
        recurring: {
          interval: 'month',
          intervalCount: 1,
        },
      })
    })
  })
})
