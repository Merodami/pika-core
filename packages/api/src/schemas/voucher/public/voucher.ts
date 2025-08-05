import { VoucherSortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { withTimestampsString } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  CustomerVoucherStatusSchema,
  VoucherCodeTypeSchema,
  VoucherDiscountTypeSchema,
  VoucherScanSourceSchema,
  VoucherSortBySchema,
  VoucherStateSchema,
} from '../common/enums.js'
import {
  GeographicSearchParams,
  VoucherFilterParams,
} from '../common/queries.js'

/**
 * Public voucher schemas for customer-facing operations
 * Converted from pika-old TypeBox schemas following the established pattern
 */

// ============= Voucher Code Response =============

export const VoucherCodeResponse = openapi(
  z.object({
    id: UUID,
    code: z.string(),
    type: VoucherCodeTypeSchema,
    isActive: z.boolean(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Voucher code information',
  },
)

export type VoucherCodeResponse = z.infer<typeof VoucherCodeResponse>

// ============= Voucher Response =============

export const VoucherResponse = openapi(
  withTimestampsString({
    id: UUID,
    businessId: UUID,
    categoryId: UUID,
    state: VoucherStateSchema,
    title: z.any().describe('Multilingual voucher title'),
    description: z.any().describe('Multilingual voucher description'),
    terms: z.any().describe('Multilingual voucher terms'),
    discountType: VoucherDiscountTypeSchema,
    discountValue: z.number().min(0),
    currency: z.string().default('PYG'),
    location: z.any().nullable().describe('GeoJSON Point or Polygon'),
    imageUrl: z.string().url().optional().nullable(),
    validFrom: z.string().datetime(),
    expiresAt: z.string().datetime(),
    maxRedemptions: z.number().int().min(1).optional().nullable(),
    maxRedemptionsPerUser: z.number().int().min(1).default(1),
    currentRedemptions: z.number().int().min(0).default(0),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
    codes: z.array(VoucherCodeResponse).optional(),
  }),
  {
    description: 'Public voucher information',
  },
)

export type VoucherResponse = z.infer<typeof VoucherResponse>

// ============= Search Vouchers =============

export const VoucherQueryParams = SearchParams.extend({
  // Filter parameters (from pika-old VoucherSearchQuerySchema)
  businessId: UUID.optional().describe('Filter by business ID'),
  categoryId: UUID.optional().describe('Filter by category ID'),
  state: VoucherStateSchema.optional().describe('Filter by voucher state'),
  discountType: VoucherDiscountTypeSchema.optional().describe(
    'Filter by discount type',
  ),
  minDiscount: z.number().min(0).optional().describe('Minimum discount value'),
  maxDiscount: z.number().min(0).optional().describe('Maximum discount value'),
  minValue: z.number().min(0).optional().describe('Minimum voucher value'),
  maxValue: z.number().min(0).optional().describe('Maximum voucher value'),
  type: z.string().optional().describe('Voucher type filter'),
  currency: z.string().optional().describe('Filter by currency'),
  validFrom: z
    .string()
    .datetime()
    .optional()
    .describe('Valid from date filter'),
  validUntil: z
    .string()
    .datetime()
    .optional()
    .describe('Valid until date filter'),
  include: z
    .string()
    .optional()
    .describe('Comma-separated relations to include'),

  // Additional public filters
  hasAvailableUses: z
    .boolean()
    .optional()
    .describe('Filter vouchers with available uses'),

  // Override default sorting with voucher-specific sort fields
  sortBy: VoucherSortBySchema.default(VoucherSortBy.CREATED_AT),
})
  .merge(GeographicSearchParams)
  .merge(VoucherFilterParams)

export type VoucherQueryParams = z.infer<typeof VoucherQueryParams>

// ============= Voucher Scan Operations =============

export const VoucherScanRequest = openapi(
  z.object({
    scanSource: VoucherScanSourceSchema.optional(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
    deviceInfo: z
      .object({
        platform: z.string().min(1).max(50),
        version: z.string().min(1).max(20),
        model: z.string().min(1).max(100).optional(),
      })
      .optional(),
  }),
  {
    description: 'Request to track voucher scan',
  },
)

export type VoucherScanRequest = z.infer<typeof VoucherScanRequest>

export const VoucherScanResponse = openapi(
  z.object({
    voucher: VoucherResponse,
    scanId: UUID,
    canClaim: z.boolean(),
    alreadyClaimed: z.boolean(),
    nearbyLocations: z
      .array(
        z.object({
          name: z.string(),
          address: z.string(),
          distance: z.number(),
          coordinates: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }),
        }),
      )
      .optional(),
  }),
  {
    description: 'Voucher scan tracking result',
  },
)

export type VoucherScanResponse = z.infer<typeof VoucherScanResponse>

// ============= Voucher Claim Operations =============

export const VoucherClaimRequest = openapi(
  z.object({
    notificationPreferences: z
      .object({
        enableReminders: z.boolean().default(true),
        reminderDaysBefore: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .default(3),
      })
      .optional(),
  }),
  {
    description: 'Request to claim voucher to wallet',
  },
)

export type VoucherClaimRequest = z.infer<typeof VoucherClaimRequest>

export const VoucherClaimResponse = openapi(
  z.object({
    claimId: UUID,
    voucher: VoucherResponse,
    claimedAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    walletPosition: z.number().int().min(0),
  }),
  {
    description: 'Voucher claim result',
  },
)

export type VoucherClaimResponse = z.infer<typeof VoucherClaimResponse>

// ============= Voucher Redeem Operations =============

export const VoucherRedeemRequest = openapi(
  z.object({
    code: z.string(),
    location: z.any().optional().describe('GeoJSON location data'),
  }),
  {
    description: 'Request to redeem voucher',
  },
)

export type VoucherRedeemRequest = z.infer<typeof VoucherRedeemRequest>

export const VoucherRedeemResponse = openapi(
  z.object({
    message: z.string(),
    voucherId: UUID,
    redeemedAt: z.string().datetime(),
    discountApplied: z.number().min(0),
    voucher: VoucherResponse,
  }),
  {
    description: 'Voucher redemption result',
  },
)

export type VoucherRedeemResponse = z.infer<typeof VoucherRedeemResponse>

// ============= Response Types =============

export const VoucherListResponse = paginatedResponse(VoucherResponse)

export type VoucherListResponse = z.infer<typeof VoucherListResponse>

// User Vouchers Response (for GET /vouchers/user/:userId)
export const UserVoucherResponse = openapi(
  z.object({
    voucher: VoucherResponse,
    claimedAt: z.string().datetime(),
    status: CustomerVoucherStatusSchema,
    redeemedAt: z.string().datetime().nullable().optional(),
  }),
  {
    description: 'User voucher with status information',
  },
)

export type UserVoucherResponse = z.infer<typeof UserVoucherResponse>

export const UserVouchersListResponse = paginatedResponse(UserVoucherResponse)

export type UserVouchersListResponse = z.infer<typeof UserVouchersListResponse>
