import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import type { AdPlacementDomain } from '@pika/sdk'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'
import type { ContentType } from '@prisma/client'

import type {
  IAdPlacementRepository,
  IVoucherBookPageRepository,
  IVoucherBookRepository,
} from '../repositories/index.js'
import { AdSize, PageLayoutEngine } from './PageLayoutEngine.js'

export interface CreateAdPlacementData {
  pageId: string
  position: number
  size: AdSize
  contentType: ContentType
  title: string
  description?: string
  imageUrl?: string
  voucherId?: string
  qrCodePayload?: string
  shortCode?: string
  metadata?: Record<string, any>
  createdById: string
}

export interface UpdateAdPlacementData {
  position?: number
  contentType?: ContentType
  title?: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  displayOrder?: number
  isActive?: boolean
  updatedById: string
}

export interface ReorderPlacementData {
  id: string
  position: number
}

export interface PlacementValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  conflictingPlacements: string[]
}

export interface IAdPlacementService {
  createAdPlacement(data: CreateAdPlacementData): Promise<AdPlacementDomain>
  getAdPlacementById(id: string): Promise<AdPlacementDomain>
  getAdPlacementsByVoucherBookId(
    voucherBookId: string,
  ): Promise<AdPlacementDomain[]>
  updateAdPlacement(
    id: string,
    data: UpdateAdPlacementData,
  ): Promise<AdPlacementDomain>
  deleteAdPlacement(id: string): Promise<void>
  reorderPlacements(
    voucherBookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void>
  validatePlacement(
    voucherBookId: string,
    position: number,
    excludeId?: string,
  ): Promise<PlacementValidation>
  getOptimalPlacementSuggestions(
    voucherBookId: string,
    contentType: ContentType,
  ): Promise<number[]>
}

/**
 * AdPlacementService manages advertisement placement with sophisticated layout validation.
 *
 * Uses the proven PageLayoutEngine from the original Pika service for:
 * - Grid-based layout system (2x4 grid = 8 spaces)
 * - Size validation (SINGLE=1, QUARTER=2, HALF=4, FULL=8 spaces)
 * - Position conflict detection
 * - Optimal placement suggestions
 *
 * Position mapping:
 * - SINGLE → 1 space
 * - QUARTER → 2 spaces
 * - HALF → 4 spaces
 * - FULL → 8 spaces (entire page)
 */
export class AdPlacementService implements IAdPlacementService {
  private readonly pageLayoutEngine: PageLayoutEngine

  constructor(
    private readonly placementRepository: IAdPlacementRepository,
    private readonly voucherBookRepository: IVoucherBookRepository,
    private readonly pageRepository: IVoucherBookPageRepository,
    private readonly cache: ICacheService,
  ) {
    this.pageLayoutEngine = new PageLayoutEngine()
  }

  async createAdPlacement(
    data: CreateAdPlacementData,
  ): Promise<AdPlacementDomain> {
    try {
      logger.info('Creating ad placement', {
        pageId: data.pageId,
        position: data.position,
        contentType: data.contentType,
        size: data.size,
      })

      // Validate placement using layout engine
      const existingPlacements = await this.placementRepository.findByPageId(
        data.pageId,
      )
      const occupiedSpaces = new Set<number>()

      for (const placement of existingPlacements) {
        for (let i = 0; i < placement.spacesUsed; i++) {
          occupiedSpaces.add(placement.position + i)
        }
      }

      // Check if the placement can fit
      if (
        !this.pageLayoutEngine.canPlaceAd(
          occupiedSpaces,
          data.position,
          data.size,
        )
      ) {
        throw ErrorFactory.badRequest(
          `Cannot place ${data.size} ad at position ${data.position} - space occupied or invalid position`,
        )
      }

      // Calculate spaces used based on size
      const spacesUsed = this.pageLayoutEngine.getRequiredSpaces(data.size)

      const placement = await this.placementRepository.create({
        pageId: data.pageId,
        contentType: data.contentType,
        position: data.position,
        size: data.size,
        spacesUsed,
        imageUrl: data.imageUrl,
        qrCodePayload: data.qrCodePayload,
        shortCode: data.shortCode,
        title: data.title,
        description: data.description,
        metadata: data.metadata,
        createdBy: data.createdById,
      })

      // Invalidate cache
      await this.invalidateRelatedCache(data.pageId)

      logger.info('Ad placement created successfully', {
        id: placement.id,
        pageId: data.pageId,
        position: data.position,
      })

      return placement
    } catch (error) {
      logger.error('Failed to create ad placement', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:ad-placement',
    keyGenerator: (id) => id,
  })
  async getAdPlacementById(id: string): Promise<AdPlacementDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const placement = await this.placementRepository.findById(id)

      if (!placement) {
        throw ErrorFactory.resourceNotFound('AdPlacement', id)
      }

      return placement
    } catch (error) {
      logger.error('Failed to get ad placement by ID', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:ad-placements-book',
    keyGenerator: (voucherBookId) => voucherBookId,
  })
  async getAdPlacementsByVoucherBookId(
    voucherBookId: string,
  ): Promise<AdPlacementDomain[]> {
    try {
      if (!isUuidV4(voucherBookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const placements =
        await this.placementRepository.findByBookId(voucherBookId)

      return placements
    } catch (error) {
      logger.error('Failed to get ad placements by voucher book ID', {
        error,
        voucherBookId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateAdPlacement(
    id: string,
    data: UpdateAdPlacementData,
  ): Promise<AdPlacementDomain> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const currentPlacement = await this.getAdPlacementById(id)

      // Get page to find book ID
      const page = await this.pageRepository.findById(currentPlacement.pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound(
          'VoucherBookPage',
          currentPlacement.pageId,
        )
      }

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(page.bookId)

      // If position is changing, validate new position
      if (data.position && data.position !== currentPlacement.position) {
        const validation = await this.validatePlacement(
          page.bookId,
          data.position,
          id, // Exclude current placement from conflict check
        )

        if (!validation.isValid) {
          throw ErrorFactory.badRequest(
            `Position validation failed: ${validation.errors.join(', ')}`,
          )
        }
      }

      // Validate content type requirements
      if (data.contentType || data.imageUrl) {
        this.validateContentTypeData({
          contentType:
            data.contentType || (currentPlacement.contentType as ContentType),
          imageUrl: data.imageUrl,
          title: data.title ?? currentPlacement.title ?? undefined,
          description:
            data.description ?? currentPlacement.description ?? undefined,
        })
      }

      const updatedPlacement = await this.placementRepository.update(id, data)

      // Invalidate cache
      await this.invalidateRelatedCache(page.bookId)
      await this.cache.del(`service:ad-placement:${id}`)

      logger.info('Ad placement updated', {
        id,
        updatedFields: Object.keys(data),
      })

      return updatedPlacement
    } catch (error) {
      logger.error('Failed to update ad placement', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteAdPlacement(id: string): Promise<void> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const placement = await this.getAdPlacementById(id)

      // Get page to find book ID
      const page = await this.pageRepository.findById(placement.pageId)

      if (!page) {
        throw ErrorFactory.resourceNotFound('VoucherBookPage', placement.pageId)
      }

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(page.bookId)

      await this.placementRepository.delete(id)

      // Invalidate cache
      await this.invalidateRelatedCache(page.bookId)
      await this.cache.del(`service:ad-placement:${id}`)

      logger.info('Ad placement deleted', { id })
    } catch (error) {
      logger.error('Failed to delete ad placement', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async reorderPlacements(
    voucherBookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void> {
    try {
      if (!isUuidV4(voucherBookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(voucherBookId)

      // Validate all placements belong to the voucher book
      const placements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const placementIds = new Set(placements.map((p) => p.id))

      for (const { id } of reorderData) {
        if (!placementIds.has(id)) {
          throw ErrorFactory.badRequest(
            `Placement ${id} does not belong to voucher book ${voucherBookId}`,
          )
        }
      }

      await this.placementRepository.reorderPlacements(
        voucherBookId,
        reorderData,
        userId,
      )

      // Invalidate cache
      await this.invalidateRelatedCache(voucherBookId)

      logger.info('Ad placements reordered', {
        voucherBookId,
        count: reorderData.length,
      })
    } catch (error) {
      logger.error('Failed to reorder ad placements', {
        error,
        voucherBookId,
        reorderData,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async validatePlacement(
    voucherBookId: string,
    position: number,
    excludeId?: string,
  ): Promise<PlacementValidation> {
    try {
      const errors: string[] = []
      const warnings: string[] = []
      const conflictingPlacements: string[] = []

      // Get existing placements
      const existingPlacements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const activePlacements = existingPlacements.filter(
        (p) => !excludeId || p.id !== excludeId,
      )

      // Map our position enum to the layout engine's AdSize
      const adSize = this.mapPositionToAdSize()

      this.pageLayoutEngine.getRequiredSpaces(adSize)

      // Use the sophisticated layout engine for validation
      const canPlace = this.pageLayoutEngine.canPlaceAd(
        this.buildOccupiedSpacesFromPlacements(activePlacements),
        position, // Use the actual position
        adSize,
      )

      if (!canPlace) {
        errors.push(
          `Cannot place ${adSize} ad at position ${position} - space is occupied or invalid`,
        )

        // Find conflicting placements
        for (const placement of activePlacements) {
          if (this.checkPositionConflict(position, placement.position)) {
            conflictingPlacements.push(placement.id)
          }
        }
      }

      // Add warnings for layout optimization
      if (activePlacements.length === 0 && position !== 8) {
        warnings.push('Consider using position 1-8 for better placement')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        conflictingPlacements,
      }
    } catch (error) {
      logger.error('Failed to validate placement', {
        error,
        voucherBookId,
        position,
      })

      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
        warnings: [],
        conflictingPlacements: [],
      }
    }
  }

  async getOptimalPlacementSuggestions(
    voucherBookId: string,
    contentType: ContentType,
  ): Promise<number[]> {
    try {
      const existingPlacements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const suggestions: number[] = []

      // Get occupied positions
      const occupiedPositions = new Set(
        existingPlacements.map((p) => p.position),
      )

      // Test each position (1-8)
      for (let position = 1; position <= 8; position++) {
        // Skip if position is already occupied
        if (occupiedPositions.has(position)) {
          continue
        }

        const validation = await this.validatePlacement(voucherBookId, position)

        if (validation.isValid) {
          suggestions.push(position)
        }
      }

      // Prioritize based on content type and existing placements
      return this.prioritizeSuggestions(suggestions, contentType)
    } catch (error) {
      logger.error('Failed to get optimal placement suggestions', {
        error,
        voucherBookId,
        contentType,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Private helper methods
   */

  private async validateVoucherBookModifiable(
    voucherBookId: string,
  ): Promise<void> {
    const voucherBook = await this.voucherBookRepository.findById(voucherBookId)

    if (!voucherBook) {
      throw ErrorFactory.resourceNotFound('VoucherBook', voucherBookId)
    }

    if (
      voucherBook.status === 'PUBLISHED' ||
      voucherBook.status === 'ARCHIVED'
    ) {
      throw ErrorFactory.badRequest(
        `Cannot modify placements in ${voucherBook.status.toLowerCase()} voucher book`,
      )
    }
  }

  private validateContentTypeData(
    data: Partial<CreateAdPlacementData & UpdateAdPlacementData>,
  ): void {
    switch (data.contentType) {
      case 'image':
        if (!data.imageUrl) {
          throw ErrorFactory.badRequest(
            'Image URL is required for IMAGE content type',
          )
        }
        break
      // 'text' is not a valid ContentType in the current schema
      case 'voucher':
        // Voucher placements are validated separately
        break
      case 'ad':
        if (!data.title) {
          throw ErrorFactory.badRequest('Title is required for AD content type')
        }
        break
    }
  }

  private async getNextPosition(voucherBookId: string): Promise<number> {
    const existingPlacements =
      await this.getAdPlacementsByVoucherBookId(voucherBookId)
    const maxPosition = Math.max(
      ...existingPlacements.map((p) => p.position),
      0,
    )

    return maxPosition + 1
  }

  private async invalidateRelatedCache(voucherBookId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`service:ad-placements-book:${voucherBookId}`),
      this.cache.del(`service:voucher-book:${voucherBookId}`),
    ])
  }

  private mapPositionToAdSize(): AdSize {
    // For the current implementation, we'll use a default size
    // In the future, this could be enhanced to determine size based on position
    return 'single'
  }

  private buildOccupiedSpacesFromPlacements(
    placements: AdPlacementDomain[],
  ): Set<number> {
    const occupiedSpaces = new Set<number>()

    for (const _ of placements) {
      const adSize = this.mapPositionToAdSize()
      const requiredSpaces = this.pageLayoutEngine.getRequiredSpaces(adSize)

      // Simplified space mapping - in real implementation would be more sophisticated
      for (let i = 0; i < requiredSpaces; i++) {
        occupiedSpaces.add(i + 1)
      }
    }

    return occupiedSpaces
  }

  private checkPositionConflict(position1: number, position2: number): boolean {
    // Simple position conflict check
    // Two placements conflict if they have the same position
    return position1 === position2
  }

  private prioritizeSuggestions(
    suggestions: number[],
    contentType: ContentType,
  ): number[] {
    // Position preferences based on content type
    // Different content types might prefer different positions on the page
    const positionPreference: Record<ContentType, number[]> = {
      // Vouchers: prefer top positions for visibility
      voucher: [1, 2, 3, 4, 5, 6, 7, 8],
      // Ads: prefer middle positions
      ad: [3, 4, 5, 6, 1, 2, 7, 8],
      // Images: prefer positions that work well for larger sizes
      image: [1, 5, 3, 7, 2, 6, 4, 8],
      // Sponsored: no preference, use natural order
      sponsored: [1, 2, 3, 4, 5, 6, 7, 8],
    }

    const preferredOrder = positionPreference[
      contentType as keyof typeof positionPreference
    ] || [1, 2, 3, 4, 5, 6, 7, 8]

    // Sort suggestions based on preferred order
    return suggestions.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a)
      const bIndex = preferredOrder.indexOf(b)

      // If both are in preferred order, sort by preference
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      // If only one is in preferred order, prefer it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      // Otherwise, sort by position number
      return a - b
    })
  }
}
