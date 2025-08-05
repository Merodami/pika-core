import type { ICacheService } from '@pika/redis'
import type { VoucherBookDomain } from '@pika/sdk'
import { VoucherBookMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import { toPrismaInclude } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import type {
  PrismaClient,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'
import { Prisma } from '@prisma/client'

/**
 * Voucher book repository interface
 */
export interface IVoucherBookRepository {
  create(data: CreateVoucherBookInput): Promise<VoucherBookDomain>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookDomain | null>
  findAll(
    params: VoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>>
  update(id: string, data: UpdateVoucherBookInput): Promise<VoucherBookDomain>
  delete(id: string): Promise<void>
  findByYearAndMonth(
    year: number,
    month?: number,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookDomain[]>
  findPublishedBooks(
    params: PublishedBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>>
  updateStatus(
    id: string,
    status: VoucherBookStatus,
    updatedBy: string,
  ): Promise<VoucherBookDomain>
  findBooksForGeneration(): Promise<VoucherBookDomain[]>
  findByTitleAndPeriod(
    title: string,
    year: number,
    month?: number | null,
  ): Promise<VoucherBookDomain[]>
}

/**
 * Input types for voucher book operations
 */
export interface CreateVoucherBookInput {
  title: string
  edition?: string
  bookType: VoucherBookType
  month?: number
  year: number
  totalPages: number
  coverImageUrl?: string
  backImageUrl?: string
  metadata?: Record<string, any>
  createdBy: string
  updatedBy?: string
}

export interface UpdateVoucherBookInput {
  title?: string
  edition?: string
  bookType?: VoucherBookType
  month?: number
  year?: number
  totalPages?: number
  status?: VoucherBookStatus
  publishedAt?: Date
  coverImageUrl?: string
  backImageUrl?: string
  pdfUrl?: string
  pdfGeneratedAt?: Date
  metadata?: Record<string, any>
  updatedBy?: string
}

export interface VoucherBookSearchParams {
  page?: number
  limit?: number
  search?: string
  bookType?: VoucherBookType
  status?: VoucherBookStatus
  year?: number
  month?: number
  createdBy?: string
  updatedBy?: string
  hasContent?: boolean
  hasPdf?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  parsedIncludes?: ParsedIncludes
}

export interface PublishedBookSearchParams {
  page?: number
  limit?: number
  search?: string
  bookType?: VoucherBookType
  year?: number
  month?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  parsedIncludes?: ParsedIncludes
}

/**
 * Voucher book repository implementation
 */
export class VoucherBookRepository implements IVoucherBookRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Create a new voucher book
   */
  async create(data: CreateVoucherBookInput): Promise<VoucherBookDomain> {
    try {
      logger.info('Creating voucher book', {
        title: data.title,
        year: data.year,
      })

      const voucherBook = await this.prisma.voucherBook.create({
        data: {
          title: data.title,
          edition: data.edition,
          bookType: data.bookType,
          month: data.month,
          year: data.year,
          totalPages: data.totalPages,
          status: 'draft',
          coverImageUrl: data.coverImageUrl,
          backImageUrl: data.backImageUrl,
          metadata: data.metadata || {},
          createdBy: data.createdBy,
          updatedBy: data.updatedBy || data.createdBy,
        },
      })

      return VoucherBookMapper.fromDocument(voucherBook)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'VoucherBook',
            'Voucher book with this title and year already exists',
          )
        }
      }
      throw ErrorFactory.databaseError('create', 'VoucherBook', error)
    }
  }

  /**
   * Find voucher book by ID with optional relations
   */
  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookDomain | null> {
    try {
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookInclude)
          : undefined

      const voucherBook = await this.prisma.voucherBook.findUnique({
        where: { id },
        include,
      })

      if (!voucherBook) {
        return null
      }

      return VoucherBookMapper.fromDocument(voucherBook)
    } catch (error) {
      throw ErrorFactory.databaseError('findById', 'VoucherBook', error)
    }
  }

  /**
   * Find all voucher books with pagination, filtering, and optional relations
   */
  async findAll(
    params: VoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        bookType,
        status,
        year,
        month,
        createdBy,
        updatedBy,
        hasContent,
        hasPdf,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const skip = (page - 1) * limit

      // Build include clause
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookInclude)
          : undefined

      // Build where clause
      const where: Prisma.VoucherBookWhereInput = {}

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { edition: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (bookType) {
        where.bookType = bookType
      }

      if (status) {
        where.status = status
      }

      if (year) {
        where.year = year
      }

      if (month) {
        where.month = month
      }

      if (createdBy) {
        where.createdBy = createdBy
      }

      if (updatedBy) {
        where.updatedBy = updatedBy
      }

      if (hasContent !== undefined) {
        if (hasContent) {
          where.pages = { some: {} }
        } else {
          where.pages = { none: {} }
        }
      }

      if (hasPdf !== undefined) {
        if (hasPdf) {
          where.pdfUrl = { not: null }
        } else {
          where.pdfUrl = null
        }
      }

      // Build order by clause
      const orderBy: Prisma.VoucherBookOrderByWithRelationInput = {}

      if (sortBy === 'title') {
        orderBy.title = sortOrder
      } else if (sortBy === 'year') {
        orderBy.year = sortOrder
      } else if (sortBy === 'publishedAt') {
        orderBy.publishedAt = sortOrder
      } else {
        orderBy.createdAt = sortOrder
      }

      const [voucherBooks, total] = await Promise.all([
        this.prisma.voucherBook.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include,
        }),
        this.prisma.voucherBook.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: voucherBooks.map(VoucherBookMapper.fromDocument),
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
      throw ErrorFactory.databaseError('findAll', 'VoucherBook', error)
    }
  }

  /**
   * Update voucher book
   */
  async update(
    id: string,
    data: UpdateVoucherBookInput,
  ): Promise<VoucherBookDomain> {
    try {
      const voucherBook = await this.prisma.voucherBook.update({
        where: { id },
        data: {
          title: data.title,
          edition: data.edition,
          bookType: data.bookType,
          month: data.month,
          year: data.year,
          totalPages: data.totalPages,
          status: data.status,
          publishedAt: data.publishedAt,
          coverImageUrl: data.coverImageUrl,
          backImageUrl: data.backImageUrl,
          pdfUrl: data.pdfUrl,
          pdfGeneratedAt: data.pdfGeneratedAt,
          metadata: data.metadata,
          updatedBy: data.updatedBy,
        },
      })

      return VoucherBookMapper.fromDocument(voucherBook)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id)
        }
        if (error.code === 'P2002') {
          throw ErrorFactory.resourceConflict(
            'VoucherBook',
            'Voucher book with this title and year already exists',
          )
        }
      }
      throw ErrorFactory.databaseError('update', 'VoucherBook', error)
    }
  }

  /**
   * Delete voucher book
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.voucherBook.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'VoucherBook', error)
    }
  }

  /**
   * Find voucher books by year and optional month with relations
   */
  async findByYearAndMonth(
    year: number,
    month?: number,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherBookDomain[]> {
    try {
      const where: Prisma.VoucherBookWhereInput = { year }

      if (month) {
        where.month = month
      }

      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookInclude)
          : undefined

      const voucherBooks = await this.prisma.voucherBook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      })

      return voucherBooks.map(VoucherBookMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByYearAndMonth',
        'VoucherBook',
        error,
      )
    }
  }

  /**
   * Find voucher books by title and period (for duplicate validation)
   */
  async findByTitleAndPeriod(
    title: string,
    year: number,
    month?: number | null,
  ): Promise<VoucherBookDomain[]> {
    try {
      const where: Prisma.VoucherBookWhereInput = {
        title,
        year,
        deletedAt: null, // Only check non-deleted books
      }

      if (month !== null && month !== undefined) {
        where.month = month
      }

      const voucherBooks = await this.prisma.voucherBook.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })

      return voucherBooks.map(VoucherBookMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByTitleAndPeriod',
        'VoucherBook',
        error,
      )
    }
  }

  /**
   * Find published books for public API with optional relations
   */
  async findPublishedBooks(
    params: PublishedBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        bookType,
        year,
        month,
        sortBy = 'publishedAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const skip = (page - 1) * limit

      // Build include clause
      const include =
        parsedIncludes && Object.keys(parsedIncludes).length > 0
          ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherBookInclude)
          : undefined

      // Build where clause - only published books
      const where: Prisma.VoucherBookWhereInput = {
        status: 'published',
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { edition: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (bookType) {
        where.bookType = bookType
      }

      if (year) {
        where.year = year
      }

      if (month) {
        where.month = month
      }

      // Build order by clause
      const orderBy: Prisma.VoucherBookOrderByWithRelationInput = {}

      if (sortBy === 'title') {
        orderBy.title = sortOrder
      } else if (sortBy === 'year') {
        orderBy.year = sortOrder
      } else {
        orderBy.publishedAt = sortOrder
      }

      const [voucherBooks, total] = await Promise.all([
        this.prisma.voucherBook.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include,
        }),
        this.prisma.voucherBook.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: voucherBooks.map(VoucherBookMapper.fromDocument),
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
      throw ErrorFactory.databaseError(
        'findPublishedBooks',
        'VoucherBook',
        error,
      )
    }
  }

  /**
   * Update voucher book status
   */
  async updateStatus(
    id: string,
    status: VoucherBookStatus,
    updatedBy: string,
  ): Promise<VoucherBookDomain> {
    try {
      const updateData: any = {
        status,
        updatedBy,
      }

      if (status === 'published') {
        updateData.publishedAt = new Date()
      }

      const voucherBook = await this.prisma.voucherBook.update({
        where: { id },
        data: updateData,
      })

      return VoucherBookMapper.fromDocument(voucherBook)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('VoucherBook', id)
        }
      }
      throw ErrorFactory.databaseError('updateStatus', 'VoucherBook', error)
    }
  }

  /**
   * Find books ready for PDF generation
   */
  async findBooksForGeneration(): Promise<VoucherBookDomain[]> {
    try {
      const voucherBooks = await this.prisma.voucherBook.findMany({
        where: {
          status: 'ready_for_print',
          pdfUrl: null,
        },
        orderBy: { createdAt: 'asc' },
      })

      return voucherBooks.map(VoucherBookMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findBooksForGeneration',
        'VoucherBook',
        error,
      )
    }
  }
}
