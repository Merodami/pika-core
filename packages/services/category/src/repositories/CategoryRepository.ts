import { CategoryMapper } from '@category/mappers/CategoryMapper.js'
import type {
  Category,
  CategorySearchParams,
  CreateCategoryData,
  ICategoryRepository,
  PaginatedResult,
  UpdateCategoryData,
} from '@category/types/interfaces.js'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { Prisma, PrismaClient } from '@prisma/client'

export class CategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(
    params: CategorySearchParams = {},
  ): Promise<PaginatedResult<Category>> {
    try {
      const {
        search,
        parentId,
        isActive,
        createdBy,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
      } = params

      const where: Prisma.CategoryWhereInput = {
        deletedAt: null, // Only return non-deleted categories
      }

      // Search in name/description translation keys
      if (search) {
        where.OR = [
          { nameKey: { contains: search, mode: 'insensitive' } },
          { descriptionKey: { contains: search, mode: 'insensitive' } },
        ]
      }

      // Filter by parent
      if (parentId !== undefined) {
        where.parentId = parentId
      }

      // Filter by active status
      if (isActive !== undefined) {
        where.isActive = isActive
      }

      // Filter by creator
      if (createdBy) {
        where.createdBy = createdBy
      }

      // Build order by clause
      const orderBy: Prisma.CategoryOrderByWithRelationInput = {}

      if (sortBy === 'name') {
        orderBy.nameKey = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'sortOrder') {
        orderBy.sortOrder = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder as 'asc' | 'desc'
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedAt = sortOrder as 'asc' | 'desc'
      }

      const skip = (page - 1) * limit

      // Get categories and total count
      const [categories, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.category.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: categories.map((category) =>
          CategoryMapper.fromDocument(
            CategoryMapper.fromPrismaCategory(category),
          ),
        ),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error in CategoryRepository.findAll:', error)
      throw ErrorFactory.databaseError(
        'findAll',
        'Failed to fetch categories',
        error,
      )
    }
  }

  async findById(id: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      })

      if (!category) {
        return null
      }

      return CategoryMapper.fromDocument(
        CategoryMapper.fromPrismaCategory(category),
      )
    } catch (error) {
      logger.error('Error in CategoryRepository.findById:', error)
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to fetch category',
        error,
      )
    }
  }

  async findByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        orderBy: { sortOrder: 'asc' },
      })

      const categoryDomains = categories.map((category) =>
        CategoryMapper.fromDocument(
          CategoryMapper.fromPrismaCategory(category),
        ),
      )

      // Build pagination structure for bounded operation
      return {
        data: categoryDomains,
        pagination: {
          page: 1,
          limit: ids.length,
          total: categoryDomains.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }
    } catch (error) {
      logger.error('Error in CategoryRepository.findByIds:', error)
      throw ErrorFactory.databaseError(
        'findByIds',
        'Failed to fetch categories',
        error,
      )
    }
  }

  async create(data: CreateCategoryData): Promise<Category> {
    try {
      // Generate slug from nameKey
      const slug = this.generateSlug(data.nameKey)

      // Calculate level and path
      let level = 1
      let path = ''

      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        })

        if (!parent) {
          throw ErrorFactory.resourceNotFound('Category', data.parentId!)
        }

        level = (parent.level || 1) + 1
        path = parent.path ? `${parent.path}.${parent.id}` : parent.id
      }

      const category = await this.prisma.category.create({
        data: {
          nameKey: data.nameKey,
          descriptionKey: data.descriptionKey,
          icon: data.icon,
          parentId: data.parentId,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
          createdBy: data.createdBy,
          slug,
          level,
          path,
        },
      })

      return CategoryMapper.fromDocument(
        CategoryMapper.fromPrismaCategory(category),
      )
    } catch (error) {
      logger.error('Error in CategoryRepository.create:', error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.uniqueConstraintViolation(
            'Category',
            'slug',
            data.nameKey || 'unknown',
          )
        }
      }
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create category',
        error,
      )
    }
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      }

      // Generate new slug if nameKey changed
      if (data.nameKey) {
        updateData.slug = this.generateSlug(data.nameKey)
      }

      // Recalculate level and path if parent changed
      if (data.parentId !== undefined) {
        if (data.parentId) {
          const parent = await this.prisma.category.findUnique({
            where: { id: data.parentId },
          })

          if (!parent) {
            throw ErrorFactory.resourceNotFound('Category', data.parentId)
          }

          updateData.level = (parent.level || 1) + 1
          updateData.path = parent.path
            ? `${parent.path}.${parent.id}`
            : parent.id
        } else {
          // Moving to root level
          updateData.level = 1
          updateData.path = ''
        }
      }

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      })

      return CategoryMapper.fromDocument(
        CategoryMapper.fromPrismaCategory(category),
      )
    } catch (error) {
      logger.error('Error in CategoryRepository.update:', error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.uniqueConstraintViolation(
            'Category',
            'slug',
            data.nameKey || 'unknown',
          )
        }
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Category', id)
        }
      }
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update category',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Check if category has children (only non-deleted ones)
      const childrenCount = await this.prisma.category.count({
        where: {
          parentId: id,
          deletedAt: null,
        },
      })

      if (childrenCount > 0) {
        throw ErrorFactory.businessRuleViolation(
          'category_has_children',
          'Cannot delete category with children',
        )
      }

      // TODO: Add dependency checking for related entities (providers, vouchers, etc.)
      // This would require checking if category is referenced by other entities

      // Soft delete by setting deletedAt timestamp
      await this.prisma.category.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error('Error in CategoryRepository.delete:', error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Category', id)
        }
      }
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete category',
        error,
      )
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: { id: true },
      })

      return !!category
    } catch (error) {
      logger.error('Error in CategoryRepository.exists:', error)
      throw ErrorFactory.databaseError(
        'exists',
        'Failed to check category existence',
        error,
      )
    }
  }

  async getHierarchy(rootId?: string): Promise<Category[]> {
    try {
      const where: Prisma.CategoryWhereInput = {}

      if (rootId) {
        // Get all categories under this root
        const rootCategory = await this.prisma.category.findUnique({
          where: { id: rootId },
        })

        if (!rootCategory) {
          throw ErrorFactory.resourceNotFound('Category', rootId)
        }

        where.OR = [
          { id: rootId },
          {
            path: {
              startsWith: rootCategory.path
                ? `${rootCategory.path}.${rootId}`
                : rootId,
            },
          },
        ]
      }

      const categories = await this.prisma.category.findMany({
        where,
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
      })

      const domainCategories = categories.map((category) =>
        CategoryMapper.fromDocument(
          CategoryMapper.fromPrismaCategory(category),
        ),
      )

      return CategoryMapper.buildHierarchy(domainCategories)
    } catch (error) {
      logger.error('Error in CategoryRepository.getHierarchy:', error)
      throw ErrorFactory.databaseError(
        'getHierarchy',
        'Failed to fetch category hierarchy',
        error,
      )
    }
  }

  async getPath(id: string): Promise<Category[]> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      })

      if (!category) {
        throw ErrorFactory.resourceNotFound('Category', id)
      }

      const pathIds = category.path ? category.path.split('.') : []

      pathIds.push(id)

      const categories = await this.prisma.category.findMany({
        where: { id: { in: pathIds } },
        orderBy: { level: 'asc' },
      })

      return categories.map((cat) =>
        CategoryMapper.fromDocument(CategoryMapper.fromPrismaCategory(cat)),
      )
    } catch (error) {
      logger.error('Error in CategoryRepository.getPath:', error)
      throw ErrorFactory.databaseError(
        'getPath',
        'Failed to fetch category path',
        error,
      )
    }
  }

  /**
   * Generate URL-friendly slug from name key
   */
  private generateSlug(nameKey: string): string {
    return nameKey
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
