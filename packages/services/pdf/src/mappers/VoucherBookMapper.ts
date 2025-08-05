import type { VoucherBookDomain } from '@pika/sdk'

import type { GeneratePDFResult } from '../services/VoucherBookService.js'
import type { VoucherBookStatistics } from '../types/domain.js'

/**
 * Interface for VoucherBook document from database
 * Follows clean architecture - no Prisma imports
 */
export interface VoucherBookDocument {
  id: string
  title: string
  edition: string | null
  bookType: string
  month: number | null
  year: number
  status: string
  totalPages: number
  publishedAt: Date | null
  coverImageUrl: string | null
  backImageUrl: string | null
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  metadata: any
  createdBy: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

/**
 * DTOs for VoucherBook - defined within the service following established pattern
 */
export interface VoucherBookDTO {
  id: string
  title: string
  edition?: string | null
  bookType: string
  month?: number | null
  year: number
  status: string
  totalPages: number
  publishedAt?: string | null
  coverImageUrl?: string | null
  backImageUrl?: string | null
  pdfUrl?: string | null
  pdfGeneratedAt?: string | null
  metadata?: Record<string, any>
  createdBy: string
  updatedBy?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  // Admin-specific fields (required by admin schema)
  pageCount: number
  totalPlacements: number
  distributionCount: number
}

export interface VoucherBookDetailDTO extends VoucherBookDTO {
  statistics?: {
    totalPages: number
    pagesWithPlacements: number
    completionPercentage: number
    totalDistributions: number
    pendingDistributions: number
    shippedDistributions: number
    deliveredDistributions: number
  }
  computed?: {
    displayName: string
    displayPeriod: string
    ageInDays: number
    isRecent: boolean
    canBeEdited: boolean
    canBePublished: boolean
    hasPDF: boolean
  }
}

export interface PublicVoucherBookDTO {
  id: string
  title: string
  edition?: string | null
  bookType: string
  month?: number | null
  year: number
  status: string
  totalPages: number
  publishedAt?: string | null
  coverImageUrl?: string | null
  pdfUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateVoucherBookDTO {
  title: string
  edition?: string | null
  bookType?: string
  month?: number | null
  year: number
  totalPages?: number
  coverImageUrl?: string | null
  backImageUrl?: string | null
  metadata?: Record<string, any>
}

export interface UpdateVoucherBookDTO {
  title?: string
  edition?: string | null
  bookType?: string
  month?: number | null
  year?: number
  totalPages?: number
  status?: string
  coverImageUrl?: string | null
  backImageUrl?: string | null
  metadata?: Record<string, any>
}

/**
 * VoucherBookMapper handles data transformation between database entities and DTOs
 * Includes all business rules from the old system
 */
export class VoucherBookMapper {
  /**
   * Ensure metadata is a proper object or null
   * Business rule from old system
   */
  private static ensureMetadata(value: any): Record<string, any> | null {
    if (!value || typeof value !== 'object') {
      return null
    }

    return value
  }

  /**
   * Convert Prisma document to domain entity
   * Required by repository layer
   */
  static fromDocument(document: VoucherBookDocument): VoucherBookDomain {
    return {
      id: document.id,
      title: document.title,
      edition: document.edition,
      bookType: document.bookType,
      month: document.month,
      year: document.year,
      status: document.status,
      totalPages: document.totalPages,
      publishedAt: document.publishedAt,
      coverImageUrl: document.coverImageUrl,
      backImageUrl: document.backImageUrl,
      pdfUrl: document.pdfUrl,
      pdfGeneratedAt: document.pdfGeneratedAt,
      metadata: VoucherBookMapper.ensureMetadata(document.metadata),
      createdBy: document.createdBy,
      updatedBy: document.updatedBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    }
  }

  /**
   * Get display name for the book
   * Business rule: title + edition if available
   */
  static getDisplayName(voucherBook: VoucherBookDTO): string {
    return voucherBook.edition
      ? `${voucherBook.title} - ${voucherBook.edition}`
      : voucherBook.title
  }

  /**
   * Get display period for the book
   * Business rule: Month name + year or just year
   */
  static getDisplayPeriod(voucherBook: VoucherBookDTO): string {
    if (voucherBook.month) {
      const monthName = new Date(2000, voucherBook.month - 1, 1).toLocaleString(
        'en',
        {
          month: 'long',
        },
      )

      return `${monthName} ${voucherBook.year}`
    }

    return voucherBook.year.toString()
  }

  /**
   * Calculate age of book in days
   * Business rule from old system
   */
  static getAgeInDays(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if book is recent (within 7 days)
   * Business rule from old system
   */
  static isRecent(createdAt: string): boolean {
    return VoucherBookMapper.getAgeInDays(createdAt) <= 7
  }

  /**
   * Check if book has PDF
   * Business rule: pdfUrl and pdfGeneratedAt must both exist
   */
  static hasPDF(voucherBook: VoucherBookDTO): boolean {
    return voucherBook.pdfUrl !== null && voucherBook.pdfGeneratedAt !== null
  }

  /**
   * Check if book can be edited
   * Business rule: Only DRAFT status can be edited
   */
  static canBeEdited(voucherBook: VoucherBookDTO): boolean {
    return voucherBook.status === 'draft'
  }

  /**
   * Check if book can be published
   * Business rule: Must be READY_FOR_PRINT and have PDF
   */
  static canBePublished(voucherBook: VoucherBookDTO): boolean {
    return (
      voucherBook.status === 'ready_for_print' &&
      VoucherBookMapper.hasPDF(voucherBook)
    )
  }

  /**
   * Validate year
   * Business rule: Year must be between 2020 and 2100
   */
  static validateYear(year: number): boolean {
    return year >= 2020 && year <= 2100
  }

  /**
   * Validate month
   * Business rule: Month must be between 1 and 12 (if provided)
   */
  static validateMonth(month?: number | null): boolean {
    if (month === null || month === undefined) return true

    return month >= 1 && month <= 12
  }

  /**
   * Convert domain entity to detailed DTO
   */
  static toDTO(voucherBook: VoucherBookDomain): VoucherBookDetailDTO {
    const dto: VoucherBookDetailDTO = {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition || undefined,
      bookType: voucherBook.bookType,
      month: voucherBook.month || undefined,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || undefined,
      coverImageUrl: voucherBook.coverImageUrl || undefined,
      backImageUrl: voucherBook.backImageUrl || undefined,
      pdfUrl: voucherBook.pdfUrl || undefined,
      pdfGeneratedAt: voucherBook.pdfGeneratedAt?.toISOString() || undefined,
      metadata:
        VoucherBookMapper.ensureMetadata(voucherBook.metadata) || undefined,
      createdBy: voucherBook.createdBy,
      updatedBy: voucherBook.updatedBy || undefined,
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
      deletedAt: voucherBook.deletedAt?.toISOString() || undefined,
      // Required admin fields
      pageCount: voucherBook.totalPages,
      totalPlacements: voucherBook.pages?.length || 0,
      distributionCount: voucherBook.distributions?.length || 0,
    }

    // Add statistics if relations are loaded
    if (voucherBook.pages || voucherBook.distributions) {
      const pagesWithPlacements =
        voucherBook.pages?.filter(
          (page) => page.adPlacements && page.adPlacements.length > 0,
        ).length || 0

      const completionPercentage =
        voucherBook.totalPages > 0
          ? Math.round((pagesWithPlacements / voucherBook.totalPages) * 100)
          : 0

      dto.statistics = {
        totalPages: voucherBook.totalPages,
        pagesWithPlacements,
        completionPercentage,
        totalDistributions: voucherBook.distributions?.length || 0,
        pendingDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'pending')
            .length || 0,
        shippedDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'shipped')
            .length || 0,
        deliveredDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'delivered')
            .length || 0,
      }
    }

    // Add computed properties
    dto.computed = {
      displayName: VoucherBookMapper.getDisplayName(dto),
      displayPeriod: VoucherBookMapper.getDisplayPeriod(dto),
      ageInDays: VoucherBookMapper.getAgeInDays(dto.createdAt),
      isRecent: VoucherBookMapper.isRecent(dto.createdAt),
      canBeEdited: VoucherBookMapper.canBeEdited(dto),
      canBePublished: VoucherBookMapper.canBePublished(dto),
      hasPDF: VoucherBookMapper.hasPDF(dto),
    }

    // Add admin-specific fields (required by admin schema)
    dto.pageCount = voucherBook.pages?.length ?? 0
    dto.totalPlacements =
      voucherBook.pages?.reduce(
        (total, page) => total + (page.adPlacements?.length ?? 0),
        0,
      ) ?? 0
    dto.distributionCount = voucherBook.distributions?.length ?? 0

    return dto
  }

  /**
   * Convert domain entity to admin DTO (matches AdminVoucherBookResponse schema)
   */
  static toAdminDTO(voucherBook: VoucherBookDomain): VoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition || undefined,
      bookType: voucherBook.bookType,
      month: voucherBook.month || undefined,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || undefined,
      coverImageUrl: voucherBook.coverImageUrl || undefined,
      backImageUrl: voucherBook.backImageUrl || undefined,
      pdfUrl: voucherBook.pdfUrl || undefined,
      pdfGeneratedAt: voucherBook.pdfGeneratedAt?.toISOString() || undefined,
      metadata:
        VoucherBookMapper.ensureMetadata(voucherBook.metadata) || undefined,
      createdBy: voucherBook.createdBy,
      updatedBy: voucherBook.updatedBy || undefined,
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
      deletedAt: voucherBook.deletedAt?.toISOString() || undefined,
      // Admin-specific fields (required by admin schema)
      pageCount: voucherBook.pages?.length ?? 0,
      totalPlacements:
        voucherBook.pages?.reduce(
          (total, page) => total + (page.adPlacements?.length ?? 0),
          0,
        ) ?? 0,
      distributionCount: voucherBook.distributions?.length ?? 0,
    }
  }

  /**
   * Convert to simple DTO without relations
   */
  static toSimpleDTO(voucherBook: VoucherBookDocument): VoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition || undefined,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      pdfUrl: voucherBook.pdfUrl,
      pdfGeneratedAt: voucherBook.pdfGeneratedAt?.toISOString() || null,
      metadata:
        VoucherBookMapper.ensureMetadata(voucherBook.metadata) || undefined,
      createdBy: voucherBook.createdBy,
      updatedBy: voucherBook.updatedBy || undefined,
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
      deletedAt: voucherBook.deletedAt?.toISOString() || null,
      // Admin-specific fields (required by admin schema)
      pageCount: 0,
      totalPlacements: 0,
      distributionCount: 0,
    }
  }

  /**
   * Convert to public DTO (limited fields)
   */
  static toPublicDTO(voucherBook: VoucherBookDocument): PublicVoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition || undefined,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      pdfUrl: voucherBook.status === 'published' ? voucherBook.pdfUrl : null, // Only show PDF if published
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
    }
  }

  /**
   * Convert domain object to public DTO (limited fields)
   */
  static toPublicDTOFromDomain(
    voucherBook: VoucherBookDomain,
  ): PublicVoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition || undefined,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      pdfUrl: voucherBook.status === 'published' ? voucherBook.pdfUrl : null, // Only show PDF if published
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
    }
  }

  /**
   * Convert array to DTOs
   */
  static toDTOList(voucherBooks: VoucherBookDocument[]): VoucherBookDTO[] {
    return voucherBooks.map((vb) => VoucherBookMapper.toSimpleDTO(vb))
  }

  /**
   * Convert array to public DTOs
   */
  static toPublicDTOList(
    voucherBooks: VoucherBookDocument[],
  ): PublicVoucherBookDTO[] {
    return voucherBooks.map((vb) => VoucherBookMapper.toPublicDTO(vb))
  }

  /**
   * Convert create DTO to service input (not repository input!)
   */
  static fromCreateDTO(dto: CreateVoucherBookDTO, createdById: string): any {
    // Validate business rules
    if (!VoucherBookMapper.validateYear(dto.year)) {
      throw new Error('VoucherBook year must be between 2020 and 2100')
    }

    if (!VoucherBookMapper.validateMonth(dto.month)) {
      throw new Error('VoucherBook month must be between 1 and 12')
    }

    const totalPages = dto.totalPages || 24

    if (totalPages < 1) {
      throw new Error('VoucherBook must have at least 1 page')
    }

    // Return service input interface (CreateVoucherBookData)
    return {
      title: dto.title,
      edition: dto.edition,
      bookType: dto.bookType || 'monthly',
      month: dto.month,
      year: dto.year,
      totalPages,
      coverImageUrl: dto.coverImageUrl,
      backImageUrl: dto.backImageUrl,
      metadata: dto.metadata || {},
      createdById: createdById, // Service expects createdById, not createdBy
    }
  }

  /**
   * Convert update DTO to database input
   */
  static fromUpdateDTO(dto: UpdateVoucherBookDTO, updatedById: string): any {
    const updates: any = {
      updatedBy: updatedById,
    }

    // Validate year if changed
    if (dto.year !== undefined) {
      if (!VoucherBookMapper.validateYear(dto.year)) {
        throw new Error('VoucherBook year must be between 2020 and 2100')
      }
      updates.year = dto.year
    }

    // Validate month if changed
    if (dto.month !== undefined) {
      if (!VoucherBookMapper.validateMonth(dto.month)) {
        throw new Error('VoucherBook month must be between 1 and 12')
      }
      updates.month = dto.month
    }

    // Validate totalPages if changed
    if (dto.totalPages !== undefined) {
      if (dto.totalPages < 1) {
        throw new Error('VoucherBook must have at least 1 page')
      }
      updates.totalPages = dto.totalPages
    }

    // Copy other fields if provided
    if (dto.title !== undefined) updates.title = dto.title
    if (dto.edition !== undefined) updates.edition = dto.edition
    if (dto.bookType !== undefined) updates.bookType = dto.bookType
    if (dto.status !== undefined) updates.status = dto.status
    if (dto.coverImageUrl !== undefined)
      updates.coverImageUrl = dto.coverImageUrl
    if (dto.backImageUrl !== undefined) updates.backImageUrl = dto.backImageUrl
    if (dto.metadata !== undefined) updates.metadata = dto.metadata

    return updates
  }

  /**
   * Group voucher books by status for dashboard views
   */
  static groupByStatus(
    voucherBooks: VoucherBookDocument[],
  ): Map<string, VoucherBookDTO[]> {
    const statusMap = new Map<string, VoucherBookDTO[]>()

    // Initialize with all statuses
    const statuses: string[] = [
      'draft',
      'ready_for_print',
      'published',
      'archived',
    ]

    statuses.forEach((status) => {
      statusMap.set(status, [])
    })

    // Group books
    for (const book of voucherBooks) {
      const statusList = statusMap.get(book.status) || []

      statusList.push(VoucherBookMapper.toSimpleDTO(book))
      statusMap.set(book.status, statusList)
    }

    return statusMap
  }

  /**
   * Filter books by publication period
   */
  static filterByPeriod(
    voucherBooks: VoucherBookDocument[],
    year: number,
    month?: number,
  ): VoucherBookDocument[] {
    return voucherBooks.filter((book) => {
      if (book.year !== year) return false
      if (month && book.month !== month) return false

      return true
    })
  }

  /**
   * Sort books for display
   * Business rule: Sort by year desc, then month desc, then title
   */
  static sortForDisplay(voucherBooks: VoucherBookDTO[]): VoucherBookDTO[] {
    return [...voucherBooks].sort((a, b) => {
      // First by year (descending)
      if (a.year !== b.year) return b.year - a.year

      // Then by month (descending, nulls last)
      if (a.month !== b.month) {
        if (a.month === null) return 1
        if (b.month === null) return -1

        return (b.month ?? 0) - (a.month ?? 0)
      }

      // Finally by title
      return a.title.localeCompare(b.title)
    })
  }

  /**
   * Map PDF generation result to response DTO
   */
  static toGeneratePDFResponse(result: GeneratePDFResult): {
    jobId: string
    status: 'queued' | 'processing' | 'completed' | 'failed'
    message: string
    estimatedCompletion?: string
    pdfUrl?: string
  } {
    if (result.success) {
      return {
        jobId: `pdf-job-${Date.now()}`,
        status: 'completed',
        message: 'PDF generated successfully',
        pdfUrl: result.filename
          ? `https://example.com/pdfs/${result.filename}`
          : undefined,
      }
    } else {
      return {
        jobId: `pdf-job-${Date.now()}`,
        status: 'failed',
        message: result.error || 'PDF generation failed',
      }
    }
  }

  /**
   * Map bulk operation result to response DTO for API schema
   */
  static toBulkOperationResponse(result: {
    successCount: number
    failedCount: number
    results: Array<{
      bookId: string
      success: boolean
      error?: string
    }>
  }): {
    successful: number
    failed: number
    results: Array<{
      bookId: string
      success: boolean
      error?: string
    }>
  } {
    return {
      successful: result.successCount,
      failed: result.failedCount,
      results: result.results,
    }
  }

  /**
   * Map statistics to response DTO
   */
  static toStatisticsResponse(stats: VoucherBookStatistics): any {
    return {
      total: stats.total,
      byStatus: {
        draft: stats.byStatus.draft,
        readyForPrint: stats.byStatus.readyForPrint,
        published: stats.byStatus.published,
        archived: stats.byStatus.archived,
      },
      byType: {
        monthly: stats.byType.monthly,
        specialEdition: stats.byType.specialEdition,
        regional: stats.byType.regional,
      },
      distributions: {
        total: stats.distributions.total,
        pending: stats.distributions.pending,
        shipped: stats.distributions.shipped,
        delivered: stats.distributions.delivered,
      },
      recentActivity: stats.recentActivity.map((activity) => ({
        date: activity.date.toISOString(),
        action: activity.action,
        count: activity.count,
      })),
    }
  }

  /**
   * Map paginated result to public list response
   */
  static toPublicListResponse(result: {
    data: VoucherBookDocument[]
    pagination: any
  }): {
    data: PublicVoucherBookDTO[]
    pagination: any
  } {
    return {
      data: result.data.map((book) => VoucherBookMapper.toPublicDTO(book)),
      pagination: result.pagination,
    }
  }

  /**
   * Map paginated result to admin list response
   */
  static toAdminListResponse(result: { data: any[]; pagination: any }): {
    data: VoucherBookDetailDTO[]
    pagination: any
  } {
    return {
      data: result.data.map((book) => VoucherBookMapper.toDTO(book)),
      pagination: result.pagination,
    }
  }

  /**
   * Map PDF download info to response DTO
   */
  static toPDFDownloadResponse(downloadInfo: {
    url: string
    filename: string
    contentType?: string
    size?: number
    generatedAt: Date
  }): {
    url: string
    filename: string
    contentType: string
    size?: number
    generatedAt: string
  } {
    return {
      url: downloadInfo.url,
      filename: downloadInfo.filename,
      contentType: downloadInfo.contentType || 'application/pdf',
      size: downloadInfo.size,
      generatedAt: downloadInfo.generatedAt.toISOString(),
    }
  }
}
