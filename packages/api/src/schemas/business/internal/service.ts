import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { BUSINESS_RELATIONS } from '../common/enums.js'

/**
 * Internal business service schemas for service-to-service communication
 */

// ============= Business Data for Services =============

/**
 * Internal business data (minimal fields for service consumption)
 */
export const InternalBusinessData = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    businessNameKey: z.string(),
    businessDescriptionKey: z.string().optional(),
    categoryId: UUID,
    verified: z.boolean(),
    active: z.boolean(),
    avgRating: z.number().min(0).max(5),
  }),
  {
    description: 'Internal business data for services',
  },
)

export type InternalBusinessData = z.infer<typeof InternalBusinessData>

// ============= Query Parameters =============

/**
 * Internal business query parameters
 */
export const InternalBusinessQueryParams = z.object({
  verified: optionalBoolean(),
  active: optionalBoolean(),
  categoryId: UUID.optional(),
})

export type InternalBusinessQueryParams = z.infer<
  typeof InternalBusinessQueryParams
>

// ============= Get Businesses by IDs =============

/**
 * Bulk get businesses request
 */
export const BulkBusinessRequest = openapi(
  z
    .object({
      businessIds: z.array(UUID).min(1).max(100),
    })
    .merge(createIncludeParam(BUSINESS_RELATIONS)),
  {
    description: 'Get multiple businesses by IDs',
  },
)

export type BulkBusinessRequest = z.infer<typeof BulkBusinessRequest>

/**
 * Bulk get businesses response
 */
export const BulkBusinessResponse = openapi(
  z.object({
    businesses: z.array(InternalBusinessData),
    notFound: z.array(UUID).optional(),
  }),
  {
    description: 'Businesses data with not found IDs',
  },
)

export type BulkBusinessResponse = z.infer<typeof BulkBusinessResponse>

// ============= Validate Businesses =============

/**
 * Validate businesses request
 */
export const ValidateBusinessRequest = openapi(
  z.object({
    businessIds: z.array(UUID).min(1).max(100),
    checkActive: optionalBoolean().default(true),
    checkVerified: optionalBoolean().default(false),
  }),
  {
    description:
      'Validate businesses exist and optionally check if active/verified',
  },
)

export type ValidateBusinessRequest = z.infer<typeof ValidateBusinessRequest>

/**
 * Validate businesses response
 */
export const ValidateBusinessResponse = openapi(
  z.object({
    valid: z.array(UUID),
    invalid: z.array(
      z.object({
        id: UUID,
        reason: z.string(),
      }),
    ),
  }),
  {
    description: 'Validation results for businesses',
  },
)

export type ValidateBusinessResponse = z.infer<typeof ValidateBusinessResponse>

// ============= Get Businesses by User =============

/**
 * Get businesses by user request
 */
export const GetBusinessesByUserRequest = openapi(
  z.object({
    userId: UserId,
    includeInactive: optionalBoolean().default(false),
    includeUnverified: optionalBoolean().default(true),
  }),
  {
    description: 'Get all businesses owned by a user',
  },
)

export type GetBusinessesByUserRequest = z.infer<
  typeof GetBusinessesByUserRequest
>

/**
 * Get businesses by user response
 */
export const GetBusinessesByUserResponse = openapi(
  z.object({
    businesses: z.array(InternalBusinessData),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'User businesses data',
  },
)

export type GetBusinessesByUserResponse = z.infer<
  typeof GetBusinessesByUserResponse
>

// ============= Get Business Request =============

/**
 * Get business request query parameters
 */
export const GetBusinessRequest = openapi(
  createIncludeParam(BUSINESS_RELATIONS),
  {
    description: 'Query parameters for getting business details',
  },
)

export type GetBusinessRequest = z.infer<typeof GetBusinessRequest>

// ============= Get Businesses by Category =============

/**
 * Get businesses by category request query parameters
 * Note: categoryId is passed as a path parameter, not in query
 */
export const GetBusinessesByCategoryRequest = openapi(
  SearchParams.extend({
    onlyActive: optionalBoolean(),
    onlyVerified: optionalBoolean(),
  }).merge(createIncludeParam(BUSINESS_RELATIONS)),
  {
    description:
      'Query parameters for getting businesses in a specific category',
  },
)

export type GetBusinessesByCategoryRequest = z.infer<
  typeof GetBusinessesByCategoryRequest
>

/**
 * Get businesses by category response with pagination
 */
export const GetBusinessesByCategoryResponse =
  paginatedResponse(InternalBusinessData)

export type GetBusinessesByCategoryResponse = z.infer<
  typeof GetBusinessesByCategoryResponse
>

// ============= Check Business Exists =============

/**
 * Check business exists request
 */
export const CheckBusinessExistsRequest = openapi(
  z.object({
    businessId: UUID,
  }),
  {
    description: 'Check if business exists and is active',
  },
)

export type CheckBusinessExistsRequest = z.infer<
  typeof CheckBusinessExistsRequest
>

/**
 * Check business exists response
 */
export const CheckBusinessExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    business: InternalBusinessData.optional(),
  }),
  {
    description: 'Business existence check result',
  },
)

export type CheckBusinessExistsResponse = z.infer<
  typeof CheckBusinessExistsResponse
>
