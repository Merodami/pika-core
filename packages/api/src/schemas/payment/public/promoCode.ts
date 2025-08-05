import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Percentage, UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Promo code schemas for public API
 */

// ============= Promo Code Schema =============

/**
 * Promo code
 */
export const PromoCode = openapi(
  withTimestamps({
    id: UUID,
    code: z.string().min(1).max(50).toUpperCase().describe('Unique promo code'),
    discount: Percentage.describe('Discount percentage (0-100)'),
    active: z.boolean().default(true),
    allowedTimes: z
      .number()
      .int()
      .positive()
      .describe('Total number of times this code can be used'),
    amountAvailable: z.number().int().nonnegative().describe('Remaining uses'),
    expirationDate: DateTime,
    createdBy: UserId,
    cancelledAt: DateTime.optional(),
  }),
  {
    description: 'Promotional discount code',
  },
)

export type PromoCode = z.infer<typeof PromoCode>

/**
 * Promo code usage record
 */
export const PromoCodeUsage = z.object({
  id: UUID,
  promoCodeId: UUID,
  userId: UserId,
  transactionId: z.string().optional().describe('Related payment transaction'),
  usedAt: DateTime,
})

export type PromoCodeUsage = z.infer<typeof PromoCodeUsage>

/**
 * Promo code with usage history
 */
export const PromoCodeWithUsages = PromoCode.extend({
  usages: z.array(PromoCodeUsage),
  totalUsed: z.number().int().nonnegative(),
  remainingUses: z.number().int().nonnegative(),
})

export type PromoCodeWithUsages = z.infer<typeof PromoCodeWithUsages>

// ============= Create/Update Promo Code =============

/**
 * Create promo code request (public)
 */
export const PublicCreatePromoCodeRequest = openapi(
  z.object({
    code: z.string().min(1).max(50).toUpperCase(),
    discount: Percentage,
    active: z.boolean().optional().default(true),
    allowedTimes: z.number().int().positive(),
    amountAvailable: z.number().int().nonnegative(),
    expirationDate: DateTime,
    createdBy: UserId,
  }),
  {
    description: 'Create a new promo code (public)',
  },
)

export type PublicCreatePromoCodeRequest = z.infer<
  typeof PublicCreatePromoCodeRequest
>

/**
 * Update promo code request (public)
 */
export const PublicUpdatePromoCodeRequest = openapi(
  z.object({
    code: z.string().min(1).max(50).toUpperCase().optional(),
    discount: Percentage.optional(),
    active: z.boolean().optional(),
    allowedTimes: z.number().int().positive().optional(),
    amountAvailable: z.number().int().nonnegative().optional(),
    expirationDate: DateTime.optional(),
  }),
  {
    description: 'Update promo code details (public)',
  },
)

export type PublicUpdatePromoCodeRequest = z.infer<
  typeof PublicUpdatePromoCodeRequest
>

// ============= Use Promo Code =============

/**
 * Validate promo code request
 */
export const ValidatePromoCodeRequest = openapi(
  z.object({
    code: z.string().min(1).max(50),
    userId: UserId.optional().describe(
      'Check if specific user can use this code',
    ),
  }),
  {
    description: 'Validate if a promo code can be used',
  },
)

export type ValidatePromoCodeRequest = z.infer<typeof ValidatePromoCodeRequest>

/**
 * Validate promo code response
 */
export const ValidatePromoCodeResponse = openapi(
  z.object({
    valid: z.boolean(),
    code: z.string(),
    discount: Percentage.optional(),
    reason: z.string().optional().describe('Reason if invalid'),
    expiresAt: DateTime.optional(),
    remainingUses: z.number().int().optional(),
  }),
  {
    description: 'Promo code validation result',
  },
)

export type ValidatePromoCodeResponse = z.infer<
  typeof ValidatePromoCodeResponse
>

/**
 * Apply promo code request
 */
export const ApplyPromoCodeRequest = openapi(
  z.object({
    code: z.string().min(1).max(50),
    transactionId: z.string().optional(),
  }),
  {
    description: 'Apply a promo code to a transaction',
  },
)

export type ApplyPromoCodeRequest = z.infer<typeof ApplyPromoCodeRequest>

/**
 * Apply promo code response
 */
export const ApplyPromoCodeResponse = openapi(
  z.object({
    success: z.boolean(),
    discount: Percentage,
    usage: PromoCodeUsage,
    message: z.string(),
  }),
  {
    description: 'Promo code application result',
  },
)

export type ApplyPromoCodeResponse = z.infer<typeof ApplyPromoCodeResponse>

// ============= Search Promo Codes =============

/**
 * Search promo codes parameters
 */
export const SearchPromoCodesParams = z.object({
  code: z.string().optional(),
  active: z.boolean().optional(),
  expired: z.boolean().optional(),
  createdBy: UserId.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sort: z
    .enum(['CODE', 'DISCOUNT', 'EXPIRATION_DATE', 'CREATED_AT'])
    .optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type SearchPromoCodesParams = z.infer<typeof SearchPromoCodesParams>

/**
 * Promo codes list response
 */
export const PromoCodesListResponse = paginatedResponse(PromoCode)

export type PromoCodesListResponse = z.infer<typeof PromoCodesListResponse>

/**
 * Promo code usage history parameters
 */
export const PromoCodeUsageParams = z.object({
  promoCodeId: UUID,
  userId: UserId.optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
})

export type PromoCodeUsageParams = z.infer<typeof PromoCodeUsageParams>

/**
 * Promo code usage history response
 */
export const PromoCodeUsageResponse = paginatedResponse(PromoCodeUsage)

export type PromoCodeUsageResponse = z.infer<typeof PromoCodeUsageResponse>

// ============= Path Parameters =============

/**
 * Promo code ID path parameter
 */
export const PromoCodeIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Promo code ID path parameter',
  },
)

export type PromoCodeIdParam = z.infer<typeof PromoCodeIdParam>

/**
 * Promo code string path parameter
 */
export const PromoCodeCodeParam = openapi(
  z.object({
    code: z.string().min(1).max(50),
  }),
  {
    description: 'Promo code string path parameter',
  },
)

export type PromoCodeCodeParam = z.infer<typeof PromoCodeCodeParam>

/**
 * Promo code and user ID path parameters
 */
export const PromoCodeUserParams = openapi(
  z.object({
    code: z.string().min(1).max(50),
    userId: UserId,
  }),
  {
    description: 'Promo code and user ID path parameters',
  },
)

export type PromoCodeUserParams = z.infer<typeof PromoCodeUserParams>
