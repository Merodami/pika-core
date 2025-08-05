import { ErrorFactory, logger } from '@pika/shared'

export type AdSize = 'single' | 'quarter' | 'half' | 'full'

export interface AdPlacementInfo {
  id: string
  position: number
  size: AdSize
  spacesUsed: number
  contentType: 'voucher' | 'image' | 'ad' | 'sponsored'
  voucherId?: string
  imageUrl?: string
  designUrl?: string // Deprecated, use imageUrl
  qrPayload?: string
  shortCode?: string
  title?: string
  description?: string
}

export interface PageLayout {
  pageNumber: number
  placements: AdPlacementInfo[]
  occupiedSpaces: Set<number>
  availableSpaces: number[]
}

export class PageLayoutEngine {
  private readonly SPACES_PER_PAGE = 8
  private readonly ROWS = 4
  private readonly COLS = 2

  /**
   * Get the number of spaces required for each ad size
   */
  getRequiredSpaces(size: AdSize): number {
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
   * Check if an ad can be placed at a specific position
   */
  canPlaceAd(
    occupiedSpaces: Set<number>,
    startPosition: number,
    size: AdSize,
  ): boolean {
    const requiredSpaces = this.getRequiredSpaces(size)

    // Check if start position is valid
    if (startPosition < 1 || startPosition > this.SPACES_PER_PAGE) {
      return false
    }

    // Check if all required positions are free
    for (let i = 0; i < requiredSpaces; i++) {
      const position = startPosition + i

      if (position > this.SPACES_PER_PAGE || occupiedSpaces.has(position)) {
        return false
      }
    }

    // Additional constraints for specific sizes
    if (size === 'half') {
      // Half page must start at position 1 or 5 (top or bottom half)
      return startPosition === 1 || startPosition === 5
    }

    if (size === 'full') {
      // Full page must start at position 1
      return startPosition === 1
    }

    if (size === 'quarter') {
      // Quarter page must align properly (1, 3, 5, 7)
      return [1, 3, 5, 7].includes(startPosition)
    }

    return true
  }

  /**
   * Find the next available position for an ad of given size
   */
  findAvailablePosition(
    occupiedSpaces: Set<number>,
    size: AdSize,
  ): number | null {
    const possibleStartPositions = this.getPossibleStartPositions(size)

    for (const position of possibleStartPositions) {
      if (this.canPlaceAd(occupiedSpaces, position, size)) {
        return position
      }
    }

    return null
  }

  /**
   * Get possible start positions based on ad size
   */
  private getPossibleStartPositions(size: AdSize): number[] {
    switch (size) {
      case 'full':
        return [1]
      case 'half':
        return [1, 5]
      case 'quarter':
        return [1, 3, 5, 7]
      case 'single':
        return Array.from({ length: this.SPACES_PER_PAGE }, (_, i) => i + 1)
      default:
        return []
    }
  }

  /**
   * Allocate space for an ad placement
   */
  allocateSpace(
    pageLayout: PageLayout,
    placement: Omit<AdPlacementInfo, 'position' | 'spacesUsed'>,
  ): AdPlacementInfo | null {
    const position = this.findAvailablePosition(
      pageLayout.occupiedSpaces,
      placement.size,
    )

    if (position === null) {
      logger.warn('No available position for ad placement', {
        pageNumber: pageLayout.pageNumber,
        size: placement.size,
        occupiedSpaces: Array.from(pageLayout.occupiedSpaces),
      })

      return null
    }

    const spacesUsed = this.getRequiredSpaces(placement.size)

    // Mark spaces as occupied
    for (let i = 0; i < spacesUsed; i++) {
      pageLayout.occupiedSpaces.add(position + i)
    }

    // Update available spaces
    pageLayout.availableSpaces = pageLayout.availableSpaces.filter(
      (space) => !pageLayout.occupiedSpaces.has(space),
    )

    const allocatedPlacement: AdPlacementInfo = {
      ...placement,
      position,
      spacesUsed,
    }

    pageLayout.placements.push(allocatedPlacement)

    logger.debug('Allocated ad placement', {
      pageNumber: pageLayout.pageNumber,
      position,
      size: placement.size,
      spacesUsed,
    })

    return allocatedPlacement
  }

  /**
   * Create an empty page layout
   */
  createEmptyPage(pageNumber: number): PageLayout {
    return {
      pageNumber,
      placements: [],
      occupiedSpaces: new Set<number>(),
      availableSpaces: Array.from(
        { length: this.SPACES_PER_PAGE },
        (_, i) => i + 1,
      ),
    }
  }

  /**
   * Get the grid position (row, col) for a space number
   */
  getGridPosition(spaceNumber: number): { row: number; col: number } {
    if (spaceNumber < 1 || spaceNumber > this.SPACES_PER_PAGE) {
      throw ErrorFactory.validationError(
        { spaceNumber: [`Invalid space number: ${spaceNumber}`] },
        { source: 'PageLayoutEngine.getGridPosition' },
      )
    }

    // Spaces are numbered 1-8, arranged in 4 rows x 2 columns
    // 1 2
    // 3 4
    // 5 6
    // 7 8
    const zeroIndexed = spaceNumber - 1
    const row = Math.floor(zeroIndexed / this.COLS)
    const col = zeroIndexed % this.COLS

    return { row, col }
  }

  /**
   * Calculate the bounds (x, y, width, height) for an ad placement
   * Coordinates are in points (1/72 inch)
   */
  calculateBounds(
    placement: AdPlacementInfo,
    pageWidth: number,
    pageHeight: number,
    margin: number = 10,
  ): { x: number; y: number; width: number; height: number } {
    const cellWidth = (pageWidth - 2 * margin) / this.COLS
    const cellHeight = (pageHeight - 2 * margin) / this.ROWS

    const { row, col } = this.getGridPosition(placement.position)

    let x = margin + col * cellWidth
    let y = margin + row * cellHeight
    let width = cellWidth
    let height = cellHeight

    // Adjust dimensions based on ad size
    switch (placement.size) {
      case 'quarter':
        width = cellWidth * 2 // Spans 2 columns
        break
      case 'half':
        width = cellWidth * 2 // Spans 2 columns
        height = cellHeight * 2 // Spans 2 rows
        break
      case 'full':
        width = cellWidth * 2 // Spans 2 columns
        height = cellHeight * 4 // Spans 4 rows
        break
    }

    // Apply small padding between cells
    const padding = 5

    x += padding / 2
    y += padding / 2
    width -= padding
    height -= padding

    return { x, y, width, height }
  }

  /**
   * Validate a complete page layout
   */
  validatePageLayout(pageLayout: PageLayout): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check for overlapping placements
    const occupiedCheck = new Set<number>()

    for (const placement of pageLayout.placements) {
      for (let i = 0; i < placement.spacesUsed; i++) {
        const space = placement.position + i

        if (occupiedCheck.has(space)) {
          errors.push(`Space ${space} is occupied by multiple placements`)
        }
        occupiedCheck.add(space)
      }
    }

    // Validate each placement position
    for (const placement of pageLayout.placements) {
      if (!this.canPlaceAd(new Set(), placement.position, placement.size)) {
        errors.push(
          `Invalid position ${placement.position} for ${placement.size} ad`,
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
