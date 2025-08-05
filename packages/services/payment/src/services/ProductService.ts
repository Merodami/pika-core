import { ErrorFactory, logger } from '@pika/shared'

import type { IStripeService } from './StripeService.js'

export interface CreateProductDTO {
  name: string
  description?: string
  metadata?: Record<string, string>
}

export interface UpdateProductDTO {
  name?: string
  description?: string
  active?: boolean
  metadata?: Record<string, string>
}

export interface CreatePriceDTO {
  productId: string
  amount: number
  currency: string
  interval?: 'day' | 'week' | 'month' | 'year'
  intervalCount?: number
}

export interface ProductResult {
  id: string
  name: string
  description?: string
  active: boolean
  metadata: Record<string, string>
}

export interface PriceResult {
  id: string
  productId: string
  amount: number
  currency: string
  active: boolean
  recurring?: {
    interval: string
    intervalCount: number
  }
}

export interface IProductService {
  createProduct(data: CreateProductDTO): Promise<ProductResult>
  updateProduct(id: string, data: UpdateProductDTO): Promise<ProductResult>
  createPrice(data: CreatePriceDTO): Promise<PriceResult>
  deactivatePrice(id: string): Promise<PriceResult>
  listProducts(limit?: number): Promise<ProductResult[]>
  listPrices(productId?: string, limit?: number): Promise<PriceResult[]>
}

export class ProductService implements IProductService {
  constructor(private readonly stripeService: IStripeService) {}

  async createProduct(data: CreateProductDTO): Promise<ProductResult> {
    try {
      logger.info('Creating product', { name: data.name })

      const stripeProduct = await this.stripeService.createProduct(
        data.name,
        data.description,
        data.metadata,
      )

      return {
        id: stripeProduct.id,
        name: stripeProduct.name,
        description: stripeProduct.description || undefined,
        active: stripeProduct.active,
        metadata: stripeProduct.metadata,
      }
    } catch (error) {
      logger.error('Failed to create product', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateProduct(
    id: string,
    data: UpdateProductDTO,
  ): Promise<ProductResult> {
    try {
      logger.info('Updating product', { id, updates: data })

      const stripeProduct = await this.stripeService.updateProduct(id, data)

      return {
        id: stripeProduct.id,
        name: stripeProduct.name,
        description: stripeProduct.description || undefined,
        active: stripeProduct.active,
        metadata: stripeProduct.metadata,
      }
    } catch (error) {
      logger.error('Failed to update product', { id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async createPrice(data: CreatePriceDTO): Promise<PriceResult> {
    try {
      logger.info('Creating price', {
        productId: data.productId,
        amount: data.amount,
      })

      const stripePrice = await this.stripeService.createPrice(
        data.productId,
        data.amount,
        data.currency,
        data.interval,
        data.intervalCount,
      )

      return {
        id: stripePrice.id,
        productId: stripePrice.product as string,
        amount: (stripePrice.unit_amount || 0) / 100, // Convert from cents
        currency: stripePrice.currency,
        active: stripePrice.active,
        recurring: stripePrice.recurring
          ? {
              interval: stripePrice.recurring.interval,
              intervalCount: stripePrice.recurring.interval_count,
            }
          : undefined,
      }
    } catch (error) {
      logger.error('Failed to create price', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async deactivatePrice(id: string): Promise<PriceResult> {
    try {
      logger.info('Deactivating price', { id })

      const stripePrice = await this.stripeService.updatePrice(id, false)

      return {
        id: stripePrice.id,
        productId: stripePrice.product as string,
        amount: (stripePrice.unit_amount || 0) / 100,
        currency: stripePrice.currency,
        active: stripePrice.active,
        recurring: stripePrice.recurring
          ? {
              interval: stripePrice.recurring.interval,
              intervalCount: stripePrice.recurring.interval_count,
            }
          : undefined,
      }
    } catch (error) {
      logger.error('Failed to deactivate price', { id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async listProducts(limit?: number): Promise<ProductResult[]> {
    try {
      logger.info('Listing products', { limit })

      const stripeProducts = await this.stripeService.listProducts(limit)

      return stripeProducts.data.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        active: product.active,
        metadata: product.metadata,
      }))
    } catch (error) {
      logger.error('Failed to list products', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async listPrices(productId?: string, limit?: number): Promise<PriceResult[]> {
    try {
      logger.info('Listing prices', { productId, limit })

      const stripePrices = await this.stripeService.listPrices(productId, limit)

      return stripePrices.data.map((price) => ({
        id: price.id,
        productId: price.product as string,
        amount: (price.unit_amount || 0) / 100,
        currency: price.currency,
        active: price.active,
        recurring: price.recurring
          ? {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            }
          : undefined,
      }))
    } catch (error) {
      logger.error('Failed to list prices', { error })
      throw ErrorFactory.fromError(error)
    }
  }
}
