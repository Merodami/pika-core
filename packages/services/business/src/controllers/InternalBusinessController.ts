import type { IBusinessService } from '@business/services/BusinessService.js'
import { businessCommon, businessInternal, shared } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  validateResponse,
} from '@pika/http'
import { BusinessMapper } from '@pika/sdk'
import { parseIncludeParam } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles internal business operations for service-to-service communication
 */
export class InternalBusinessController {
  constructor(private readonly businessService: IBusinessService) {
    // Bind methods to preserve 'this' context
    this.getBusinessById = this.getBusinessById.bind(this)
    this.getBusinessByUserId = this.getBusinessByUserId.bind(this)
    this.getBusinessesByIds = this.getBusinessesByIds.bind(this)
    this.getBusinessesByCategory = this.getBusinessesByCategory.bind(this)
  }

  /**
   * GET /internal/businesses/:business_id
   * Get business by ID for internal services
   */
  async getBusinessById(
    req: Request<businessCommon.BusinessIdParam>,
    res: Response<businessInternal.InternalBusinessData>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query = getValidatedQuery<businessInternal.GetBusinessRequest>(req)

      const includes = parseIncludeParam(query.include, ['user', 'category'])

      const business = await this.businessService.getBusinessById(
        businessId,
        includes,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessInternal.InternalBusinessData,
        response,
        'InternalBusinessController.getBusinessById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/businesses/user/:user_id
   * Get business by user ID for internal services
   */
  async getBusinessByUserId(
    req: Request<shared.UserIdParam>,
    res: Response<businessInternal.InternalBusinessData>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const query = getValidatedQuery<businessInternal.GetBusinessRequest>(req)

      const includes = parseIncludeParam(query.include, ['user', 'category'])

      const business = await this.businessService.getBusinessByUserId(
        userId,
        includes,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessInternal.InternalBusinessData,
        response,
        'InternalBusinessController.getBusinessByUserId',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/businesses/batch
   * Get multiple businesses by IDs
   */
  async getBusinessesByIds(
    req: Request<{}, {}, businessInternal.BulkBusinessRequest>,
    res: Response<businessInternal.BulkBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { businessIds, include } = req.body
      const includes = parseIncludeParam(include, ['user', 'category'])

      const businesses = await Promise.all(
        businessIds.map((id) =>
          this.businessService.getBusinessById(id, includes).catch(() => null),
        ),
      )

      // Filter out null values (businesses that don't exist)
      const validBusinesses = businesses.filter((b) => b !== null)

      // Transform to DTOs
      const response = {
        businesses: validBusinesses.map((business) =>
          BusinessMapper.toDTO(business!),
        ),
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessInternal.BulkBusinessResponse,
        response,
        'InternalBusinessController.getBusinessesByIds',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/businesses/category/:category_id
   * Get businesses by category for internal services
   */
  async getBusinessesByCategory(
    req: Request<shared.CategoryIdParam>,
    res: Response<businessInternal.GetBusinessesByCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: categoryId } = req.params
      const query =
        getValidatedQuery<businessInternal.GetBusinessesByCategoryRequest>(req)
      const includes = parseIncludeParam(query.include, ['user', 'category'])

      const result = await this.businessService.getAllBusinesses({
        categoryId,
        active: query.onlyActive,
        verified: query.onlyVerified,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy as
          | 'businessName'
          | 'avgRating'
          | 'verified'
          | 'active'
          | 'createdAt'
          | 'updatedAt'
          | undefined,
        sortOrder: query.sortOrder,
        parsedIncludes: includes,
      })

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, BusinessMapper.toDTO)
      const validatedResponse = validateResponse(
        businessInternal.GetBusinessesByCategoryResponse,
        response,
        'InternalBusinessController.getBusinessesByCategory',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
