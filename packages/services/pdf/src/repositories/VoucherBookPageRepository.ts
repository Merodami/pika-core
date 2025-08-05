import type { ICacheService } from '@pika/redis'
import type { VoucherBookPageDomain } from '@pika/sdk'
import { VoucherBookPageMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import { toPrismaInclude } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import type { PageLayoutType, PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

/**
 * Voucher book page repository interface
 */
export interface IVoucherBookPageRepository {
  create(data: CreateVoucherBookPageInput): Promise<VoucherBookPageDomain>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain | null>
  findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain[]>
  findAll(
    params: VoucherBookPageSearchParams,
  ): Promise<PaginatedResult<VoucherBookPageDomain>>
  update(
    id: string,
    data: UpdateVoucherBookPageInput,
  ): Promise<VoucherBookPageDomain>
  delete(id: string): Promise<void>
  findByPageNumber(
    bookId: string,
    pageNumber: number,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain | null>
  deleteByBookId(bookId: string): Promise<void>
  getPageStats(bookId: string): Promise<PageStatsResult>
}

/**
 * Input types for voucher book page operations
 */
export interface CreateVoucherBookPageInput {
  bookId: string
  pageNumber: number
  layoutType: PageLayoutType
  metadata?: Record<string, any>
}

export interface UpdateVoucherBookPageInput {
  pageNumber?: number
  layoutType?: PageLayoutType
  metadata?: Record<string, any>
}

export interface VoucherBookPageSearchParams {
  page?: number
  limit?: number
  bookId?: string
  layoutType?: PageLayoutType
  hasContent?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  parsedIncludes?: ParsedIncludes
}

export interface PageStatsResult {
  totalPages: number
  pagesWithContent: number
  pagesWithoutContent: number
  totalPlacements: number
  spacesUsed: number
  spacesAvailable: number
}

/**
 * Voucher book page repository implementation
 */
export class VoucherBookPageRepository implements IVoucherBookPageRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Create a new voucher book page
   */
  async create(
    data: CreateVoucherBookPageInput,
  ): Promise<VoucherBookPageDomain> {
    try {
      logger.info('Creating voucher book page', {
        bookId: data.bookId,
        pageNumber: data.pageNumber,
      })

      const page = await this.prisma.voucherBookPage.create({
        data: {
          bookId: data.bookId,
          pageNumber: data.pageNumber,
          layoutType: data.layoutType,
          metadata: data.metadata || {},
        },
      })

      return VoucherBookPageMapper.fromDocument(page)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'VoucherBookPage',
            'Page number already exists for this book',
          )
        }
        if (error.code === 'P2003') {
          throw ErrorFactory.badRequest('Invalid book ID')
        }
      }
      throw ErrorFactory.databaseError('create', 'VoucherBookPage', error)
    }
  }

  /**
   * Find voucher book page by ID with optional relations
   */
  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain | null> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookPageInclude)
          : undefined

      const page = await this.prisma.voucherBookPage.findUnique({
        where: { id },
        include,
      })

      if (!page) {
        return null
      }

      return VoucherBookPageMapper.fromDocument(page)
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'VoucherBookPage', error)
    }
  }

  /**
   * Find all pages for a specific book with optional relations
   */
  async findByBookId(
    bookId: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain[]> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookPageInclude)
          : undefined

      const pages = await this.prisma.voucherBookPage.findMany({
        where: { bookId },
        orderBy: { pageNumber: 'asc' },
        include,
      })

      return pages.map(VoucherBookPageMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError('findByBookId', 'VoucherBookPage', error)
    }
  }

  /**
   * Find all voucher book pages with pagination, filtering, and optional relations
   */
  async findAll(
    params: VoucherBookPageSearchParams,
  ): Promise<PaginatedResult<VoucherBookPageDomain>> {
    try {
      const {
        page = 1,
        limit = 20,
        bookId,
        layoutType,
        hasContent,
        sortBy = 'pageNumber',
        sortOrder = 'asc',
        parsedIncludes,
      } = params

      const skip = (page - 1) * limit

      // Build include clause
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookPageInclude)
          : undefined

      // Build where clause
      const where: Prisma.VoucherBookPageWhereInput = {}

      if (bookId) {
        where.bookId = bookId
      }

      if (layoutType) {
        where.layoutType = layoutType
      }

      if (hasContent !== undefined) {
        if (hasContent) {
          where.adPlacements = { some: {} }
        } else {
          where.adPlacements = { none: {} }
        }
      }

      // Build order by clause
      const orderBy: Prisma.VoucherBookPageOrderByWithRelationInput = {}

      if (sortBy === 'pageNumber') {
        orderBy.pageNumber = sortOrder
      } else if (sortBy === 'layoutType') {
        orderBy.layoutType = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }

      const [pages, total] = await Promise.all([
        this.prisma.voucherBookPage.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include,
        }),
        this.prisma.voucherBookPage.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: pages.map(VoucherBookPageMapper.fromDocument),
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
      throw ErrorFactory.databaseError('findAll', 'VoucherBookPage', error)
    }
  }

  /**
   * Update voucher book page
   */
  async update(
    id: string,
    data: UpdateVoucherBookPageInput,
  ): Promise<VoucherBookPageDomain> {
    try {
      const page = await this.prisma.voucherBookPage.update({
        where: { id },
        data: {
          pageNumber: data.pageNumber,
          layoutType: data.layoutType,
          metadata: data.metadata,
        },
      })

      return VoucherBookPageMapper.fromDocument(page)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBookPage', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'VoucherBookPage',
            'Page number already exists for this book',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'VoucherBookPage', error)
    }
  }

  /**
   * Delete voucher book page
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.voucherBookPage.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBookPage', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'VoucherBookPage', error)
    }
  }

  /**
   * Find page by book ID and page number with optional relations
   */
  async findByPageNumber(
    bookId: string,
    pageNumber: number,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookPageDomain | null> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookPageInclude)
          : undefined

      const page = await this.prisma.voucherBookPage.findUnique({
        where: {
          bookId_pageNumber: {
            bookId,
            pageNumber,
          },
        },
        include,
      })

      if (!page) {
        return null
      }

      return VoucherBookPageMapper.fromDocument(page)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByPageNumber',
        'VoucherBookPage',
        error,
      )
    }
  }

  /**
   * Delete all pages for a specific book
   */
  async deleteByBookId(bookId: string): Promise<void> {
    try {
      await this.prisma.voucherBookPage.deleteMany({
        where: { bookId },
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'deleteByBookId',
        'VoucherBookPage',
        error,
      )
    }
  }

  /**
   * Get page statistics for a specific book
   */
  async getPageStats(bookId: string): Promise<PageStatsResult> {
    try {
      const [totalPages, pagesWithContent, totalPlacements] = await Promise.all(
        [
          this.prisma.voucherBookPage.count({
            where: { bookId },
          }),
          this.prisma.voucherBookPage.count({
            where: {
              bookId,
              adPlacements: { some: {} },
            },
          }),
          this.prisma.adPlacement.count({
            where: {
              page: { bookId },
            },
          }),
        ],
      )

      // Calculate spaces used (assuming each placement uses 1 space, can be customized)
      const spacesUsedResult = await this.prisma.adPlacement.aggregate({
        where: {
          page: { bookId },
        },
        _sum: {
          spacesUsed: true,
        },
      })

      const spacesUsed = spacesUsedResult._sum.spacesUsed || 0

      // Assuming 8 spaces per page maximum (based on original Pika implementation)
      const maxSpacesPerPage = 8
      const spacesAvailable = totalPages * maxSpacesPerPage - spacesUsed

      return {
        totalPages,
        pagesWithContent,
        pagesWithoutContent: totalPages - pagesWithContent,
        totalPlacements,
        spacesUsed,
        spacesAvailable: Math.max(0, spacesAvailable),
      }
    } catch (error) {
      throw ErrorFactory.databaseError('getPageStats', 'VoucherBookPage', error)
    }
  }
}
