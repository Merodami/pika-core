import type { ICacheService } from '@pika/redis'
import type { BookDistributionDomain } from '@pika/sdk'
import { BookDistributionMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import { toPrismaInclude } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

export interface BusinessDistributionStats {
  businessName: string
  totalDistributions: number
  totalRequested: number
  totalShipped: number
  statusBreakdown: Record<string, number>
}

/**
 * Book distribution repository interface
 */
export interface IBookDistributionRepository {
  create(data: CreateBookDistributionInput): Promise<BookDistributionDomain>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain | null>
  findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain[]>
  findAll(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistributionDomain>>
  update(
    id: string,
    data: UpdateBookDistributionInput,
  ): Promise<BookDistributionDomain>
  delete(id: string): Promise<void>
  findByBusiness(
    businessId: string,
    locationId?: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain[]>
  updateStatus(
    id: string,
    status: string,
    updatedBy: string,
  ): Promise<BookDistributionDomain>
  markAsShipped(
    id: string,
    trackingNumber: string,
    carrier: string,
    updatedBy: string,
  ): Promise<BookDistributionDomain>
  deleteByBookId(bookId: string): Promise<void>
  getDistributionStats(bookId: string): Promise<DistributionStatsResult>
  markAsDelivered(
    id: string,
    deliveredBy: string,
  ): Promise<BookDistributionDomain>
  getBusinessStats(): Promise<BusinessDistributionStats[]>
}

/**
 * Input types for book distribution operations
 */
export interface CreateBookDistributionInput {
  bookId: string
  businessId: string
  businessName: string
  locationId?: string
  locationName?: string
  quantity: number
  distributionType: string // 'initial', 'reorder', 'replacement'
  contactName: string
  contactEmail?: string
  contactPhone?: string
  deliveryAddress?: string
  notes?: string
  metadata?: Record<string, any>
  createdBy: string
}

export interface UpdateBookDistributionInput {
  businessId?: string
  businessName?: string
  locationId?: string
  locationName?: string
  quantity?: number
  distributionType?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  deliveryAddress?: string
  status?: string
  shippedAt?: Date
  deliveredAt?: Date
  trackingNumber?: string
  shippingCarrier?: string
  notes?: string
  metadata?: Record<string, any>
  updatedBy?: string
}

export interface BookDistributionSearchParams {
  page?: number
  limit?: number
  bookId?: string
  businessId?: string
  locationId?: string
  status?: string
  distributionType?: string
  startDate?: Date
  endDate?: Date
  createdBy?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  parsedIncludes?: ParsedIncludes
}

export interface DistributionStatsResult {
  totalDistributions: number
  totalQuantity: number
  statusBreakdown: {
    pending: number
    shipped: number
    delivered: number
    cancelled: number
  }
  quantityByStatus: {
    pending: number
    shipped: number
    delivered: number
    cancelled: number
  }
  distributionsByBusiness: Record<string, number>
  distributionsByType: Record<string, number>
}

/**
 * Book distribution repository implementation
 */
export class BookDistributionRepository implements IBookDistributionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Create a new book distribution
   */
  async create(
    data: CreateBookDistributionInput,
  ): Promise<BookDistributionDomain> {
    try {
      logger.info('Creating book distribution', {
        bookId: data.bookId,
        businessId: data.businessId,
        locationId: data.locationId,
        quantity: data.quantity,
      })

      const distribution = await this.prisma.bookDistribution.create({
        data: {
          bookId: data.bookId,
          businessId: data.businessId,
          businessName: data.businessName,
          locationId: data.locationId,
          locationName: data.locationName,
          quantity: data.quantity,
          distributionType: data.distributionType,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          deliveryAddress: data.deliveryAddress,
          status: 'pending',
          notes: data.notes,
          metadata: data.metadata || {},
          createdBy: data.createdBy,
          updatedBy: data.createdBy,
        },
      })

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw ErrorFactory.badRequest('Invalid book ID or business ID')
        }
      }
      throw ErrorFactory.databaseError('create', 'BookDistribution', error)
    }
  }

  /**
   * Find book distribution by ID with optional relations
   */
  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain | null> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.BookDistributionInclude)
          : undefined

      const distribution = await this.prisma.bookDistribution.findUnique({
        where: { id },
        include,
      })

      if (!distribution) {
        return null
      }

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'BookDistribution', error)
    }
  }

  /**
   * Find all distributions for a specific book with optional relations
   */
  async findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain[]> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.BookDistributionInclude)
          : undefined

      const distributions = await this.prisma.bookDistribution.findMany({
        where: { bookId },
        orderBy: { createdAt: 'desc' },
        include,
      })

      return distributions.map(BookDistributionMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByBookId',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Find all book distributions with pagination, filtering, and optional relations
   */
  async findAll(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistributionDomain>> {
    try {
      const {
        page = 1,
        limit = 20,
        bookId,
        businessId,
        locationId,
        status,
        distributionType,
        startDate,
        endDate,
        createdBy,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const skip = (page - 1) * limit

      // Build include clause
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.BookDistributionInclude)
          : undefined

      // Build where clause
      const where: Prisma.BookDistributionWhereInput = {}

      if (bookId) {
        where.bookId = bookId
      }

      if (businessId) {
        where.businessId = businessId
      }

      if (locationId) {
        where.locationId = locationId
      }

      if (status) {
        where.status = status
      }

      if (distributionType) {
        where.distributionType = distributionType
      }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) {
          where.createdAt.gte = startDate
        }
        if (endDate) {
          where.createdAt.lte = endDate
        }
      }

      if (createdBy) {
        where.createdBy = createdBy
      }

      // Build order by clause
      const orderBy: Prisma.BookDistributionOrderByWithRelationInput = {}

      if (sortBy === 'businessName') {
        orderBy.businessName = sortOrder
      } else if (sortBy === 'quantity') {
        orderBy.quantity = sortOrder
      } else if (sortBy === 'status') {
        orderBy.status = sortOrder
      } else if (sortBy === 'shippedAt') {
        orderBy.shippedAt = sortOrder
      } else if (sortBy === 'deliveredAt') {
        orderBy.deliveredAt = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }

      const [distributions, total] = await Promise.all([
        this.prisma.bookDistribution.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include,
        }),
        this.prisma.bookDistribution.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: distributions.map(BookDistributionMapper.fromDocument),
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
      throw ErrorFactory.databaseError('findAll', 'BookDistribution', error)
    }
  }

  /**
   * Update book distribution
   */
  async update(
    id: string,
    data: UpdateBookDistributionInput,
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.prisma.bookDistribution.update({
        where: { id },
        data: {
          businessId: data.businessId,
          businessName: data.businessName,
          locationId: data.locationId,
          locationName: data.locationName,
          quantity: data.quantity,
          distributionType: data.distributionType,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          deliveryAddress: data.deliveryAddress,
          status: data.status,
          shippedAt: data.shippedAt,
          deliveredAt: data.deliveredAt,
          trackingNumber: data.trackingNumber,
          shippingCarrier: data.shippingCarrier,
          notes: data.notes,
          metadata: data.metadata,
          updatedBy: data.updatedBy,
        },
      })

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('BookDistribution', id)
        }
      }
      throw ErrorFactory.databaseError('update', 'BookDistribution', error)
    }
  }

  /**
   * Delete book distribution
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.bookDistribution.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('BookDistribution', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'BookDistribution', error)
    }
  }

  /**
   * Find distributions by business and optional location
   */
  async findByBusiness(
    businessId: string,
    locationId?: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<BookDistributionDomain[]> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.BookDistributionInclude)
          : undefined

      const where: Prisma.BookDistributionWhereInput = { businessId }

      if (locationId) {
        where.locationId = locationId
      }

      const distributions = await this.prisma.bookDistribution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      })

      return distributions.map(BookDistributionMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByBusiness',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Update distribution status
   */
  async updateStatus(
    id: string,
    status: string,
    updatedBy: string,
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.prisma.bookDistribution.update({
        where: { id },
        data: {
          status,
          updatedBy,
        },
      })

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('BookDistribution', id)
        }
      }
      throw ErrorFactory.databaseError(
        'updateStatus',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Mark distribution as shipped
   */
  async markAsShipped(
    id: string,
    trackingNumber: string,
    carrier: string,
    updatedBy: string,
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.prisma.bookDistribution.update({
        where: { id },
        data: {
          status: 'shipped',
          shippedAt: new Date(),
          trackingNumber,
          shippingCarrier: carrier,
          updatedBy,
        },
      })

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('BookDistribution', id)
        }
      }
      throw ErrorFactory.databaseError(
        'markAsShipped',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Delete all distributions for a specific book
   */
  async deleteByBookId(bookId: string): Promise<void> {
    try {
      await this.prisma.bookDistribution.deleteMany({
        where: { bookId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'deleteByBookId',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Get distribution statistics for a specific book
   */
  async getDistributionStats(bookId: string): Promise<DistributionStatsResult> {
    try {
      const [
        totalDistributions,
        statusCounts,
        totalQuantityResult,
        quantityByStatus,
        distributionsByBusiness,
        distributionsByType,
      ] = await Promise.all([
        this.prisma.bookDistribution.count({
          where: { bookId },
        }),
        this.prisma.bookDistribution.groupBy({
          by: ['status'],
          where: { bookId },
          _count: { _all: true },
        }),
        this.prisma.bookDistribution.aggregate({
          where: { bookId },
          _sum: { quantity: true },
        }),
        this.prisma.bookDistribution.groupBy({
          by: ['status'],
          where: { bookId },
          _sum: { quantity: true },
        }),
        this.prisma.bookDistribution.groupBy({
          by: ['businessId'],
          where: { bookId },
          _count: { _all: true },
        }),
        this.prisma.bookDistribution.groupBy({
          by: ['distributionType'],
          where: { bookId },
          _count: { _all: true },
        }),
      ])

      const totalQuantity = totalQuantityResult._sum.quantity || 0

      // Build status breakdown
      const statusBreakdown = {
        pending: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }

      statusCounts.forEach((item) => {
        if (item.status in statusBreakdown) {
          statusBreakdown[item.status as keyof typeof statusBreakdown] =
            item._count._all
        }
      })

      // Build quantity by status
      const quantityByStatusMap = {
        pending: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }

      quantityByStatus.forEach((item) => {
        if (item.status in quantityByStatusMap) {
          quantityByStatusMap[item.status as keyof typeof quantityByStatusMap] =
            item._sum.quantity || 0
        }
      })

      // Build distributions by business
      const distributionsByBusinessMap = distributionsByBusiness.reduce(
        (acc, item) => {
          acc[item.businessId] = item._count._all

          return acc
        },
        {} as Record<string, number>,
      )

      // Build distributions by type
      const distributionsByTypeMap = distributionsByType.reduce(
        (acc, item) => {
          acc[item.distributionType] = item._count._all

          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalDistributions,
        totalQuantity,
        statusBreakdown,
        quantityByStatus: quantityByStatusMap,
        distributionsByBusiness: distributionsByBusinessMap,
        distributionsByType: distributionsByTypeMap,
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getDistributionStats',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Mark distribution as delivered
   */
  async markAsDelivered(
    id: string,
    deliveredBy: string,
  ): Promise<BookDistributionDomain> {
    try {
      const distribution = await this.prisma.bookDistribution.update({
        where: { id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
          updatedBy: deliveredBy,
        },
      })

      return BookDistributionMapper.fromDocument(distribution)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('BookDistribution', id)
        }
      }
      throw ErrorFactory.databaseError(
        'markAsDelivered',
        'BookDistribution',
        error,
      )
    }
  }

  /**
   * Get business distribution statistics
   */
  async getBusinessStats(): Promise<BusinessDistributionStats[]> {
    try {
      const stats = await this.prisma.bookDistribution.groupBy({
        by: ['businessId', 'businessName'],
        _count: {
          _all: true,
        },
        _sum: {
          quantity: true,
        },
      })

      const businessStats = await Promise.all(
        stats.map(async (stat) => {
          // Get status breakdown for this business
          const statusBreakdown = await this.prisma.bookDistribution.groupBy({
            by: ['status'],
            where: {
              businessId: stat.businessId,
            },
            _count: {
              _all: true,
            },
          })

          const statusMap = statusBreakdown.reduce(
            (acc, item) => {
              acc[item.status] = item._count._all

              return acc
            },
            {} as Record<string, number>,
          )

          return {
            businessName: stat.businessName,
            totalDistributions: stat._count._all,
            totalRequested: stat._sum.quantity || 0,
            totalShipped: 0, // TODO: Calculate shipped quantity when we have that data
            statusBreakdown: statusMap,
          }
        }),
      )

      return businessStats
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getBusinessStats',
        'BookDistribution',
        error,
      )
    }
  }
}
