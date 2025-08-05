import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import type { VoucherBookDomain } from '@pika/sdk'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import type { VoucherBookStatus, VoucherBookType } from '@prisma/client'

import type {
  IAdPlacementRepository,
  IBookDistributionRepository,
  IVoucherBookPageRepository,
  IVoucherBookRepository,
} from '../repositories/index.js'
import type { VoucherBookSearchParams } from '../types/index.js'
import {
  AdPlacementInfo,
  PageLayout,
  PageLayoutEngine,
} from './PageLayoutEngine.js'
import {
  GeneratePDFOptions,
  PDFGenerationService,
  VoucherData,
} from './PDFGenerationService.js'
import { VoucherServiceClient } from './VoucherServiceClient.js'

export interface CreateVoucherBookData {
  title: string
  description?: string
  bookType: VoucherBookType
  year: number
  month?: number
  totalPages?: number
  edition?: string
  coverImageUrl?: string
  backImageUrl?: string
  metadata?: Record<string, any>
  createdById: string
}

export interface UpdateVoucherBookData {
  title?: string
  description?: string
  bookType?: VoucherBookType
  year?: number
  month?: number
  totalPages?: number
  edition?: string
  metadata?: Record<string, any>
  updatedById: string
}

// PaginatedResult is imported from @pika/types

export interface GeneratePDFResult {
  success: boolean
  pdfBuffer?: Buffer
  filename?: string
  error?: string
  warnings: string[]
  generatedAt: Date
  processingTimeMs: number
}

export interface IVoucherBookService {
  createVoucherBook(data: CreateVoucherBookData): Promise<VoucherBookDomain>
  getVoucherBookById(id: string): Promise<VoucherBookDomain>
  getAllVoucherBooks(
    params: VoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>>
  updateVoucherBook(
    id: string,
    data: UpdateVoucherBookData,
  ): Promise<VoucherBookDomain>
  deleteVoucherBook(id: string): Promise<void>
  publishVoucherBook(id: string, userId: string): Promise<VoucherBookDomain>
  archiveVoucherBook(id: string, userId: string): Promise<VoucherBookDomain>
  generatePDF(id: string, userId?: string): Promise<GeneratePDFResult>
  getVoucherBookStatistics(id: string): Promise<{
    totalPages: number
    usedSpaces: number
    availableSpaces: number
    totalPlacements: number
    placementsByType: Record<string, number>
  }>
}

/**
 * VoucherBookService orchestrates voucher book management and PDF generation.
 *
 * Combines the sophisticated business logic from the old CQRS architecture
 * into a simpler service that works with our new repository pattern.
 *
 * State Machine: DRAFT → READY_FOR_PRINT → PUBLISHED → ARCHIVED
 *
 * Features:
 * - Complete voucher book lifecycle management
 * - PDF generation with QR codes and layouts
 * - Integration with voucher service for content
 * - Security and rate limiting
 * - Performance optimization with caching
 */
export class VoucherBookService implements IVoucherBookService {
  private static readonly DEFAULT_PAGES = 24
  private static readonly DEFAULT_VOUCHERS_PER_PAGE = 4
  private static readonly SPACES_PER_PAGE = 8 // 2x4 grid

  private readonly pdfGenerationService: PDFGenerationService
  private readonly pageLayoutEngine: PageLayoutEngine
  private readonly voucherServiceClient: VoucherServiceClient

  constructor(
    protected readonly voucherBookRepository: IVoucherBookRepository,
    private readonly pageRepository: IVoucherBookPageRepository,
    private readonly placementRepository: IAdPlacementRepository,
    private readonly distributionRepository: IBookDistributionRepository,
    private readonly cache: ICacheService,
    voucherServiceClient?: VoucherServiceClient,
  ) {
    this.pdfGenerationService = new PDFGenerationService()
    this.pageLayoutEngine = new PageLayoutEngine()
    this.voucherServiceClient =
      voucherServiceClient || new VoucherServiceClient()
  }

  async createVoucherBook(
    data: CreateVoucherBookData,
  ): Promise<VoucherBookDomain> {
    try {
      logger.info('Creating voucher book', {
        title: data.title,
        createdById: data.createdById,
      })

      // Check for duplicate titles in the same year/month
      const existingBooks =
        await this.voucherBookRepository.findByTitleAndPeriod(
          data.title,
          data.year,
          data.month,
        )

      if (existingBooks.length > 0) {
        throw ErrorFactory.resourceConflict(
          'VoucherBook',
          `A voucher book with title "${data.title}" already exists for ${data.year}${data.month ? '/' + data.month : ''}`,
        )
      }

      // Validate and set defaults
      const bookData = {
        title: data.title,
        edition: data.edition,
        bookType: data.bookType,
        month: data.month,
        year: data.year,
        totalPages: data.totalPages || VoucherBookService.DEFAULT_PAGES,
        coverImageUrl: data.coverImageUrl,
        backImageUrl: data.backImageUrl,
        metadata: data.metadata,
        createdBy: data.createdById,
        updatedBy: data.createdById,
      }

      // Create the voucher book
      const voucherBook = await this.voucherBookRepository.create(bookData)

      // Create initial page structure with layout engine
      await this.createInitialPages(voucherBook.id, bookData.totalPages)

      logger.info('Voucher book created successfully', {
        id: voucherBook.id,
        title: voucherBook.title,
        totalPages: bookData.totalPages,
      })

      return voucherBook
    } catch (error) {
      logger.error('Failed to create voucher book', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:voucher-book',
    keyGenerator: (id) => id,
  })
  async getVoucherBookById(id: string): Promise<VoucherBookDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const voucherBook = await this.voucherBookRepository.findById(id)

      if (!voucherBook) {
        throw ErrorFactory.resourceNotFound('VoucherBook', id)
      }

      return voucherBook
    } catch (error) {
      logger.error('Failed to get voucher book by ID', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL / 2,
    prefix: 'service:voucher-books',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllVoucherBooks(
    params: VoucherBookSearchParams,
  ): Promise<PaginatedResult<VoucherBookDomain>> {
    try {
      const result = await this.voucherBookRepository.findAll({
        ...params,
        bookType: params.bookType as VoucherBookType | undefined,
        status: params.status as VoucherBookStatus | undefined,
      })

      return result
    } catch (error) {
      logger.error('Failed to get all voucher books', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherBook(
    id: string,
    data: UpdateVoucherBookData,
  ): Promise<VoucherBookDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const currentBook = await this.getVoucherBookById(id)

      // Validate state transition rules
      await this.validateBookModification(currentBook)

      // Prepare update data with proper field mapping
      const updateData = {
        title: data.title,
        edition: data.edition,
        bookType: data.bookType,
        month: data.month,
        year: data.year,
        totalPages: data.totalPages,
        metadata: data.metadata,
        updatedBy: data.updatedById,
      }

      if (data.totalPages) {
        // If increasing pages, create new page records
        if (data.totalPages && data.totalPages > currentBook.totalPages) {
          await this.createAdditionalPages(
            id,
            currentBook.totalPages + 1,
            data.totalPages,
          )
        }
      }

      const updatedBook = await this.voucherBookRepository.update(
        id,
        updateData,
      )

      // Invalidate cache
      await this.cache.del(`service:voucher-book:${id}`)

      logger.info('Voucher book updated', {
        id,
        updatedFields: Object.keys(data),
      })

      return updatedBook
    } catch (error) {
      logger.error('Failed to update voucher book', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteVoucherBook(id: string): Promise<void> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const voucherBook = await this.getVoucherBookById(id)

      // Validate deletion is allowed using voucher service
      const stateValidation =
        await this.voucherServiceClient.validateBookStateTransition(
          voucherBook.status as any,
          'deleted',
        )

      if (!stateValidation.allowed) {
        throw ErrorFactory.badRequest(
          stateValidation.reason || 'Deletion not allowed for this book status',
        )
      }

      await this.voucherBookRepository.delete(id)

      // Invalidate cache
      await this.cache.del(`service:voucher-book:${id}`)

      logger.info('Voucher book deleted', { id })
    } catch (error) {
      logger.error('Failed to delete voucher book', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async publishVoucherBook(
    id: string,
    userId: string,
  ): Promise<VoucherBookDomain> {
    try {
      const voucherBook = await this.getVoucherBookById(id)

      // Validate state transition using voucher service
      const stateValidation =
        await this.voucherServiceClient.validateBookStateTransition(
          voucherBook.status as any,
          'published',
        )

      if (!stateValidation.allowed) {
        throw ErrorFactory.badRequest(
          stateValidation.reason || 'State transition not allowed',
        )
      }

      // Validate book has content
      await this.validateBookReadyForPublication(id)

      const updatedBook = await this.voucherBookRepository.update(id, {
        status: 'published',
        publishedAt: new Date(),
        updatedBy: userId,
      })

      await this.cache.del(`service:voucher-book:${id}`)

      logger.info('Voucher book published', { id, userId })

      return updatedBook
    } catch (error) {
      logger.error('Failed to publish voucher book', { error, id, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async archiveVoucherBook(
    id: string,
    userId: string,
  ): Promise<VoucherBookDomain> {
    try {
      const voucherBook = await this.getVoucherBookById(id)

      // Validate state transition using voucher service
      const stateValidation =
        await this.voucherServiceClient.validateBookStateTransition(
          voucherBook.status as any,
          'archived',
        )

      if (!stateValidation.allowed) {
        throw ErrorFactory.badRequest(
          stateValidation.reason || 'State transition not allowed',
        )
      }

      const updatedBook = await this.voucherBookRepository.update(id, {
        status: 'archived',
        updatedBy: userId,
      })

      await this.cache.del(`service:voucher-book:${id}`)

      logger.info('Voucher book archived', { id, userId })

      return updatedBook
    } catch (error) {
      logger.error('Failed to archive voucher book', { error, id, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async generatePDF(id: string, userId?: string): Promise<GeneratePDFResult> {
    const startTime = Date.now()
    const warnings: string[] = []

    try {
      logger.info('Starting PDF generation', { voucherBookId: id, userId })

      // Get voucher book
      const voucherBook = await this.getVoucherBookById(id)

      // Validate PDF generation is allowed
      const canGenerate = voucherBook.status !== 'archived'

      if (!canGenerate) {
        throw ErrorFactory.badRequest('Cannot generate PDF for archived books')
      }

      // Get placements and build page layouts
      const placements = await this.placementRepository.findByBookId(id)
      const pageLayouts = await this.buildPageLayouts(
        voucherBook.totalPages,
        placements,
      )

      // Collect voucher IDs from placements with voucher content
      const voucherIds = new Set<string>()

      for (const placement of placements) {
        if (placement.contentType === 'voucher' && placement.metadata) {
          const voucherId = (placement.metadata as any).voucherId

          if (voucherId) {
            voucherIds.add(voucherId)
          }
        }
      }

      const vouchers = new Map<string, VoucherData>()
      const qrPayloads = new Map<string, string>()

      if (voucherIds.size > 0) {
        // Get unique business IDs from existing voucher data
        const voucherDataMap = await this.voucherServiceClient.getVouchersByIds(
          Array.from(voucherIds),
        )

        // Extract business IDs for the voucher book request
        const businessIds = Array.from(
          new Set(
            Array.from(voucherDataMap.values())
              .map((v) => v.businessId)
              .filter(Boolean),
          ),
        )

        if (businessIds.length > 0) {
          // Get vouchers with pre-generated security tokens from voucher service
          const month = (voucherBook.month || new Date().getMonth() + 1)
            .toString()
            .padStart(2, '0')
          const year = voucherBook.year || new Date().getFullYear()

          const vouchersWithTokens =
            await this.voucherServiceClient.getVouchersForBook(
              businessIds,
              month,
              year,
            )

          // Process vouchers that are placed in this book
          for (const voucherData of vouchersWithTokens.vouchers) {
            if (voucherIds.has(voucherData.id)) {
              // Store voucher data for PDF rendering
              vouchers.set(voucherData.id, {
                id: voucherData.id,
                title:
                  voucherData.title.en ||
                  Object.values(voucherData.title)[0] ||
                  'Special Offer',
                description:
                  voucherData.description.en ||
                  Object.values(voucherData.description)[0] ||
                  '',
                discount:
                  voucherData.discountType === 'percentage'
                    ? `${voucherData.discountValue}%`
                    : `$${voucherData.discountValue}`,
                businessName: voucherData.businessName || 'Partner Business',
                expiresAt: voucherData.validTo
                  ? new Date(voucherData.validTo)
                  : new Date(),
              })

              // Store pre-generated QR payload
              qrPayloads.set(voucherData.id, voucherData.qrPayload)
            }
          }

          logger.info(
            'Loaded vouchers with security tokens for PDF generation',
            {
              bookId: id,
              totalVouchers: vouchersWithTokens.count,
              placedVouchers: vouchers.size,
              businessCount: businessIds.length,
            },
          )
        }
      }

      // Generate PDF using the sophisticated PDF generation service
      const pdfOptions: GeneratePDFOptions = {
        bookId: id,
        title: voucherBook.title,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        pages: pageLayouts,
        vouchers,
        qrPayloads,
      }

      const pdfBuffer =
        await this.pdfGenerationService.generateVoucherBookPDF(pdfOptions)

      // Update book status if it was draft
      if (voucherBook.status === 'draft') {
        await this.voucherBookRepository.update(id, {
          status: 'ready_for_print',
          updatedBy: userId || 'system',
        })
      }

      const processingTimeMs = Date.now() - startTime
      const filename = `voucher-book-${voucherBook.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`

      logger.info('PDF generation completed successfully', {
        voucherBookId: id,
        userId,
        processingTimeMs,
        pdfSize: pdfBuffer.length,
      })

      return {
        success: true,
        pdfBuffer,
        filename,
        warnings,
        generatedAt: new Date(),
        processingTimeMs,
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime

      logger.error('PDF generation failed', {
        error,
        voucherBookId: id,
        userId,
        processingTimeMs,
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings,
        generatedAt: new Date(),
        processingTimeMs,
      }
    }
  }

  async getVoucherBookStatistics(id: string): Promise<{
    totalPages: number
    usedSpaces: number
    availableSpaces: number
    totalPlacements: number
    placementsByType: Record<string, number>
  }> {
    try {
      const voucherBook = await this.getVoucherBookById(id)
      const placements = await this.placementRepository.findByBookId(id)

      const totalSpaces =
        voucherBook.totalPages * VoucherBookService.SPACES_PER_PAGE

      // Calculate used spaces using layout engine
      let usedSpaces = 0

      for (const placement of placements) {
        const spacesRequired = this.pageLayoutEngine.getRequiredSpaces(
          placement.size as any,
        )

        usedSpaces += spacesRequired
      }

      const availableSpaces = totalSpaces - usedSpaces

      const placementsByType = placements.reduce(
        (acc, placement) => {
          acc[placement.contentType] = (acc[placement.contentType] || 0) + 1

          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalPages: voucherBook.totalPages,
        usedSpaces,
        availableSpaces,
        totalPlacements: placements.length,
        placementsByType,
      }
    } catch (error) {
      logger.error('Failed to get voucher book statistics', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Private helper methods
   */

  private async createInitialPages(
    voucherBookId: string,
    totalPages: number,
  ): Promise<void> {
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      await this.pageRepository.create({
        bookId: voucherBookId,
        pageNumber,
        layoutType: 'standard',
        metadata: this.pageLayoutEngine.createEmptyPage(pageNumber),
      })
    }
  }

  private async createAdditionalPages(
    voucherBookId: string,
    startPage: number,
    endPage: number,
  ): Promise<void> {
    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
      await this.pageRepository.create({
        bookId: voucherBookId,
        pageNumber,
        layoutType: 'standard',
        metadata: this.pageLayoutEngine.createEmptyPage(pageNumber),
      })
    }
  }

  private async validateBookModification(
    book: VoucherBookDomain,
  ): Promise<void> {
    // Validate if the book status allows modification
    const canModify =
      book.status === 'draft' || book.status === 'ready_for_print'

    if (!canModify) {
      throw ErrorFactory.badRequest(
        `Cannot modify ${book.status.toLowerCase()} voucher book`,
      )
    }
  }

  private async validateBookReadyForPublication(id: string): Promise<void> {
    const placements = await this.placementRepository.findByBookId(id)

    if (placements.length === 0) {
      throw ErrorFactory.badRequest(
        'Book must have at least one placement before publishing',
      )
    }

    // Validate all placements are properly configured
    for (const placement of placements) {
      // All placements are considered active

      if (placement.contentType === 'IMAGE' && !placement.imageUrl) {
        throw ErrorFactory.badRequest(
          `Placement "${placement.title}" missing required image URL`,
        )
      }

      // Text content validation removed - not part of current schema
    }
  }

  private async buildPageLayouts(
    totalPages: number,
    placements: any[],
  ): Promise<PageLayout[]> {
    const pageLayouts: PageLayout[] = []

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      const pagePlacements = placements.filter(
        () => this.getPageNumberFromPosition() === pageNumber,
      )

      const adPlacements: AdPlacementInfo[] = pagePlacements.map((p) => ({
        id: p.id,
        position: this.getPositionOnPage(),
        size: p.position as any, // This maps to our AdSize
        spacesUsed: this.pageLayoutEngine.getRequiredSpaces(p.position as any),
        contentType: p.contentType as any,
        voucherId: p.contentType === 'VOUCHER' ? p.id : undefined,
        imageUrl: p.imageUrl,
        title: p.title,
        description: p.description,
      }))

      const occupiedSpaces = new Set<number>()
      const availableSpaces: number[] = []

      // Calculate occupied and available spaces
      for (let space = 1; space <= 8; space++) {
        const isOccupied = adPlacements.some((p) =>
          this.isSpaceOccupiedByPlacement(space, p),
        )

        if (isOccupied) {
          occupiedSpaces.add(space)
        } else {
          availableSpaces.push(space)
        }
      }

      pageLayouts.push({
        pageNumber,
        placements: adPlacements,
        occupiedSpaces,
        availableSpaces,
      })
    }

    return pageLayouts
  }

  private getPageNumberFromPosition(): number {
    // Simple mapping - in real implementation this would be more sophisticated
    return 1 // All placements on page 1 for now
  }

  private getPositionOnPage(): number {
    // Map our position enum to grid position
    // Future implementation would use position mapping
    return 1
  }

  private isSpaceOccupiedByPlacement(
    space: number,
    placement: AdPlacementInfo,
  ): boolean {
    // Check if this space is occupied by the placement
    const startPosition = placement.position
    const endPosition = startPosition + placement.spacesUsed - 1

    return space >= startPosition && space <= endPosition
  }
}
