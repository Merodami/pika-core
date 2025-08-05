import { AdminVoucherSortBy } from '@pika/types'
import { z } from 'zod'

import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { AnalyticsGroupBySchema } from '../../shared/query.js'
import {
  AdminVoucherSortBySchema,
  VoucherDiscountTypeSchema,
  VoucherStateSchema,
} from '../common/enums.js'
import {
  GeographicSearchParams,
  VoucherFilterParams,
} from '../common/queries.js'
import { ADMIN_VOUCHER_ALLOWED_RELATIONS } from '../common/relations.js'

/**
 * Admin voucher query parameters
 * Following the standardized SearchParams pattern with industry-standard include relations
 */

/**
 * Admin voucher search parameters
 * Extends SearchParams with voucher-specific filters
 */
export const AdminVoucherQueryParams = SearchParams.extend({
  // Voucher-specific filters
  businessId: UUID.optional(),
  categoryId: UUID.optional(),
  state: VoucherStateSchema.optional(),
  discountType: VoucherDiscountTypeSchema.optional(),
  minDiscount: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  currency: z.string().optional(),

  // Date filters
  validFromStart: DateTime.optional(),
  validFromEnd: DateTime.optional(),
  expiresAtStart: DateTime.optional(),
  expiresAtEnd: DateTime.optional(),
  createdFromStart: DateTime.optional(),
  createdFromEnd: DateTime.optional(),

  // Analytics filters
  minRedemptions: z.number().int().nonnegative().optional(),
  maxRedemptions: z.number().int().nonnegative().optional(),
  minScans: z.number().int().nonnegative().optional(),
  maxScans: z.number().int().nonnegative().optional(),

  // Admin-specific status filters
  isDeleted: z.boolean().optional(),

  // Override sortBy with service-specific enum
  sortBy: AdminVoucherSortBySchema.default(AdminVoucherSortBy.CREATED_AT),

  // Include relations (industry standard pattern)
  include: z
    .string()
    .optional()
    .describe(
      `Comma-separated relations: ${ADMIN_VOUCHER_ALLOWED_RELATIONS.join(',')}`,
    ),
})
  .merge(GeographicSearchParams)
  .merge(VoucherFilterParams)

export type AdminVoucherQueryParams = z.infer<typeof AdminVoucherQueryParams>

/**
 * Voucher analytics query parameters
 */
export const VoucherAnalyticsQueryParams = z.object({
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: AnalyticsGroupBySchema.optional(),
})

export type VoucherAnalyticsQueryParams = z.infer<
  typeof VoucherAnalyticsQueryParams
>

/**
 * Business voucher stats query parameters
 */
export const BusinessVoucherStatsQueryParams = z.object({
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: AnalyticsGroupBySchema.optional(),
})

export type BusinessVoucherStatsQueryParams = z.infer<
  typeof BusinessVoucherStatsQueryParams
>
