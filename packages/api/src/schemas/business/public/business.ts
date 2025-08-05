import { BusinessSortBy as BusinessSortByEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { CategoryResponse } from '../../category/public/category.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createByIdQuerySchema } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { PublicUserProfile } from '../../user/public/profile.js'
import { BUSINESS_RELATIONS, BusinessSortBy } from '../common/enums.js'

/**
 * Public business schemas
 */

// ============= Business Response =============

/**
 * Public business response
 */
export const BusinessResponse = openapi(
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
    // Optional relations - industry standard pattern
    user: PublicUserProfile.optional().describe(
      'Business owner profile when ?include=user',
    ),
    category: CategoryResponse.optional().describe(
      'Category information when ?include=category',
    ),
  }),
  {
    description: 'Business information for public view',
  },
)

export type BusinessResponse = z.infer<typeof BusinessResponse>

// ============= Search Businesses =============

/**
 * Business search/filter parameters
 */
export const BusinessQueryParams = SearchParams.extend({
  categoryId: UUID.optional().describe('Filter by category'),
  verified: optionalBoolean().describe('Filter by verification status'),
  active: optionalBoolean().describe('Filter by active status'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Minimum rating filter'),
  sortBy: BusinessSortBy.default(BusinessSortByEnum.BUSINESS_NAME),
})

export type BusinessQueryParams = z.infer<typeof BusinessQueryParams>

/**
 * Business path parameters
 */
export const BusinessPathParams = z.object({
  id: UUID.describe('Business ID'),
})

export type BusinessPathParams = z.infer<typeof BusinessPathParams>

/**
 * Business detail query parameters (for single business endpoints)
 */
export const BusinessDetailQueryParams =
  createByIdQuerySchema(BUSINESS_RELATIONS)

export type BusinessDetailQueryParams = z.infer<
  typeof BusinessDetailQueryParams
>

// ============= Response Types =============

/**
 * Paginated business list response
 */
export const BusinessListResponse = paginatedResponse(BusinessResponse)

export type BusinessListResponse = z.infer<typeof BusinessListResponse>

/**
 * Businesses by category response
 */
export const BusinessesByCategoryResponse = openapi(
  z.object({
    categoryId: UUID,
    categoryName: z.string(),
    businesses: z.array(BusinessResponse),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Businesses grouped by category',
  },
)

export type BusinessesByCategoryResponse = z.infer<
  typeof BusinessesByCategoryResponse
>

// ============= Create/Update Requests =============

/**
 * Create my business request (for business owners)
 */
export const CreateMyBusinessRequest = openapi(
  z.object({
    businessName: z.string().min(1).max(100).describe('Business name'),
    businessDescription: z
      .string()
      .max(500)
      .optional()
      .describe('Business description'),
    categoryId: UUID.describe('Category ID'),
  }),
  {
    description: 'Create business data for business owners',
  },
)

export type CreateMyBusinessRequest = z.infer<typeof CreateMyBusinessRequest>

/**
 * Update my business request (for business owners)
 */
export const UpdateMyBusinessRequest = openapi(
  z.object({
    businessName: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe('Business name'),
    businessDescription: z
      .string()
      .max(500)
      .optional()
      .describe('Business description'),
    categoryId: UUID.optional().describe('Category ID'),
  }),
  {
    description: 'Update business data for business owners',
  },
)

export type UpdateMyBusinessRequest = z.infer<typeof UpdateMyBusinessRequest>
