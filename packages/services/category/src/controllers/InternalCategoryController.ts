import { CategoryMapper } from '@category/mappers/CategoryMapper.js'
import type { ICategoryService } from '@category/types/interfaces.js'
import { categoryCommon, categoryInternal } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles internal category operations for service-to-service communication
 */
export class InternalCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.getCategoriesByIds = this.getCategoriesByIds.bind(this)
    this.validateCategories = this.validateCategories.bind(this)
    this.getActiveCategoriesOnly = this.getActiveCategoriesOnly.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
  }

  /**
   * GET /internal/categories/:id
   * Get category by ID (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:category',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryById(
    req: Request<categoryCommon.CategoryIdParam>,
    res: Response<categoryInternal.InternalCategoryData>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const category = await this.categoryService.getCategoryById(id)

      // Return minimal data for internal use
      const response = CategoryMapper.toInternalDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryInternal.InternalCategoryData,
        response,
        'InternalCategoryController.getCategoryById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/categories/bulk
   * Get multiple categories by IDs (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:bulk',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoriesByIds(
    req: Request<{}, {}, categoryInternal.BulkCategoryRequest>,
    res: Response<categoryInternal.BulkCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      const result = await this.categoryService.getCategoriesByIds(categoryIds)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, CategoryMapper.toInternalDTO)
      const validatedResponse = validateResponse(
        categoryInternal.BulkCategoryResponse,
        response,
        'InternalCategoryController.getCategoriesByIds',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/categories/validate
   * Validate category IDs exist and are active (internal service use)
   */
  async validateCategories(
    req: Request<{}, {}, categoryInternal.ValidateCategoryRequest>,
    res: Response<categoryInternal.ValidateCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      const validationResults: categoryInternal.CategoryValidationResult[] =
        await Promise.all(
          categoryIds.map(
            async (
              categoryId,
            ): Promise<categoryInternal.CategoryValidationResult> => {
              try {
                const category =
                  await this.categoryService.getCategoryById(categoryId)

                return {
                  categoryId,
                  exists: true,
                  isActive: category.isActive,
                  valid: category.isActive,
                }
              } catch {
                return {
                  categoryId,
                  exists: false,
                  isActive: false,
                  valid: false,
                }
              }
            },
          ),
        )

      const allValid = validationResults.every((result) => result.valid)

      // Create response
      const response = {
        valid: allValid,
        results: validationResults,
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryInternal.ValidateCategoryResponse,
        response,
        'InternalCategoryController.validateCategories',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories/active
   * Get all active categories (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:active',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getActiveCategoriesOnly(
    req: Request,
    res: Response<categoryInternal.InternalCategoryListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = {
        isActive: true,
        page: 1,
        limit: 1000, // High limit for internal use
        sortBy: 'sortOrder' as const,
        sortOrder: 'asc' as const,
      }

      const result = await this.categoryService.getAllCategories(params)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, CategoryMapper.toInternalDTO)
      const validatedResponse = validateResponse(
        categoryInternal.InternalCategoryListResponse,
        response,
        'InternalCategoryController.getActiveCategoriesOnly',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories
   * Get all categories (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllCategories(
    req: Request,
    res: Response<categoryInternal.InternalCategoryListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<categoryInternal.InternalCategoryQueryParams>(req)

      const params = {
        isActive: query.isActive,
        page: 1,
        limit: 100, // Max limit allowed by schema
        sortBy: 'sortOrder' as const,
        sortOrder: 'asc' as const,
      }

      const result = await this.categoryService.getAllCategories(params)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, CategoryMapper.toInternalDTO)
      const validatedResponse = validateResponse(
        categoryInternal.InternalCategoryListResponse,
        response,
        'InternalCategoryController.getAllCategories',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories/hierarchy
   * Get category hierarchy (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:hierarchy',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryHierarchy(
    req: Request,
    res: Response<categoryInternal.InternalCategoryHierarchyResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categories = await this.categoryService.getCategoryHierarchy()

      // Transform to DTOs
      const response = {
        data: categories.map((category) =>
          CategoryMapper.toInternalDTO(category),
        ),
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryInternal.InternalCategoryHierarchyResponse,
        response,
        'InternalCategoryController.getCategoryHierarchy',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
