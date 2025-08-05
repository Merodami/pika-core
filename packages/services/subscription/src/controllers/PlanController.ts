import { subscriptionCommon, subscriptionPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { SubscriptionPlanMapper } from '@pika/sdk'
import { logger } from '@pika/shared'
// Plan controller
import type { IPlanService } from '@subscription/services/PlanService.js'
import type { PlanSearchParams } from '@subscription/types/search.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles subscription plan management operations
 */
export class PlanController {
  constructor(private readonly planService: IPlanService) {
    // Bind all methods to preserve 'this' context
    this.createPlan = this.createPlan.bind(this)
    this.getPlans = this.getPlans.bind(this)
    this.getPlanById = this.getPlanById.bind(this)
    this.updatePlan = this.updatePlan.bind(this)
    this.deletePlan = this.deletePlan.bind(this)
    this.syncPlans = this.syncPlans.bind(this)
  }

  /**
   * POST /plans
   * Create new subscription plan
   */
  async createPlan(
    request: Request<{}, {}, subscriptionPublic.CreateSubscriptionPlanRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Creating subscription plan', { name: data.name })

      const plan = await this.planService.createPlan(data)

      const dto = SubscriptionPlanMapper.toDTO(plan)

      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionPlanDetailResponse,
        dto,
        'PlanController.createPlan',
      )

      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /plans
   * Get all subscription plans
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'plans-list',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getPlans(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<subscriptionPublic.SubscriptionPlanQueryParams>(
          request,
        )

      // Transform API query to service params
      const params: PlanSearchParams = {
        page: query.page,
        limit: query.limit,
        isActive: query.isActive,
        search: undefined, // Not in API schema
        // Removed gym-related properties
      }

      logger.info('Getting subscription plans', { params })

      const result = await this.planService.getAllPlans(params)

      // Use standard pagination pattern
      const responseData = paginatedResponse(
        result,
        SubscriptionPlanMapper.toDTO,
      )
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionPlanListResponse,
        responseData,
        'PlanController.getPlans',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /plans/:id
   * Get subscription plan by ID
   */
  async getPlanById(
    request: Request<subscriptionCommon.PlanIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Getting subscription plan by ID', { id })

      const plan = await this.planService.getPlanById(id)

      const dto = SubscriptionPlanMapper.toDTO(plan)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionPlanDetailResponse,
        dto,
        'PlanController.getPlanById',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /plans/:id
   * Update subscription plan
   */
  async updatePlan(
    request: Request<
      subscriptionCommon.PlanIdParam,
      {},
      subscriptionPublic.UpdateSubscriptionPlanRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body

      logger.info('Updating subscription plan', { id })

      const plan = await this.planService.updatePlan(id, data)

      const dto = SubscriptionPlanMapper.toDTO(plan)
      const validatedResponse = validateResponse(
        subscriptionPublic.SubscriptionPlanDetailResponse,
        dto,
        'PlanController.updatePlan',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /plans/:id
   * Delete subscription plan
   */
  async deletePlan(
    request: Request<subscriptionCommon.PlanIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Deleting subscription plan', { id })

      await this.planService.deletePlan(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /plans/sync
   * Sync plans with Stripe
   */
  async syncPlans(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      logger.info('Syncing plans with Stripe')

      await this.planService.syncWithStripe()

      const responseData = { message: 'Plans synced successfully' }
      const validatedResponse = validateResponse(
        subscriptionPublic.PlanSyncResponse,
        responseData,
        'PlanController.syncPlans',
      )

      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
