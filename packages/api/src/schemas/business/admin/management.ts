import { BusinessSortBy as BusinessSortByEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { CategoryResponse } from '../../category/public/category.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { AdminUserDetailResponse } from '../../user/admin/management.js'
import {
  BUSINESS_RELATIONS,
  BusinessSortBy,
  BusinessStatusFilter,
} from '../common/enums.js'

/**
 * Admin business management schemas
 */

// ============= Admin Business Response =============

/**
 * Admin business response (includes all fields for management)
 */
export const AdminBusinessResponse = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId.describe('User who owns this business'),
    businessNameKey: z
      .string()
      .max(255)
      .describe('Translation key for business name'),
    businessDescriptionKey: z
      .string()
      .max(255)
      .optional()
      .describe('Translation key for business description'),
    categoryId: UUID.describe('Category this business belongs to'),
    verified: z
      .boolean()
      .default(false)
      .describe('Whether business is verified'),
    active: z.boolean().default(true).describe('Whether business is active'),
    avgRating: z
      .number()
      .min(0)
      .max(5)
      .default(0)
      .describe('Average rating of the business'),
    deletedAt: z
      .string()
      .datetime()
      .nullable()
      .describe('Soft deletion timestamp'),
    // Optional relations - industry standard pattern
    user: AdminUserDetailResponse.optional().describe(
      'Business owner details when ?include=user',
    ),
    category: CategoryResponse.optional().describe(
      'Category information when ?include=category',
    ),
  }),
  {
    description: 'Business information for admin management',
  },
)

export type AdminBusinessResponse = z.infer<typeof AdminBusinessResponse>

// ============= Create Business =============

/**
 * Create business request
 */
export const CreateBusinessRequest = openapi(
  z.object({
    userId: UserId.describe('User who will own this business'),
    businessName: z.string().min(1).max(255).describe('Business name'),
    businessDescription: z
      .string()
      .max(65535)
      .optional()
      .describe('Business description'),
    categoryId: UUID.describe('Category this business belongs to'),
    verified: z
      .boolean()
      .default(false)
      .describe('Whether business is verified'),
    active: z.boolean().default(true).describe('Whether business is active'),
  }),
  {
    description: 'Create a new business',
  },
)

export type CreateBusinessRequest = z.infer<typeof CreateBusinessRequest>

// ============= Update Business =============

/**
 * Update business request
 */
export const UpdateBusinessRequest = openapi(
  z.object({
    businessName: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe('Business name'),
    businessDescription: z
      .string()
      .max(65535)
      .optional()
      .describe('Business description'),
    categoryId: UUID.optional().describe('Category this business belongs to'),
    verified: z.boolean().optional().describe('Whether business is verified'),
    active: z.boolean().optional().describe('Whether business is active'),
  }),
  {
    description: 'Update business information',
  },
)

export type UpdateBusinessRequest = z.infer<typeof UpdateBusinessRequest>

// ============= Admin Search Businesses =============

/**
 * Admin business search/filter parameters
 */
export const AdminBusinessQueryParams = SearchParams.extend({
  userId: UserId.optional().describe('Filter by owner'),
  categoryId: UUID.optional().describe('Filter by category'),
  status: BusinessStatusFilter.optional().describe('Filter by status'),
  verified: optionalBoolean().describe('Filter by verification status'),
  active: optionalBoolean().describe('Filter by active status'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Minimum rating filter'),
  maxRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Maximum rating filter'),
  includeDeleted: optionalBoolean().describe('Include soft deleted businesses'),
  createdFrom: z.string().datetime().optional().describe('Created date from'),
  createdTo: z.string().datetime().optional().describe('Created date to'),
  updatedFrom: z.string().datetime().optional().describe('Updated date from'),
  updatedTo: z.string().datetime().optional().describe('Updated date to'),
  sortBy: BusinessSortBy.default(BusinessSortByEnum.BUSINESS_NAME),
}).merge(createIncludeParam(BUSINESS_RELATIONS))

export type AdminBusinessQueryParams = z.infer<typeof AdminBusinessQueryParams>

// ============= Response Types =============

/**
 * Admin paginated business list response
 */
export const AdminBusinessListResponse = paginatedResponse(
  AdminBusinessResponse,
)

export type AdminBusinessListResponse = z.infer<
  typeof AdminBusinessListResponse
>

// ============= Business Management Actions =============

/**
 * Toggle business verification request
 */
export const ToggleBusinessVerificationRequest = openapi(
  z.object({
    verified: z.boolean().describe('New verification status'),
  }),
  {
    description: 'Toggle business verification status',
  },
)

export type ToggleBusinessVerificationRequest = z.infer<
  typeof ToggleBusinessVerificationRequest
>

/**
 * Toggle business activation request
 */
export const ToggleBusinessActivationRequest = openapi(
  z.object({
    active: z.boolean().describe('New activation status'),
  }),
  {
    description: 'Toggle business activation status',
  },
)

export type ToggleBusinessActivationRequest = z.infer<
  typeof ToggleBusinessActivationRequest
>

/**
 * Bulk business update request
 */
export const BulkBusinessUpdateRequest = openapi(
  z.object({
    businessIds: z.array(UUID).min(1).max(100),
    updates: z.object({
      active: z.boolean().optional(),
      verified: z.boolean().optional(),
      categoryId: UUID.optional(),
    }),
  }),
  {
    description: 'Update multiple businesses at once',
  },
)

export type BulkBusinessUpdateRequest = z.infer<
  typeof BulkBusinessUpdateRequest
>

/**
 * Bulk operation response
 */
export const BulkBusinessOperationResponse = openapi(
  z.object({
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    errors: z
      .array(
        z.object({
          businessId: UUID,
          error: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Bulk business operation result',
  },
)

export type BulkBusinessOperationResponse = z.infer<
  typeof BulkBusinessOperationResponse
>

// ============= Bulk Delete Businesses =============

/**
 * Bulk delete businesses request
 */
export const BulkDeleteBusinessesRequest = openapi(
  z.object({
    businessIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Delete multiple businesses',
  },
)

export type BulkDeleteBusinessesRequest = z.infer<
  typeof BulkDeleteBusinessesRequest
>

/**
 * Update business rating request
 */
export const UpdateBusinessRatingRequest = openapi(
  z.object({
    rating: z
      .number()
      .min(0)
      .max(5)
      .describe('New rating value for the business'),
  }),
  {
    description: 'Update business rating data',
  },
)

export type UpdateBusinessRatingRequest = z.infer<
  typeof UpdateBusinessRatingRequest
>

// ============= Business Verification Management =============

/**
 * Business verification update request for PATCH endpoint
 */
export const PatchBusinessVerificationRequest = openapi(
  z.object({
    verified: z.boolean().describe('New verification status'),
  }),
  {
    description: 'Update business verification status via PATCH',
  },
)

export type PatchBusinessVerificationRequest = z.infer<
  typeof PatchBusinessVerificationRequest
>

/**
 * Business verification update response
 */
export const PatchBusinessVerificationResponse = AdminBusinessResponse

export type PatchBusinessVerificationResponse = z.infer<
  typeof PatchBusinessVerificationResponse
>
