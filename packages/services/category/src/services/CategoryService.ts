import type {
  Category,
  CategorySearchParams,
  CreateCategoryData,
  ICategoryRepository,
  ICategoryService,
  PaginatedResult,
  UpdateCategoryData,
} from '@category/types/interfaces.js'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'

export class CategoryService implements ICategoryService {
  constructor(
    private readonly repository: ICategoryRepository,
    private readonly cache: ICacheService,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:categories',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      return `${prefix}:${JSON.stringify(args[0])}`
    },
  })
  async getAllCategories(
    params: CategorySearchParams,
  ): Promise<PaginatedResult<Category>> {
    try {
      const result = await this.repository.findAll(params)

      return result
    } catch (error) {
      logger.error('Failed to get all categories', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:category',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      return `${prefix}:${args[0]}`
    },
  })
  async getCategoryById(id: string): Promise<Category> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid category ID format')
      }

      const category = await this.repository.findById(id)

      if (!category) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      return category
    } catch (error) {
      logger.error('Failed to get category by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:categories:bulk',
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const ids = args[0] as string[]

      return `${prefix}:${JSON.stringify(ids.sort())}`
    },
  })
  async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    try {
      // Validate all IDs are proper UUIDs
      const invalidIds = ids.filter((id) => !isUuidV4(id))

      if (invalidIds.length > 0) {
        throw ErrorFactory.badRequest(
          `Invalid category ID format: ${invalidIds.join(', ')}`,
        )
      }

      const result = await this.repository.findByIds(ids)

      return result
    } catch (error) {
      logger.error('Failed to get categories by ids', { error, ids })
      throw ErrorFactory.fromError(error)
    }
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      // Validate parent category exists if provided
      if (data.parentId) {
        const parentExists = await this.repository.exists(data.parentId)

        if (!parentExists) {
          throw ErrorFactory.businessRuleViolation(
            'Parent category not found',
            'Invalid parent category ID',
          )
        }
      }

      const category = await this.repository.create(data)

      // Invalidate cache
      await this.invalidateCache()

      return category
    } catch (error) {
      logger.error('Failed to create category', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    try {
      // Validate category exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      // Validate parent category exists if provided
      if (data.parentId) {
        const parentExists = await this.repository.exists(data.parentId)

        if (!parentExists) {
          throw ErrorFactory.businessRuleViolation(
            'Parent category not found',
            'Invalid parent category ID',
          )
        }

        // Prevent circular reference
        if (data.parentId === id) {
          throw ErrorFactory.businessRuleViolation(
            'Category cannot be its own parent',
            'Circular reference detected',
          )
        }
      }

      const category = await this.repository.update(id, data)

      // Invalidate cache
      await this.invalidateCache(id)

      return category
    } catch (error) {
      logger.error('Failed to update category', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      // Validate category exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      await this.repository.delete(id)

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Category deleted successfully', { id })
    } catch (error) {
      logger.error('Failed to delete category', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async toggleCategoryStatus(id: string): Promise<Category> {
    try {
      // Validate category exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      const category = await this.repository.update(id, {
        isActive: !existing.isActive,
      })

      // Invalidate cache
      await this.invalidateCache(id)

      return category
    } catch (error) {
      logger.error('Failed to toggle category status', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async moveCategory(
    id: string,
    newParentId: string | null,
  ): Promise<Category> {
    try {
      // Validate category exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      // Validate new parent exists if provided
      if (newParentId) {
        const parentExists = await this.repository.exists(newParentId)

        if (!parentExists) {
          throw ErrorFactory.businessRuleViolation(
            'New parent category not found',
            'Invalid parent category ID',
          )
        }

        // Prevent circular reference
        if (newParentId === id) {
          throw ErrorFactory.businessRuleViolation(
            'Category cannot be its own parent',
            'Circular reference detected',
          )
        }
      }

      const category = await this.repository.update(id, {
        parentId: newParentId || undefined,
      })

      // Invalidate cache
      await this.invalidateCache(id)

      return category
    } catch (error) {
      logger.error('Failed to move category', { error, id, newParentId })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateCategorySortOrder(
    id: string,
    sortOrder: number,
  ): Promise<Category> {
    try {
      // Validate category exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      const category = await this.repository.update(id, {
        sortOrder,
      })

      // Invalidate cache
      await this.invalidateCache(id)

      return category
    } catch (error) {
      logger.error('Failed to update category sort order', {
        error,
        id,
        sortOrder,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:category:hierarchy',
    keyGenerator: (rootId) => rootId || 'all',
  })
  async getCategoryHierarchy(rootId?: string): Promise<Category[]> {
    try {
      const categories = await this.repository.getHierarchy(rootId)

      return categories
    } catch (error) {
      logger.error('Failed to get category hierarchy', { error, rootId })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:category:path',
    keyGenerator: (id) => id,
  })
  async getCategoryPath(id: string): Promise<Category[]> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid category ID format')
      }

      const path = await this.repository.getPath(id)

      return path
    } catch (error) {
      logger.error('Failed to get category path', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async categoryExists(id: string): Promise<boolean> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        return false
      }

      return await this.repository.exists(id)
    } catch (error) {
      logger.error('Failed to check category existence', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  private async invalidateCache(categoryId?: string): Promise<void> {
    try {
      // Invalidate specific category cache if ID provided
      if (categoryId) {
        await this.cache.del(`service:category:${categoryId}`)
        await this.cache.del(`service:category:path:${categoryId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:categories:*')
      await this.cache.delPattern?.('service:category:hierarchy:*')
      await this.cache.delPattern?.('categories:*')
      await this.cache.delPattern?.('category:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}
