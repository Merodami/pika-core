import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { AdminVoucherDetailResponse } from '../admin/management.js'
import {
  BatchOperationType,
  CustomerVoucherStatusSchema,
  UserVoucherStatusFilter,
  VoucherBookStatusSchema,
  VoucherStateSchema,
} from '../common/enums.js'

/**
 * Internal voucher service schemas
 * Used for service-to-service communication
 */

// ============= Batch Operations =============

/**
 * Get vouchers by IDs request
 */
export const GetVouchersByIdsRequest = openapi(
  z.object({
    voucherIds: z
      .array(UUID)
      .min(1)
      .max(100)
      .describe('List of voucher IDs to fetch'),
    include: z
      .string()
      .optional()
      .describe('Comma-separated relations: business,category,codes'),
  }),
  {
    description: 'Batch fetch vouchers by IDs',
  },
)

export type GetVouchersByIdsRequest = z.infer<typeof GetVouchersByIdsRequest>

/**
 * Get vouchers by IDs response
 */
export const GetVouchersByIdsResponse = openapi(
  paginatedResponse(AdminVoucherDetailResponse).extend({
    notFound: z.array(UUID).describe('IDs of vouchers that were not found'),
  }),
  {
    description: 'Batch fetch vouchers response with pagination metadata',
  },
)

export type GetVouchersByIdsResponse = z.infer<typeof GetVouchersByIdsResponse>

// ============= Validation =============

/**
 * Validate voucher request
 */
export const ValidateVoucherRequest = openapi(
  z.object({
    voucherId: UUID,
    userId: UUID.optional().describe('User ID for user-specific validation'),
    checkRedemptionLimit: z
      .boolean()
      .default(true)
      .describe('Check if redemption limit reached'),
    checkExpiry: z
      .boolean()
      .default(true)
      .describe('Check if voucher is expired'),
    checkState: z
      .boolean()
      .default(true)
      .describe('Check if voucher is in valid state'),
  }),
  {
    description: 'Validate voucher availability and constraints',
  },
)

export type ValidateVoucherRequest = z.infer<typeof ValidateVoucherRequest>

/**
 * Validate voucher response
 */
export const ValidateVoucherResponse = openapi(
  z.object({
    isValid: z.boolean(),
    reason: z.string().optional().describe('Reason if validation failed'),
    voucher: AdminVoucherDetailResponse.optional().describe(
      'Voucher details if valid',
    ),
  }),
  {
    description: 'Voucher validation result',
  },
)

export type ValidateVoucherResponse = z.infer<typeof ValidateVoucherResponse>

// ============= State Management =============

/**
 * Internal update voucher state request
 */
export const InternalUpdateVoucherStateRequest = openapi(
  z.object({
    voucherId: UUID,
    state: VoucherStateSchema,
    reason: z.string().optional().describe('Reason for state change'),
    serviceId: z.string().describe('ID of the service making the change'),
  }),
  {
    description: 'Internal voucher state update',
  },
)

export type InternalUpdateVoucherStateRequest = z.infer<
  typeof InternalUpdateVoucherStateRequest
>

/**
 * Internal update voucher state response
 */
export const InternalUpdateVoucherStateResponse = openapi(
  z.object({
    success: z.boolean(),
    previousState: VoucherStateSchema,
    newState: VoucherStateSchema,
  }),
  {
    description: 'State update result',
  },
)

export type InternalUpdateVoucherStateResponse = z.infer<
  typeof InternalUpdateVoucherStateResponse
>

// ============= Existence Check =============

/**
 * Check voucher exists request
 */
export const CheckVoucherExistsRequest = openapi(
  z
    .object({
      voucherId: UUID.optional(),
      code: z.string().optional(),
    })
    .refine((data) => data.voucherId || data.code, {
      message: 'Either voucherId or code must be provided',
    }),
  {
    description: 'Check if voucher exists by ID or code',
  },
)

export type CheckVoucherExistsRequest = z.infer<
  typeof CheckVoucherExistsRequest
>

/**
 * Check voucher exists response
 */
export const CheckVoucherExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
    voucherId: UUID.optional(),
  }),
  {
    description: 'Voucher existence check result',
  },
)

export type CheckVoucherExistsResponse = z.infer<
  typeof CheckVoucherExistsResponse
>

// ============= Business Operations =============

/**
 * Get vouchers by business request
 */
export const GetVouchersByBusinessRequest = openapi(
  z.object({
    businessId: UUID,
    state: VoucherStateSchema.optional(),
    includeExpired: z.boolean().default(false),
    includeDeleted: z.boolean().default(false),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Get all vouchers for a business',
  },
)

export type GetVouchersByBusinessRequest = z.infer<
  typeof GetVouchersByBusinessRequest
>

/**
 * Get vouchers by business response
 */
export const GetVouchersByBusinessResponse = paginatedResponse(
  AdminVoucherDetailResponse,
)

export type GetVouchersByBusinessResponse = z.infer<
  typeof GetVouchersByBusinessResponse
>

// ============= Category Operations =============

/**
 * Get vouchers by category request
 */
export const GetVouchersByCategoryRequest = openapi(
  z.object({
    categoryId: UUID,
    state: VoucherStateSchema.optional(),
    includeExpired: z.boolean().default(false),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Get all vouchers for a category',
  },
)

export type GetVouchersByCategoryRequest = z.infer<
  typeof GetVouchersByCategoryRequest
>

/**
 * Get vouchers by category response
 */
export const GetVouchersByCategoryResponse = paginatedResponse(
  AdminVoucherDetailResponse,
)

export type GetVouchersByCategoryResponse = z.infer<
  typeof GetVouchersByCategoryResponse
>

// ============= User Operations =============

/**
 * Get user vouchers request
 */
export const GetUserVouchersRequest = openapi(
  z.object({
    userId: UUID,
    status: UserVoucherStatusFilter.default('all'),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Get vouchers claimed/redeemed by user',
  },
)

export type GetUserVouchersRequest = z.infer<typeof GetUserVouchersRequest>

/**
 * Get user vouchers response
 */
export const GetUserVouchersResponse = paginatedResponse(
  z.object({
    voucher: AdminVoucherDetailResponse,
    claimedAt: z.string().datetime(),
    status: CustomerVoucherStatusSchema,
    redeemedAt: z.string().datetime().nullable(),
  }),
)

export type GetUserVouchersResponse = z.infer<typeof GetUserVouchersResponse>

// ============= Redemption Tracking =============

/**
 * Track redemption request (internal)
 */
export const TrackRedemptionRequest = openapi(
  z.object({
    voucherId: UUID,
    userId: UUID,
    code: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Internal redemption tracking',
  },
)

export type TrackRedemptionRequest = z.infer<typeof TrackRedemptionRequest>

/**
 * Track redemption response
 */
export const TrackRedemptionResponse = openapi(
  z.object({
    redemptionId: UUID,
    success: z.boolean(),
    currentRedemptions: z.number().int(),
    maxRedemptions: z.number().int().nullable(),
  }),
  {
    description: 'Redemption tracking result',
  },
)

export type TrackRedemptionResponse = z.infer<typeof TrackRedemptionResponse>

// ============= Batch Operations =============

/**
 * Batch voucher processing request
 */
export const BatchVoucherProcessRequest = openapi(
  z.object({
    voucherIds: z.array(UUID).min(1).max(100),
    operation: BatchOperationType,
    context: z.object({
      serviceId: z.string().min(1),
      requestId: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }),
  }),
  {
    description: 'Batch voucher processing for service-to-service operations',
  },
)

export type BatchVoucherProcessRequest = z.infer<
  typeof BatchVoucherProcessRequest
>

/**
 * Batch voucher processing response
 */
export const BatchVoucherProcessResponse = openapi(
  z.object({
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    results: z.array(
      z.object({
        voucherId: UUID,
        success: z.boolean(),
        voucher: z.any().optional(), // VoucherDomain if successful
        error: z.string().optional(),
      }),
    ),
    processingTime: z.number().positive(),
  }),
  {
    description:
      'Batch processing results with detailed success/failure information',
  },
)

export type BatchVoucherProcessResponse = z.infer<
  typeof BatchVoucherProcessResponse
>

/**
 * Batch voucher state update request
 */
export const BatchUpdateVoucherStateRequest = openapi(
  z.object({
    updates: z
      .array(
        z.object({
          voucherId: UUID,
          state: VoucherStateSchema,
          reason: z.string().optional(),
        }),
      )
      .min(1)
      .max(50),
    context: z.object({
      serviceId: z.string().min(1),
      requestId: z.string().optional(),
    }),
  }),
  {
    description: 'Batch voucher state updates for inter-service communication',
  },
)

export type BatchUpdateVoucherStateRequest = z.infer<
  typeof BatchUpdateVoucherStateRequest
>

/**
 * Batch voucher state update response
 */
export const BatchUpdateVoucherStateResponse = openapi(
  z.object({
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    updates: z.array(
      z.object({
        voucherId: UUID,
        success: z.boolean(),
        oldState: VoucherStateSchema.optional(),
        newState: VoucherStateSchema.optional(),
        error: z.string().optional(),
      }),
    ),
  }),
  {
    description: 'Batch state update results',
  },
)

export type BatchUpdateVoucherStateResponse = z.infer<
  typeof BatchUpdateVoucherStateResponse
>

// ============= Voucher Book Operations =============

/**
 * Get vouchers for book request
 */
export const GetVouchersForBookRequest = openapi(
  z.object({
    businessIds: z
      .array(UUID)
      .min(1)
      .max(50)
      .describe('List of business IDs to get vouchers from'),
    month: z
      .string()
      .regex(/^\d{2}$/)
      .describe('Month in MM format (01-12)'),
    year: z.number().int().min(2024).max(2030).describe('Year in YYYY format'),
  }),
  {
    description: 'Get vouchers for voucher book generation',
  },
)

export type GetVouchersForBookRequest = z.infer<
  typeof GetVouchersForBookRequest
>

/**
 * Get vouchers for book response
 */
export const GetVouchersForBookResponse = openapi(
  z.object({
    vouchers: z.array(
      z.object({
        id: UUID,
        businessId: UUID,
        title: z.record(z.string(), z.string()),
        description: z.record(z.string(), z.string()),
        terms: z.record(z.string(), z.string()),
        discountType: z.string(),
        discountValue: z.number(),
        validFrom: z.string().datetime().optional(),
        validTo: z.string().datetime().optional(),
        businessName: z.string(),
        businessLogo: z.string().optional(),
        category: z.string(),
        qrPayload: z.string().describe('JWT token for QR code'),
        shortCode: z.string().describe('Human-readable fallback code'),
      }),
    ),
    count: z.number().int().describe('Total number of vouchers'),
  }),
  {
    description: 'Vouchers with security tokens for book generation',
  },
)

export type GetVouchersForBookResponse = z.infer<
  typeof GetVouchersForBookResponse
>

/**
 * Generate voucher tokens request
 */
export const GenerateVoucherTokensRequest = openapi(
  z.object({
    vouchers: z
      .array(
        z.object({
          voucherId: UUID,
          providerId: UUID,
        }),
      )
      .min(1)
      .max(100)
      .describe('Vouchers to generate tokens for'),
    batchId: z.string().optional().describe('Batch identifier for print run'),
  }),
  {
    description: 'Generate security tokens for multiple vouchers',
  },
)

export type GenerateVoucherTokensRequest = z.infer<
  typeof GenerateVoucherTokensRequest
>

/**
 * Generate voucher tokens response
 */
export const GenerateVoucherTokensResponse = openapi(
  z.object({
    tokens: z.array(
      z.object({
        voucherId: UUID,
        qrPayload: z.string(),
        shortCode: z.string(),
        batchId: z.string().optional(),
      }),
    ),
    count: z.number().int(),
  }),
  {
    description: 'Generated security tokens for vouchers',
  },
)

export type GenerateVoucherTokensResponse = z.infer<
  typeof GenerateVoucherTokensResponse
>

/**
 * Validate book state transition request
 */
export const ValidateBookStateTransitionRequest = openapi(
  z.object({
    currentStatus: VoucherBookStatusSchema,
    newStatus: VoucherBookStatusSchema,
  }),
  {
    description: 'Validate if a voucher book state transition is allowed',
  },
)

export type ValidateBookStateTransitionRequest = z.infer<
  typeof ValidateBookStateTransitionRequest
>

/**
 * Validate book state transition response
 */
export const ValidateBookStateTransitionResponse = openapi(
  z.object({
    allowed: z.boolean(),
    reason: z.string().optional(),
    requiredFields: z.array(z.string()).optional(),
  }),
  {
    description: 'State transition validation result',
  },
)

export type ValidateBookStateTransitionResponse = z.infer<
  typeof ValidateBookStateTransitionResponse
>
