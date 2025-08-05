import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'

/**
 * PDF service parameters - shared across all API tiers
 */

/**
 * Voucher book ID parameter
 */
export const VoucherBookIdParam = z.object({
  id: UUID.describe('Voucher book ID'),
})

export type VoucherBookIdParam = z.infer<typeof VoucherBookIdParam>

/**
 * Page ID parameter
 */
export const PageIdParam = z.object({
  pageId: UUID.describe('Page ID'),
})

export type PageIdParam = z.infer<typeof PageIdParam>

/**
 * Placement ID parameter
 */
export const PlacementIdParam = z.object({
  placementId: UUID.describe('Placement ID'),
})

export type PlacementIdParam = z.infer<typeof PlacementIdParam>

/**
 * Distribution ID parameter
 */
export const DistributionIdParam = z.object({
  distributionId: UUID.describe('Distribution ID'),
})

export type DistributionIdParam = z.infer<typeof DistributionIdParam>
