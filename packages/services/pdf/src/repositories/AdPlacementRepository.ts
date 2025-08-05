import type { ICacheService } from '@pika/redis'
import type { AdPlacementDomain } from '@pika/sdk'
import { AdPlacementMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import { toPrismaInclude } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import type { AdSize, ContentType, PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

/**
 * Ad placement repository interface
 */
export interface IAdPlacementRepository {
  create(data: CreateAdPlacementInput): Promise<AdPlacementDomain>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain | null>
  findByPageId(
    pageId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain[]>
  findAll(
    params: AdPlacementSearchParams,
  ): Promise<PaginatedResult<AdPlacementDomain>>
  update(id: string, data: UpdateAdPlacementInput): Promise<AdPlacementDomain>
  delete(id: string): Promise<void>
  findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain[]>
  findByPosition(
    pageId: string,
    position: number,
  ): Promise<AdPlacementDomain | null>
  deleteByPageId(pageId: string): Promise<void>
  deleteByBookId(bookId: string): Promise<void>
  bulkUpdate(
    placementIds: string[],
    data: BulkUpdateAdPlacementInput,
  ): Promise<AdPlacementDomain[]>
  validatePlacementPosition(
    pageId: string,
    position: number,
    size: string,
    excludeId?: string,
  ): Promise<boolean>
  reorderPlacements(
    bookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void>
}

/**
 * Input types for ad placement operations
 */
export interface CreateAdPlacementInput {
  pageId: string
  contentType: ContentType
  position: number
  size: AdSize
  spacesUsed: number
  imageUrl?: string
  qrCodePayload?: string
  shortCode?: string
  title?: string
  description?: string
  metadata?: Record<string, any>
  createdBy: string
}

export interface UpdateAdPlacementInput {
  contentType?: ContentType
  position?: number
  size?: AdSize
  spacesUsed?: number
  imageUrl?: string
  qrCodePayload?: string
  shortCode?: string
  title?: string
  description?: string
  metadata?: Record<string, any>
  updatedBy?: string
}

export interface BulkUpdateAdPlacementInput {
  isActive?: boolean
  updatedBy: string
}

export interface ReorderPlacementData {
  id: string
  position: number
}

export interface AdPlacementSearchParams {
  page?: number
  limit?: number
  pageId?: string
  bookId?: string
  contentType?: ContentType
  position?: number
  size?: AdSize
  createdBy?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  parsedIncludes?: ParsedIncludes
}

/**
 * Ad placement repository implementation
 */
export class AdPlacementRepository implements IAdPlacementRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Create a new ad placement
   */
  async create(data: CreateAdPlacementInput): Promise<AdPlacementDomain> {
    try {
      logger.info('Creating ad placement', {
        pageId: data.pageId,
        position: data.position,
      })

      // Validate position availability before creating
      const isValidPosition = await this.validatePlacementPosition(
        data.pageId,
        data.position,
        data.size,
      )

      if (!isValidPosition) {
        throw ErrorFactory.resourceConflict(
          'AdPlacement',
          'Position is already occupied or conflicts with existing placements',
        )
      }

      const placement = await this.prisma.adPlacement.create({
        data: {
          pageId: data.pageId,
          contentType: data.contentType,
          position: data.position,
          size: data.size,
          spacesUsed: data.spacesUsed,
          imageUrl: data.imageUrl,
          qrCodePayload: data.qrCodePayload,
          shortCode: data.shortCode,
          title: data.title,
          description: data.description,
          metadata: data.metadata || {},
          createdBy: data.createdBy,
          updatedBy: data.createdBy,
        },
      })

      return AdPlacementMapper.fromDocument(placement)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'AdPlacement',
            'Position is already occupied on this page',
          )
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.badRequest('Invalid page ID')
        }
      }
      throw ErrorFactory.databaseError('create', 'AdPlacement', error)
    }
  }

  /**
   * Find ad placement by ID with optional relations
   */
  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain | null> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.AdPlacementInclude)
          : undefined

      const placement = await this.prisma.adPlacement.findUnique({
        where: { id },
        include,
      })

      if (!placement) {
        return null
      }

      return AdPlacementMapper.fromDocument(placement)
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'AdPlacement', error)
    }
  }

  /**
   * Find all placements for a specific page with optional relations
   */
  async findByPageId(
    pageId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain[]> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.AdPlacementInclude)
          : undefined

      const placements = await this.prisma.adPlacement.findMany({
        where: { pageId },
        orderBy: { position: 'asc' },
        include,
      })

      return placements.map(AdPlacementMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findByPageId', 'AdPlacement', error)
    }
  }

  /**
   * Find all ad placements with pagination, filtering, and optional relations
   */
  async findAll(
    params: AdPlacementSearchParams,
  ): Promise<PaginatedResult<AdPlacementDomain>> {
    try {
      const {
        page = 1,
        limit = 20,
        pageId,
        bookId,
        contentType,
        position,
        size,
        createdBy,
        isActive,
        sortBy = 'position',
        sortOrder = 'asc',
        parsedIncludes,
      } = params

      const skip = (page - 1) * limit

      // Build include clause
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.AdPlacementInclude)
          : undefined

      // Build where clause
      const where: Prisma.AdPlacementWhereInput = {}

      if (pageId) {
        where.pageId = pageId
      }

      if (bookId) {
        where.page = { bookId }
      }

      if (contentType) {
        where.contentType = contentType
      }

      if (position) {
        where.position = position
      }

      if (size) {
        where.size = size
      }

      if (createdBy) {
        where.createdBy = createdBy
      }

      if (isActive !== undefined) {
        // Note: isActive field needs to be added to the schema if used for filtering
        // For now, we'll assume all placements are active unless specified otherwise
      }

      // Build order by clause
      const orderBy: Prisma.AdPlacementOrderByWithRelationInput = {}

      if (sortBy === 'position') {
        orderBy.position = sortOrder
      } else if (sortBy === 'contentType') {
        orderBy.contentType = sortOrder
      } else if (sortBy === 'size') {
        orderBy.size = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }

      const [placements, total] = await Promise.all([
        this.prisma.adPlacement.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include,
        }),
        this.prisma.adPlacement.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: placements.map(AdPlacementMapper.fromDocument),
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
      throw ErrorFactory.databaseError('findAll', 'AdPlacement', error)
    }
  }

  /**
   * Update ad placement
   */
  async update(
    id: string,
    data: UpdateAdPlacementInput,
  ): Promise<AdPlacementDomain> {
    try {
      // If position is being updated, validate the new position
      if (data.position !== undefined) {
        const existingPlacement = await this.prisma.adPlacement.findUnique({
          where: { id },
          select: { pageId: true },
        })

        if (existingPlacement) {
          const isValidPosition = await this.validatePlacementPosition(
            existingPlacement.pageId,
            data.position,
            data.size || '',
            id,
          )

          if (!isValidPosition) {
            throw ErrorFactory.resourceConflict(
              'AdPlacement',
              'Position is already occupied or conflicts with existing placements',
            )
          }
        }
      }

      const placement = await this.prisma.adPlacement.update({
        where: { id },
        data: {
          contentType: data.contentType,
          position: data.position,
          size: data.size,
          spacesUsed: data.spacesUsed,
          imageUrl: data.imageUrl,
          qrCodePayload: data.qrCodePayload,
          shortCode: data.shortCode,
          title: data.title,
          description: data.description,
          metadata: data.metadata,
          updatedBy: data.updatedBy,
        },
      })

      return AdPlacementMapper.fromDocument(placement)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('AdPlacement', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'AdPlacement',
            'Position is already occupied on this page',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'AdPlacement', error)
    }
  }

  /**
   * Delete ad placement
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.adPlacement.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('AdPlacement', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'AdPlacement', error)
    }
  }

  /**
   * Find all placements for a specific book with optional relations
   */
  async findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<AdPlacementDomain[]> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.AdPlacementInclude)
          : undefined

      const placements = await this.prisma.adPlacement.findMany({
        where: {
          page: { bookId },
        },
        orderBy: [{ page: { pageNumber: 'asc' } }, { position: 'asc' }],
        include,
      })

      return placements.map(AdPlacementMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findByBookId', 'AdPlacement', error)
    }
  }

  /**
   * Find placement by page ID and position
   */
  async findByPosition(
    pageId: string,
    position: number,
  ): Promise<AdPlacementDomain | null> {
    try {
      const placement = await this.prisma.adPlacement.findUnique({
        where: {
          pageId_position: {
            pageId,
            position,
          },
        },
      })

      if (!placement) {
        return null
      }

      return AdPlacementMapper.fromDocument(placement)
    } catch (error) {
      throw ErrorFactory.databaseError('findByPosition', 'AdPlacement', error)
    }
  }

  /**
   * Delete all placements for a specific page
   */
  async deleteByPageId(pageId: string): Promise<void> {
    try {
      await this.prisma.adPlacement.deleteMany({
        where: { pageId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError('deleteByPageId', 'AdPlacement', error)
    }
  }

  /**
   * Delete all placements for a specific book
   */
  async deleteByBookId(bookId: string): Promise<void> {
    try {
      await this.prisma.adPlacement.deleteMany({
        where: {
          page: { bookId },
        },
      })
    } catch (error) {
      throw ErrorFactory.databaseError('deleteByBookId', 'AdPlacement', error)
    }
  }

  /**
   * Bulk update multiple placements
   */
  async bulkUpdate(
    placementIds: string[],
    data: BulkUpdateAdPlacementInput,
  ): Promise<AdPlacementDomain[]> {
    try {
      await this.prisma.adPlacement.updateMany({
        where: {
          id: { in: placementIds },
        },
        data: {
          updatedBy: data.updatedBy,
        },
      })

      // Fetch updated placements
      const placements = await this.prisma.adPlacement.findMany({
        where: {
          id: { in: placementIds },
        },
        orderBy: { position: 'asc' },
      })

      return placements.map(AdPlacementMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('bulkUpdate', 'AdPlacement', error)
    }
  }

  /**
   * Validate if a placement position is available
   */
  async validatePlacementPosition(
    pageId: string,
    position: number,
    size: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const where: Prisma.AdPlacementWhereInput = {
        pageId,
        position,
      }

      if (excludeId) {
        where.id = { not: excludeId }
      }

      const existingPlacement = await this.prisma.adPlacement.findFirst({
        where,
      })

      // Position is valid if no existing placement found
      return !existingPlacement
    } catch (error) {
      logger.error('Error validating placement position', {
        error,
        pageId,
        position,
      })

      return false
    }
  }

  /**
   * Reorder placements by updating their display order
   */
  async reorderPlacements(
    bookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void> {
    try {
      // Use a transaction to ensure consistency
      await this.prisma.$transaction(async (prisma) => {
        for (const { id, position } of reorderData) {
          await prisma.adPlacement.update({
            where: { id },
            data: {
              position,
              updatedBy: userId,
            },
          })
        }
      })

      logger.info('Ad placements reordered', {
        bookId,
        count: reorderData.length,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound(
            'AdPlacement',
            'One or more placements not found',
          )
        }
      }
      throw ErrorFactory.databaseError(
        'reorderPlacements',
        'AdPlacement',
        error,
      )
    }
  }
}
