import type { BusinessSearchParams } from '@business/types/search.js'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { type BusinessDomain, BusinessMapper } from '@pika/sdk'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import { Prisma, type PrismaClient } from '@prisma/client'

export interface IBusinessRepository {
  findAll(
    params: BusinessSearchParams,
  ): Promise<PaginatedResult<BusinessDomain>>
  findById(
    id: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain | null>
  findByUserId(
    userId: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain | null>
  create(data: CreateBusinessData): Promise<BusinessDomain>
  update(id: string, data: UpdateBusinessData): Promise<BusinessDomain>
  delete(id: string): Promise<void>
}

export interface CreateBusinessData {
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string
  categoryId: string
  verified?: boolean
  active?: boolean
  avgRating?: number
}

export interface UpdateBusinessData {
  businessNameKey?: string
  businessDescriptionKey?: string | null
  categoryId?: string
  verified?: boolean
  active?: boolean
  avgRating?: number
}

/**
 * Business repository implementation using Prisma
 * Follows the pattern from the old provider service but adapted to:
 * - Use BusinessDomain from SDK instead of complex entity classes
 * - Use translation keys instead of multilingual JSONB queries
 * - Include proper caching with Redis
 * - Follow the repository interface pattern established in the new architecture
 */
export class BusinessRepository implements IBusinessRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(
    params: BusinessSearchParams,
  ): Prisma.BusinessWhereInput {
    const where: Prisma.BusinessWhereInput = {}

    // Only include deleted filter if not explicitly requested by admin
    if (!params.includeDeleted) {
      where.deletedAt = null
    }

    // Filter by user ID
    if (params.userId) {
      where.userId = params.userId
    }

    // Filter by category ID
    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    // Filter by verification status
    if (params.verified !== undefined) {
      where.verified = params.verified
    }

    // Filter by active status
    if (params.active !== undefined) {
      where.active = params.active
    }

    // Search by business name using translation keys (simplified search)
    if (params.search) {
      where.OR = [
        { businessNameKey: { contains: params.search, mode: 'insensitive' } },
        {
          businessDescriptionKey: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Filter by rating range
    if (params.minRating !== undefined || params.maxRating !== undefined) {
      where.avgRating = {}
      if (params.minRating !== undefined) {
        where.avgRating.gte = params.minRating
      }
      if (params.maxRating !== undefined) {
        where.avgRating.lte = params.maxRating
      }
    }

    return where
  }

  /**
   * Builds the ORDER BY clause from query parameters
   */
  private buildOrderByClause(
    params: BusinessSearchParams,
  ): Prisma.BusinessOrderByWithRelationInput {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = params

    switch (sortBy) {
      case 'businessName':
        return { businessNameKey: sortOrder }
      case 'avgRating':
        return { avgRating: sortOrder }
      case 'verified':
        return { verified: sortOrder }
      case 'active':
        return { active: sortOrder }
      case 'updatedAt':
        return { updatedAt: sortOrder }
      case 'createdAt':
      default:
        return { createdAt: sortOrder }
    }
  }

  /**
   * Builds include clause based on ParsedIncludes
   */
  private buildIncludeClause(
    includes?: ParsedIncludes,
  ): Prisma.BusinessInclude {
    const include: Prisma.BusinessInclude = {}

    if (includes?.user) {
      include.user = {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          status: true,
          avatarUrl: true,
          emailVerified: true,
          phoneVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }
    }

    if (includes?.category) {
      include.category = {
        select: {
          id: true,
          slug: true,
          nameKey: true,
          descriptionKey: true,
          isActive: true,
          createdBy: true,
          updatedBy: true,
          icon: true,
          parentId: true,
          sortOrder: true,
          level: true,
          path: true,
          createdAt: true,
          updatedAt: true,
        },
      }
    }

    return include
  }

  /**
   * Retrieve all businesses matching the provided search criteria
   */
  async findAll(
    params: BusinessSearchParams,
  ): Promise<PaginatedResult<BusinessDomain>> {
    try {
      const { page = 1, limit = PAGINATION_DEFAULT_LIMIT } = params
      const skip = (page - 1) * limit

      // Build WHERE and ORDER BY clauses
      const where = this.buildWhereClause(params)
      const orderBy = this.buildOrderByClause(params)
      const include = this.buildIncludeClause(params.parsedIncludes)

      // Execute count and find queries in parallel
      const [totalCount, businesses] = await Promise.all([
        this.prisma.business.count({ where }),
        this.prisma.business.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include,
        }),
      ])

      // Map to domain entities using BusinessMapper
      const domainBusinesses = businesses.map((business) =>
        BusinessMapper.fromDocument({
          ...business,
          avgRating: business.avgRating.toNumber(),
        }),
      )

      const totalPages = Math.ceil(totalCount / limit)

      return {
        data: domainBusinesses,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      // Use comprehensive error handling following the established pattern
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Businesses', 'query', {
            source: 'BusinessRepository.findAll',
            metadata: { params },
          })
        }
      }

      logger.error('Error fetching businesses:', error)
      throw ErrorFactory.databaseError(
        'findAll',
        'Failed to fetch businesses from database',
        error,
        {
          source: 'BusinessRepository.findAll',
          severity: ErrorSeverity.ERROR,
          metadata: { params },
        },
      )
    }
  }

  /**
   * Retrieve a single business by its unique identifier
   */
  async findById(
    id: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain | null> {
    try {
      // Try to get from cache first
      const cacheKey = `business:${id}`

      if (this.cacheService) {
        const cached = await this.cacheService.get<string>(cacheKey)

        if (cached) {
          logger.debug(`Cache hit for business ${id}`)

          const cachedData = JSON.parse(cached)

          return cachedData as BusinessDomain
        }
      }

      const include = this.buildIncludeClause(includes)

      const business = await this.prisma.business.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include,
      })

      if (!business) {
        return null
      }

      const domainBusiness = BusinessMapper.fromDocument({
        ...business,
        avgRating: business.avgRating.toNumber(),
      })

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(domainBusiness),
          REDIS_DEFAULT_TTL,
        )
      }

      return domainBusiness
    } catch (error) {
      logger.error(`Error fetching business ${id}:`, error)

      throw ErrorFactory.databaseError(
        'findById',
        'Failed to fetch business from database',
        error,
        {
          source: 'BusinessRepository.findById',
          severity: ErrorSeverity.ERROR,
          metadata: { businessId: id },
        },
      )
    }
  }

  /**
   * Retrieve a business by user ID
   */
  async findByUserId(
    userId: string,
    includes?: ParsedIncludes,
  ): Promise<BusinessDomain | null> {
    try {
      // Try to get from cache first
      const cacheKey = `business:user:${userId}`

      if (this.cacheService) {
        const cached = await this.cacheService.get<string>(cacheKey)

        if (cached) {
          logger.debug(`Cache hit for business by user ${userId}`)

          const cachedData = JSON.parse(cached)

          return cachedData as BusinessDomain
        }
      }

      const include = this.buildIncludeClause(includes)

      const business = await this.prisma.business.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        include,
      })

      if (!business) {
        return null
      }

      const domainBusiness = BusinessMapper.fromDocument({
        ...business,
        avgRating: business.avgRating.toNumber(),
      })

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(domainBusiness),
          REDIS_DEFAULT_TTL,
        )
      }

      return domainBusiness
    } catch (error) {
      logger.error(`Error fetching business by user ${userId}:`, error)

      throw ErrorFactory.databaseError(
        'findByUserId',
        'Failed to fetch business from database',
        error,
        {
          source: 'BusinessRepository.findByUserId',
          severity: ErrorSeverity.ERROR,
          metadata: { userId },
        },
      )
    }
  }

  /**
   * Create a new business
   */
  async create(data: CreateBusinessData): Promise<BusinessDomain> {
    try {
      const business = await this.prisma.business.create({
        data: {
          userId: data.userId,
          businessNameKey: data.businessNameKey,
          businessDescriptionKey: data.businessDescriptionKey,
          categoryId: data.categoryId,
          verified: data.verified ?? false,
          active: data.active ?? true,
          avgRating: data.avgRating ?? 0,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
              status: true,
              avatarUrl: true,
              emailVerified: true,
              phoneVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          category: {
            select: {
              id: true,
              slug: true,
              nameKey: true,
              descriptionKey: true,
              icon: true,
              parentId: true,
              isActive: true,
              sortOrder: true,
              level: true,
              path: true,
              createdBy: true,
              updatedBy: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })

      const domainBusiness = BusinessMapper.fromDocument({
        ...business,
        avgRating: business.avgRating.toNumber(),
      })

      // Cache the new business
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.set(
            `business:${business.id}`,
            JSON.stringify(domainBusiness),
            REDIS_DEFAULT_TTL,
          ),
          this.cacheService.set(
            `business:user:${business.userId}`,
            JSON.stringify(domainBusiness),
            REDIS_DEFAULT_TTL,
          ),
        ])
      }

      return domainBusiness
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'Business',
            'Business already exists for this user',
            {
              source: 'BusinessRepository.create',
              metadata: { userId: data.userId },
            },
          )
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.badRequest('Invalid user ID or category ID', {
            source: 'BusinessRepository.create',
            metadata: { userId: data.userId, categoryId: data.categoryId },
          })
        }
      }

      logger.error('Error creating business:', error)
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create business in database',
        error,
        {
          source: 'BusinessRepository.create',
          severity: ErrorSeverity.ERROR,
          metadata: { data },
        },
      )
    }
  }

  /**
   * Update an existing business
   */
  async update(id: string, data: UpdateBusinessData): Promise<BusinessDomain> {
    try {
      const business = await this.prisma.business.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
              status: true,
              avatarUrl: true,
              emailVerified: true,
              phoneVerified: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          category: {
            select: {
              id: true,
              slug: true,
              nameKey: true,
              descriptionKey: true,
              icon: true,
              parentId: true,
              isActive: true,
              sortOrder: true,
              level: true,
              path: true,
              createdBy: true,
              updatedBy: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      })

      const domainBusiness = BusinessMapper.fromDocument({
        ...business,
        avgRating: business.avgRating.toNumber(),
      })

      // Update cache
      if (this.cacheService) {
        await Promise.all([
          this.cacheService.set(
            `business:${business.id}`,
            JSON.stringify(domainBusiness),
            REDIS_DEFAULT_TTL,
          ),
          this.cacheService.set(
            `business:user:${business.userId}`,
            JSON.stringify(domainBusiness),
            REDIS_DEFAULT_TTL,
          ),
        ])
      }

      return domainBusiness
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Business', id, {
            source: 'BusinessRepository.update',
          })
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.badRequest('Invalid category ID', {
            source: 'BusinessRepository.update',
            metadata: { categoryId: data.categoryId },
          })
        }
      }

      logger.error(`Error updating business ${id}:`, error)
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update business in database',
        error,
        {
          source: 'BusinessRepository.update',
          severity: ErrorSeverity.ERROR,
          metadata: { businessId: id, data },
        },
      )
    }
  }

  /**
   * Soft delete a business
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.business.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Remove from cache
      if (this.cacheService) {
        // We need to get the business first to know the userId for cache invalidation
        const business = await this.prisma.business.findUnique({
          where: { id },
          select: { userId: true },
        })

        if (business) {
          await Promise.all([
            this.cacheService.del(`business:${id}`),
            this.cacheService.del(`business:user:${business.userId}`),
          ])
        }
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Business', id, {
            source: 'BusinessRepository.delete',
          })
        }
      }

      logger.error(`Error deleting business ${id}:`, error)
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete business from database',
        error,
        {
          source: 'BusinessRepository.delete',
          severity: ErrorSeverity.ERROR,
          metadata: { businessId: id },
        },
      )
    }
  }
}
