import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import type {
  CreateSubscriptionPlanDTO,
  SubscriptionPlanDomain,
  UpdateSubscriptionPlanDTO,
} from '@pika/sdk'
import {
  ErrorFactory,
  isUuidV4,
  logger,
  PaymentServiceClient,
} from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { IPlanRepository } from '@subscription/repositories/PlanRepository.js'
import type { PlanSearchParams } from '@subscription/types/search.js'

export interface IPlanService {
  createPlan(data: CreateSubscriptionPlanDTO): Promise<SubscriptionPlanDomain>
  getPlanById(id: string): Promise<SubscriptionPlanDomain>
  getAllPlans(
    params: PlanSearchParams,
  ): Promise<PaginatedResult<SubscriptionPlanDomain>>
  updatePlan(
    id: string,
    data: UpdateSubscriptionPlanDTO,
  ): Promise<SubscriptionPlanDomain>
  deletePlan(id: string): Promise<void>
  syncWithStripe(): Promise<void>
}

export class PlanService implements IPlanService {
  constructor(
    private readonly planRepository: IPlanRepository,
    private readonly cache: ICacheService,
    private readonly paymentClient: PaymentServiceClient,
  ) {}

  async createPlan(
    data: CreateSubscriptionPlanDTO,
  ): Promise<SubscriptionPlanDomain> {
    logger.info('Creating subscription plan', { name: data.name })

    try {
      // Create product via payment service
      const product = await this.paymentClient.createProduct({
        name: data.name,
        description: data.description,
        metadata: {
          features: JSON.stringify(data.features),
        },
      })

      // Create price via payment service
      const price = await this.paymentClient.createPrice({
        productId: product.id,
        amount: data.price,
        currency: data.currency || 'usd',
        intervalCount: data.intervalCount ?? 1,
      })

      // Create plan record
      const plan = await this.planRepository.create({
        ...data,
        stripeProductId: product.id,
        stripePriceId: price.id,
      })

      // Clear plan cache
      await this.clearPlanCache()

      return plan
    } catch (error) {
      logger.error('Failed to create plan', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: 3600,
    prefix: 'plan',
  })
  async getPlanById(id: string): Promise<SubscriptionPlanDomain> {
    // Validate UUID format
    if (!isUuidV4(id)) {
      throw ErrorFactory.badRequest('Invalid plan ID format')
    }

    const plan = await this.planRepository.findById(id)

    if (!plan) {
      throw ErrorFactory.resourceNotFound('SubscriptionPlan', id)
    }

    return plan
  }

  @Cache({
    ttl: 300,
    prefix: 'plans',
  })
  async getAllPlans(
    params: PlanSearchParams,
  ): Promise<PaginatedResult<SubscriptionPlanDomain>> {
    return this.planRepository.findAll(params)
  }

  async updatePlan(
    id: string,
    data: UpdateSubscriptionPlanDTO,
  ): Promise<SubscriptionPlanDomain> {
    logger.info('Updating subscription plan', { id })

    const existingPlan = await this.getPlanById(id)

    try {
      // Update product via payment service if name or description changed
      if (data.name || data.description || data.features) {
        await this.paymentClient.updateProduct(
          existingPlan.stripeProductId || '',
          {
            name: data.name || existingPlan.name,
            description: data.description || existingPlan.description,
            metadata: data.features
              ? { features: JSON.stringify(data.features) }
              : undefined,
          },
        )
      }

      // Note: Stripe doesn't allow updating price amount
      // You need to create a new price and update subscriptions

      const plan = await this.planRepository.update(id, data)

      // Clear plan cache
      await this.clearPlanCache()

      return plan
    } catch (error) {
      logger.error('Failed to update plan', { id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async deletePlan(id: string): Promise<void> {
    logger.info('Deleting subscription plan', { id })

    const plan = await this.getPlanById(id)

    try {
      // Archive product via payment service (can't delete if has subscriptions)
      await this.paymentClient.updateProduct(plan.stripeProductId || '', {
        active: false,
      })

      // Soft delete or deactivate the plan
      await this.planRepository.update(id, { isActive: false })

      // Clear plan cache
      await this.clearPlanCache()
    } catch (error) {
      logger.error('Failed to delete plan', { id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async syncWithStripe(): Promise<void> {
    logger.info('Syncing plans with Stripe')

    try {
      // Fetch all products from payment service
      const productsResponse = await this.paymentClient.listProducts(100)
      const products = productsResponse.data

      for (const product of products) {
        // Fetch prices for this product
        const pricesResponse = await this.paymentClient.listPrices(
          product.id,
          100,
        )
        const prices = pricesResponse.data

        for (const price of prices) {
          if (price.recurring) {
            // Check if plan exists
            const existingPlan = await this.planRepository.findByStripePriceId(
              price.id,
            )

            if (!existingPlan) {
              // Create new plan from payment service data
              await this.planRepository.create({
                name: product.name,
                description: product.description || undefined,
                price: price.amount, // Already converted from cents
                currency: price.currency,
                intervalCount: price.recurring.intervalCount,
                features: product.metadata.features
                  ? JSON.parse(product.metadata.features)
                  : [],
                stripeProductId: product.id,
                stripePriceId: price.id,
                isActive: product.active && price.active,
              })

              logger.info('Created plan from Stripe', {
                name: product.name,
                priceId: price.id,
              })
            }
          }
        }
      }

      // Clear plan cache after sync
      await this.clearPlanCache()
    } catch (error) {
      logger.error('Failed to sync with Stripe', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  private async clearPlanCache(): Promise<void> {
    try {
      await this.cache.delPattern('plan:*')
      await this.cache.delPattern('plans:*')
    } catch (error) {
      logger.error('Failed to clear plan cache', error)
    }
  }
}
