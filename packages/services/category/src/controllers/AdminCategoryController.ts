import { CategoryMapper } from '@category/mappers/CategoryMapper.js'
import type { ICategoryService } from '@category/types/interfaces.js'
import { categoryAdmin, categoryCommon } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin category management operations
 */
export class AdminCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.updateCategory = this.updateCategory.bind(this)
    this.deleteCategory = this.deleteCategory.bind(this)
    this.toggleCategoryStatus = this.toggleCategoryStatus.bind(this)
    this.moveCategory = this.moveCategory.bind(this)
    this.updateCategorySortOrder = this.updateCategorySortOrder.bind(this)
    this.bulkDeleteCategories = this.bulkDeleteCategories.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
  }

  /**
   * GET /admin/categories
   * Get all categories with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:categories',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllCategories(
    req: Request,
    res: Response<categoryAdmin.AdminCategoryListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<categoryAdmin.AdminCategoryQueryParams>(req)

      // Map API query to service params
      const params = {
        search: query.search,
        parentId: query.parentId,
        isActive: query.isActive,
        createdBy: query.createdBy,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: (query.sortBy as categoryCommon.CategorySortBy) || 'sortOrder',
        sortOrder: query.sortOrder,
      }

      const result = await this.categoryService.getAllCategories(params)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, CategoryMapper.toDTO)
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryListResponse,
        response,
        'AdminCategoryController.getAllCategories',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/categories/:id
   * Get category by ID for admin
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:category',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryById(
    req: Request<categoryCommon.CategoryIdParam>,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const category = await this.categoryService.getCategoryById(id)

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.getCategoryById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories
   * Create new category
   */
  async createCategory(
    req: Request<{}, {}, categoryAdmin.CreateCategoryRequest>,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const data = req.body

      const categoryData = {
        ...data,
        createdBy: context.userId,
      }

      const category = await this.categoryService.createCategory(categoryData)

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.createCategory',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/categories/:id
   * Update category information
   */
  async updateCategory(
    req: Request<
      categoryCommon.CategoryIdParam,
      {},
      categoryAdmin.UpdateCategoryRequest
    >,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { id } = req.params
      const data = req.body

      const updateData = {
        ...data,
        updatedBy: context.userId,
      }

      const category = await this.categoryService.updateCategory(id, updateData)

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.updateCategory',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/categories/:id
   * Delete category
   */
  async deleteCategory(
    req: Request<categoryCommon.CategoryIdParam>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.categoryService.deleteCategory(id)

      // No content response - no validation needed
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/toggle-status
   * Toggle category active/inactive status
   */
  async toggleCategoryStatus(
    req: Request<categoryCommon.CategoryIdParam>,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const category = await this.categoryService.toggleCategoryStatus(id)

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.toggleCategoryStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/move
   * Move category to different parent
   */
  async moveCategory(
    req: Request<
      categoryCommon.CategoryIdParam,
      {},
      categoryAdmin.MoveCategoryRequest
    >,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { parentId } = req.body

      const category = await this.categoryService.moveCategory(
        id,
        parentId || null,
      )

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.moveCategory',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/sort-order
   * Update category sort order
   */
  async updateCategorySortOrder(
    req: Request<
      categoryCommon.CategoryIdParam,
      {},
      categoryAdmin.UpdateCategorySortOrderRequest
    >,
    res: Response<categoryAdmin.AdminCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { sortOrder } = req.body

      const category = await this.categoryService.updateCategorySortOrder(
        id,
        sortOrder,
      )

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryResponse,
        response,
        'AdminCategoryController.updateCategorySortOrder',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/bulk-delete
   * Bulk delete categories
   */
  async bulkDeleteCategories(
    req: Request<{}, {}, categoryAdmin.BulkDeleteCategoriesRequest>,
    res: Response<categoryAdmin.BulkCategoryOperationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      // Delete categories one by one (repository handles children check)
      for (const categoryId of categoryIds) {
        await this.categoryService.deleteCategory(categoryId)
      }

      // Create response
      const response = {
        message: `Successfully deleted ${categoryIds.length} categories`,
        deletedCount: categoryIds.length,
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.BulkCategoryOperationResponse,
        response,
        'AdminCategoryController.bulkDeleteCategories',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/categories/hierarchy
   * Get category hierarchy for admin management
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:category:hierarchy',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryHierarchy(
    req: Request,
    res: Response<categoryAdmin.AdminCategoryTreeResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<{ rootId?: string }>(req)

      const categories = await this.categoryService.getCategoryHierarchy(
        query.rootId,
      )

      // Transform to DTOs
      const response = {
        data: categories.map((category) => CategoryMapper.toDTO(category)),
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryAdmin.AdminCategoryTreeResponse,
        response,
        'AdminCategoryController.getCategoryHierarchy',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
