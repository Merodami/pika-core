import type { BookDistribution } from '@prisma/client'

/**
 * DTOs for BookDistribution - defined within the service following established pattern
 */
export interface BookDistributionDTO {
  id: string
  bookId: string
  businessId: string
  businessName: string
  locationId?: string | null
  locationName?: string | null
  quantity: number
  distributionType: string
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  deliveryAddress?: string | null
  status: string
  shippedAt?: string | null
  deliveredAt?: string | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  notes?: string | null
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdById: string
  updatedById?: string | null
}

export interface BookDistributionDetailDTO extends BookDistributionDTO {
  book?: {
    id: string
    title: string
    edition?: string | null
    status: string
  }
  createdBy?: {
    id: string
    email: string
    name: string
  }
  updatedBy?: {
    id: string
    email: string
    name: string
  }
}

export interface CreateBookDistributionDTO {
  bookId: string
  businessId: string
  businessName: string
  locationId?: string | null
  locationName?: string | null
  quantity: number
  distributionType: string
  contactName: string
  contactEmail?: string | null
  contactPhone?: string | null
  deliveryAddress?: string | null
  notes?: string | null
  metadata?: Record<string, any>
}

export interface UpdateBookDistributionDTO {
  quantity?: number
  contactName?: string
  contactEmail?: string | null
  contactPhone?: string | null
  deliveryAddress?: string | null
  status?: string
  shippedAt?: Date | null
  deliveredAt?: Date | null
  trackingNumber?: string | null
  shippingCarrier?: string | null
  notes?: string | null
  metadata?: Record<string, any>
}

export interface ShipDistributionDTO {
  trackingNumber: string
  shippingCarrier: string
  shippedAt?: Date
}

export interface DeliverDistributionDTO {
  deliveredAt?: Date
  notes?: string
}

/**
 * BookDistributionMapper handles data transformation between database entities and DTOs
 * Includes business rules for distribution tracking
 */
export class BookDistributionMapper {
  /**
   * Distribution types enum
   */
  static readonly DISTRIBUTION_TYPES = {
    INITIAL: 'initial',
    REORDER: 'reorder',
    REPLACEMENT: 'replacement',
  } as const

  /**
   * Distribution statuses enum
   */
  static readonly STATUSES = {
    PENDING: 'pending',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  } as const

  /**
   * Ensure metadata is a proper object or null
   */
  private static ensureMetadata(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return value
  }

  /**
   * Validate distribution type
   */
  static isValidDistributionType(type: string): boolean {
    return Object.values(BookDistributionMapper.DISTRIBUTION_TYPES).includes(
      type as any,
    )
  }

  /**
   * Validate status
   */
  static isValidStatus(status: string): boolean {
    return Object.values(BookDistributionMapper.STATUSES).includes(
      status as any,
    )
  }

  /**
   * Check if distribution can be shipped
   * Business rule: Only pending distributions can be shipped
   */
  static canBeShipped(distribution: { status: string }): boolean {
    return distribution.status === BookDistributionMapper.STATUSES.PENDING
  }

  /**
   * Check if distribution can be delivered
   * Business rule: Only shipped distributions can be delivered
   */
  static canBeDelivered(distribution: { status: string }): boolean {
    return distribution.status === BookDistributionMapper.STATUSES.SHIPPED
  }

  /**
   * Check if distribution can be cancelled
   * Business rule: Only pending distributions can be cancelled
   */
  static canBeCancelled(distribution: { status: string }): boolean {
    return distribution.status === BookDistributionMapper.STATUSES.PENDING
  }

  /**
   * Convert database entity to DTO
   */
  static toDTO(
    distribution: BookDistribution & {
      book?: {
        id: string
        title: string
        edition?: string | null
        status: string
      } | null
      createdByUser?: {
        id: string
        email: string
        firstName: string
        lastName: string
      } | null
      updatedByUser?: {
        id: string
        email: string
        firstName: string
        lastName: string
      } | null
    },
  ): BookDistributionDetailDTO {
    const dto: BookDistributionDetailDTO = {
      id: distribution.id,
      bookId: distribution.bookId,
      businessId: distribution.businessId,
      businessName: distribution.businessName,
      locationId: distribution.locationId,
      locationName: distribution.locationName,
      quantity: distribution.quantity,
      distributionType: distribution.distributionType,
      contactName: distribution.contactName,
      contactEmail: distribution.contactEmail,
      contactPhone: distribution.contactPhone,
      deliveryAddress: distribution.deliveryAddress,
      status: distribution.status,
      shippedAt: distribution.shippedAt?.toISOString() || null,
      deliveredAt: distribution.deliveredAt?.toISOString() || null,
      trackingNumber: distribution.trackingNumber,
      shippingCarrier: distribution.shippingCarrier,
      notes: distribution.notes,
      metadata: BookDistributionMapper.ensureMetadata(distribution.metadata),
      createdAt: distribution.createdAt.toISOString(),
      updatedAt: distribution.updatedAt.toISOString(),
      createdById: distribution.createdBy,
      updatedById: distribution.updatedBy,
    }

    // Add book info if available
    if (distribution.book) {
      dto.book = {
        id: distribution.book.id,
        title: distribution.book.title,
        edition: distribution.book.edition,
        status: distribution.book.status,
      }
    }

    // Add creator info if available
    if (distribution.createdByUser) {
      dto.createdBy = {
        id: distribution.createdByUser.id,
        email: distribution.createdByUser.email,
        name: `${distribution.createdByUser.firstName} ${distribution.createdByUser.lastName}`,
      }
    }

    // Add updater info if available
    if (distribution.updatedByUser) {
      dto.updatedBy = {
        id: distribution.updatedByUser.id,
        email: distribution.updatedByUser.email,
        name: `${distribution.updatedByUser.firstName} ${distribution.updatedByUser.lastName}`,
      }
    }

    return dto
  }

  /**
   * Convert to simple DTO without relations
   */
  static toSimpleDTO(distribution: BookDistribution): BookDistributionDTO {
    return {
      id: distribution.id,
      bookId: distribution.bookId,
      businessId: distribution.businessId,
      businessName: distribution.businessName,
      locationId: distribution.locationId,
      locationName: distribution.locationName,
      quantity: distribution.quantity,
      distributionType: distribution.distributionType,
      contactName: distribution.contactName,
      contactEmail: distribution.contactEmail,
      contactPhone: distribution.contactPhone,
      deliveryAddress: distribution.deliveryAddress,
      status: distribution.status,
      shippedAt: distribution.shippedAt?.toISOString() || null,
      deliveredAt: distribution.deliveredAt?.toISOString() || null,
      trackingNumber: distribution.trackingNumber,
      shippingCarrier: distribution.shippingCarrier,
      notes: distribution.notes,
      metadata: BookDistributionMapper.ensureMetadata(distribution.metadata),
      createdAt: distribution.createdAt.toISOString(),
      updatedAt: distribution.updatedAt.toISOString(),
      createdById: distribution.createdBy,
      updatedById: distribution.updatedBy,
    }
  }

  /**
   * Convert array to DTOs
   */
  static toDTOList(distributions: BookDistribution[]): BookDistributionDTO[] {
    return distributions.map((d) => BookDistributionMapper.toSimpleDTO(d))
  }

  /**
   * Convert create DTO to database input
   */
  static fromCreateDTO(
    dto: CreateBookDistributionDTO,
    createdById: string,
  ): any {
    // Validate business rules
    if (!BookDistributionMapper.isValidDistributionType(dto.distributionType)) {
      throw new Error(`Invalid distribution type: ${dto.distributionType}`)
    }

    if (dto.quantity < 1) {
      throw new Error('Distribution quantity must be at least 1')
    }

    return {
      bookId: dto.bookId,
      businessId: dto.businessId,
      businessName: dto.businessName,
      locationId: dto.locationId,
      locationName: dto.locationName,
      quantity: dto.quantity,
      distributionType: dto.distributionType,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      deliveryAddress: dto.deliveryAddress,
      status: BookDistributionMapper.STATUSES.PENDING,
      notes: dto.notes,
      metadata: dto.metadata || {},
      createdBy: createdById,
      updatedBy: createdById,
    }
  }

  /**
   * Convert update DTO to database input
   */
  static fromUpdateDTO(
    dto: UpdateBookDistributionDTO,
    updatedById: string,
  ): any {
    const updates: any = {
      updatedBy: updatedById,
      updatedAt: new Date(),
    }

    // Validate status if changed
    if (dto.status !== undefined) {
      if (!BookDistributionMapper.isValidStatus(dto.status)) {
        throw new Error(`Invalid status: ${dto.status}`)
      }
      updates.status = dto.status
    }

    // Validate quantity if changed
    if (dto.quantity !== undefined) {
      if (dto.quantity < 1) {
        throw new Error('Distribution quantity must be at least 1')
      }
      updates.quantity = dto.quantity
    }

    // Copy other fields if provided
    if (dto.contactName !== undefined) updates.contactName = dto.contactName
    if (dto.contactEmail !== undefined) updates.contactEmail = dto.contactEmail
    if (dto.contactPhone !== undefined) updates.contactPhone = dto.contactPhone
    if (dto.deliveryAddress !== undefined)
      updates.deliveryAddress = dto.deliveryAddress
    if (dto.shippedAt !== undefined) updates.shippedAt = dto.shippedAt
    if (dto.deliveredAt !== undefined) updates.deliveredAt = dto.deliveredAt
    if (dto.trackingNumber !== undefined)
      updates.trackingNumber = dto.trackingNumber
    if (dto.shippingCarrier !== undefined)
      updates.shippingCarrier = dto.shippingCarrier
    if (dto.notes !== undefined) updates.notes = dto.notes
    if (dto.metadata !== undefined) updates.metadata = dto.metadata

    return updates
  }

  /**
   * Convert ship DTO to database input
   * Business rule: Sets status to SHIPPED and records timestamp
   */
  static fromShipDTO(dto: ShipDistributionDTO, updatedById: string): any {
    return {
      status: BookDistributionMapper.STATUSES.SHIPPED,
      trackingNumber: dto.trackingNumber,
      shippingCarrier: dto.shippingCarrier,
      shippedAt: dto.shippedAt || new Date(),
      updatedBy: updatedById,
      updatedAt: new Date(),
    }
  }

  /**
   * Convert deliver DTO to database input
   * Business rule: Sets status to DELIVERED and records timestamp
   */
  static fromDeliverDTO(dto: DeliverDistributionDTO, updatedById: string): any {
    const updates: any = {
      status: BookDistributionMapper.STATUSES.DELIVERED,
      deliveredAt: dto.deliveredAt || new Date(),
      updatedBy: updatedById,
      updatedAt: new Date(),
    }

    if (dto.notes) {
      updates.notes = dto.notes
    }

    return updates
  }

  /**
   * Group distributions by status for dashboard views
   */
  static groupByStatus(
    distributions: BookDistribution[],
  ): Map<string, BookDistributionDTO[]> {
    const statusMap = new Map<string, BookDistributionDTO[]>()

    // Initialize with all statuses
    Object.values(BookDistributionMapper.STATUSES).forEach((status) => {
      statusMap.set(status, [])
    })

    // Group distributions
    for (const distribution of distributions) {
      const statusList = statusMap.get(distribution.status) || []

      statusList.push(BookDistributionMapper.toSimpleDTO(distribution))
      statusMap.set(distribution.status, statusList)
    }

    return statusMap
  }

  /**
   * Calculate distribution statistics
   */
  static calculateStats(distributions: BookDistribution[]): {
    total: number
    pending: number
    shipped: number
    delivered: number
    cancelled: number
    totalQuantity: number
  } {
    const stats = {
      total: distributions.length,
      pending: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalQuantity: 0,
    }

    for (const distribution of distributions) {
      stats.totalQuantity += distribution.quantity

      switch (distribution.status) {
        case BookDistributionMapper.STATUSES.PENDING:
          stats.pending++
          break
        case BookDistributionMapper.STATUSES.SHIPPED:
          stats.shipped++
          break
        case BookDistributionMapper.STATUSES.DELIVERED:
          stats.delivered++
          break
        case BookDistributionMapper.STATUSES.CANCELLED:
          stats.cancelled++
          break
      }
    }

    return stats
  }

  /**
   * Get display name for distribution
   * Business rule: Combines business name with location if available
   */
  static getDisplayName(distribution: BookDistributionDTO): string {
    if (distribution.locationName) {
      return `${distribution.businessName} - ${distribution.locationName}`
    }

    return distribution.businessName
  }

  /**
   * Calculate days in current status
   */
  static getDaysInStatus(distribution: BookDistributionDTO): number {
    let statusDate: Date

    switch (distribution.status) {
      case BookDistributionMapper.STATUSES.SHIPPED:
        statusDate = distribution.shippedAt
          ? new Date(distribution.shippedAt)
          : new Date(distribution.createdAt)
        break
      case BookDistributionMapper.STATUSES.DELIVERED:
        statusDate = distribution.deliveredAt
          ? new Date(distribution.deliveredAt)
          : new Date(distribution.createdAt)
        break
      default:
        statusDate = new Date(distribution.createdAt)
    }

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - statusDate.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}
