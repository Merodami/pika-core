import type { AdPlacement, AdSize, ContentType } from '@prisma/client'

/**
 * DTOs for AdPlacement - defined within the service following established pattern
 */
export interface AdPlacementDTO {
  id: string
  pageId: string
  contentType: ContentType
  position: number
  size: AdSize
  spacesUsed: number
  imageUrl?: string | null
  qrCodePayload?: string | null
  shortCode?: string | null
  title?: string | null
  description?: string | null
  metadata?: Record<string, any>
  createdById: string
  updatedById?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdPlacementDetailDTO extends AdPlacementDTO {
  page?: {
    id: string
    pageNumber: number
    bookId: string
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

export interface CreateAdPlacementDTO {
  pageId: string
  contentType: ContentType
  position: number
  size: AdSize
  imageUrl?: string | null
  qrCodePayload?: string | null
  shortCode?: string | null
  title?: string | null
  description?: string | null
  metadata?: Record<string, any>
}

export interface UpdateAdPlacementDTO {
  contentType?: ContentType
  position?: number
  size?: AdSize
  imageUrl?: string | null
  qrCodePayload?: string | null
  shortCode?: string | null
  title?: string | null
  description?: string | null
  metadata?: Record<string, any>
}

/**
 * AdPlacementMapper handles data transformation between database entities and DTOs
 * Includes critical business rules from the old system
 */
export class AdPlacementMapper {
  /**
   * Get the number of spaces a placement size occupies
   * Critical business rule: SINGLE=1, QUARTER=2, HALF=4, FULL=8
   */
  static getSpaceCount(size: AdSize): number {
    switch (size) {
      case 'single':
        return 1
      case 'quarter':
        return 2
      case 'half':
        return 4
      case 'full':
        return 8
      default:
        return 1
    }
  }

  /**
   * Ensure metadata is a proper object or null
   * Business rule from old system
   */
  private static ensureMetadata(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return value
  }

  /**
   * Validate placement position
   * Business rule: Position must be between 1-8
   */
  static validatePosition(position: number): boolean {
    return position >= 1 && position <= 8
  }

  /**
   * Get end position for a placement
   * Business rule: endPosition = position + spaceCount - 1
   */
  static getEndPosition(placement: { position: number; size: AdSize }): number {
    return (
      placement.position + AdPlacementMapper.getSpaceCount(placement.size) - 1
    )
  }

  /**
   * Check if placement overlaps with position range
   * Business rule for placement conflict detection
   */
  static overlapsWithPositions(
    placement: { position: number; size: AdSize },
    startPos: number,
    endPos: number,
  ): boolean {
    const placementEnd = AdPlacementMapper.getEndPosition(placement)

    return !(endPos < placement.position || startPos > placementEnd)
  }

  /**
   * Convert database entity to DTO
   */
  static toDTO(
    placement: AdPlacement & {
      page?: { id: string; pageNumber: number; bookId: string } | null
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
  ): AdPlacementDetailDTO {
    const dto: AdPlacementDetailDTO = {
      id: placement.id,
      pageId: placement.pageId,
      contentType: placement.contentType,
      position: placement.position,
      size: placement.size,
      spacesUsed: placement.spacesUsed,
      imageUrl: placement.imageUrl,
      qrCodePayload: placement.qrCodePayload,
      shortCode: placement.shortCode,
      title: placement.title,
      description: placement.description,
      metadata: AdPlacementMapper.ensureMetadata(placement.metadata),
      createdById: placement.createdBy,
      updatedById: placement.updatedBy,
      createdAt: placement.createdAt.toISOString(),
      updatedAt: placement.updatedAt.toISOString(),
    }

    // Add page info if available
    if (placement.page) {
      dto.page = {
        id: placement.page.id,
        pageNumber: placement.page.pageNumber,
        bookId: placement.page.bookId,
      }
    }

    // Add creator info if available
    if (placement.createdByUser) {
      dto.createdBy = {
        id: placement.createdByUser.id,
        email: placement.createdByUser.email,
        name: `${placement.createdByUser.firstName} ${placement.createdByUser.lastName}`,
      }
    }

    // Add updater info if available
    if (placement.updatedByUser) {
      dto.updatedBy = {
        id: placement.updatedByUser.id,
        email: placement.updatedByUser.email,
        name: `${placement.updatedByUser.firstName} ${placement.updatedByUser.lastName}`,
      }
    }

    return dto
  }

  /**
   * Convert to simple DTO without relations
   */
  static toSimpleDTO(placement: AdPlacement): AdPlacementDTO {
    return {
      id: placement.id,
      pageId: placement.pageId,
      contentType: placement.contentType,
      position: placement.position,
      size: placement.size,
      spacesUsed: placement.spacesUsed,
      imageUrl: placement.imageUrl,
      qrCodePayload: placement.qrCodePayload,
      shortCode: placement.shortCode,
      title: placement.title,
      description: placement.description,
      metadata: AdPlacementMapper.ensureMetadata(placement.metadata),
      createdById: placement.createdBy,
      updatedById: placement.updatedBy,
      createdAt: placement.createdAt.toISOString(),
      updatedAt: placement.updatedAt.toISOString(),
    }
  }

  /**
   * Convert array to DTOs
   */
  static toDTOList(placements: AdPlacement[]): AdPlacementDTO[] {
    return placements.map((p) => AdPlacementMapper.toSimpleDTO(p))
  }

  /**
   * Convert create DTO to database input
   */
  static fromCreateDTO(dto: CreateAdPlacementDTO, createdById: string): any {
    const spacesUsed = AdPlacementMapper.getSpaceCount(dto.size)

    // Validate business rules
    if (!AdPlacementMapper.validatePosition(dto.position)) {
      throw new Error('AdPlacement position must be between 1 and 8')
    }

    const endPosition = dto.position + spacesUsed - 1

    if (endPosition > 8) {
      throw new Error('AdPlacement exceeds page boundaries')
    }

    // Validate content type specific requirements
    if (dto.contentType === 'voucher') {
      if (!dto.qrCodePayload) {
        throw new Error(
          'AdPlacement qrCodePayload is required for VOUCHER content',
        )
      }
      if (!dto.shortCode) {
        throw new Error('AdPlacement shortCode is required for VOUCHER content')
      }
    }

    return {
      pageId: dto.pageId,
      contentType: dto.contentType,
      position: dto.position,
      size: dto.size,
      spacesUsed,
      imageUrl: dto.imageUrl,
      qrCodePayload: dto.qrCodePayload,
      shortCode: dto.shortCode,
      title: dto.title,
      description: dto.description,
      metadata: dto.metadata || {},
      createdBy: createdById,
      updatedBy: createdById,
    }
  }

  /**
   * Convert update DTO to database input
   */
  static fromUpdateDTO(dto: UpdateAdPlacementDTO, updatedById: string): any {
    const updates: any = {
      updatedBy: updatedById,
      updatedAt: new Date(),
    }

    // Handle size changes
    if (dto.size !== undefined) {
      updates.size = dto.size
      updates.spacesUsed = AdPlacementMapper.getSpaceCount(dto.size)
    }

    // Validate position if changed
    if (dto.position !== undefined) {
      if (!AdPlacementMapper.validatePosition(dto.position)) {
        throw new Error('AdPlacement position must be between 1 and 8')
      }
      updates.position = dto.position
    }

    // Copy other fields if provided
    if (dto.contentType !== undefined) updates.contentType = dto.contentType
    if (dto.imageUrl !== undefined) updates.imageUrl = dto.imageUrl
    if (dto.qrCodePayload !== undefined)
      updates.qrCodePayload = dto.qrCodePayload
    if (dto.shortCode !== undefined) updates.shortCode = dto.shortCode
    if (dto.title !== undefined) updates.title = dto.title
    if (dto.description !== undefined) updates.description = dto.description
    if (dto.metadata !== undefined) updates.metadata = dto.metadata

    return updates
  }

  /**
   * Group placements by page for rendering
   * Business logic from old system
   */
  static groupByPage(placements: AdPlacement[]): Map<number, AdPlacementDTO[]> {
    const pageMap = new Map<number, AdPlacementDTO[]>()

    // Group placements by their page number
    for (const placement of placements) {
      if ('page' in placement && placement.page) {
        const pageNumber = (placement.page as any).pageNumber
        const pagePlacements = pageMap.get(pageNumber) || []

        pagePlacements.push(AdPlacementMapper.toSimpleDTO(placement))
        pageMap.set(pageNumber, pagePlacements)
      }
    }

    // Sort placements within each page by position
    pageMap.forEach((pagePlacementList) => {
      pagePlacementList.sort((a, b) => a.position - b.position)
    })

    return pageMap
  }

  /**
   * Calculate total spaces used on a page
   * Business rule for page capacity checking
   */
  static calculatePageSpaceUsage(placements: AdPlacement[]): number {
    return placements.reduce((total, placement) => {
      return total + AdPlacementMapper.getSpaceCount(placement.size)
    }, 0)
  }

  /**
   * Check if a page is full (8 spaces used)
   */
  static isPageFull(placements: AdPlacement[]): boolean {
    return AdPlacementMapper.calculatePageSpaceUsage(placements) >= 8
  }

  /**
   * Get available spaces on a page
   */
  static getAvailableSpaces(placements: AdPlacement[]): number {
    const usedSpaces = AdPlacementMapper.calculatePageSpaceUsage(placements)

    return Math.max(0, 8 - usedSpaces)
  }

  /**
   * Find conflicting placements for a proposed placement
   */
  static findConflicts(
    existingPlacements: AdPlacement[],
    proposedPlacement: { position: number; size: AdSize },
  ): AdPlacement[] {
    const proposedEnd = AdPlacementMapper.getEndPosition(proposedPlacement)

    return existingPlacements.filter((existing) =>
      AdPlacementMapper.overlapsWithPositions(
        existing,
        proposedPlacement.position,
        proposedEnd,
      ),
    )
  }
}
