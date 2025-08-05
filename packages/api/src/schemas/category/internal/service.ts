import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Internal category service schemas for service-to-service communication
 */

// ============= Category Data for Services =============

/**
 * Internal category data (minimal fields for service consumption)
 */
export const InternalCategoryData = openapi(
  z.object({
    id: UUID,
    nameKey: z.string(),
    descriptionKey: z.string().optional(),
    icon: z.string().optional(),
    parentId: UUID.optional(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
  }),
  {
    description: 'Internal category data for services',
  },
)

export type InternalCategoryData = z.infer<typeof InternalCategoryData>

// ============= Query Parameters =============

/**
 * Internal category query parameters
 */
export const InternalCategoryQueryParams = z.object({
  isActive: optionalBoolean(),
})

export type InternalCategoryQueryParams = z.infer<
  typeof InternalCategoryQueryParams
>

// ============= Get Categories by IDs =============

/**
 * Bulk get categories request
 */
export const BulkCategoryRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Get multiple categories by IDs',
  },
)

export type BulkCategoryRequest = z.infer<typeof BulkCategoryRequest>

/**
 * Bulk get categories response with pagination structure
 */
export const BulkCategoryResponse = paginatedResponse(InternalCategoryData)

export type BulkCategoryResponse = z.infer<typeof BulkCategoryResponse>

// ============= Validate Categories =============

/**
 * Validate categories request
 */
export const ValidateCategoryRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
    checkActive: optionalBoolean().default(true),
  }),
  {
    description: 'Validate categories exist and optionally check if active',
  },
)

export type ValidateCategoryRequest = z.infer<typeof ValidateCategoryRequest>

/**
 * Validate categories response
 */
/**
 * Individual category validation result
 */
export const CategoryValidationResult = z.object({
  categoryId: UUID,
  exists: z.boolean(),
  isActive: z.boolean(),
  valid: z.boolean(),
})

export type CategoryValidationResult = z.infer<typeof CategoryValidationResult>

export const ValidateCategoryResponse = openapi(
  z.object({
    valid: z.boolean().describe('Whether all categories are valid'),
    results: z
      .array(CategoryValidationResult)
      .describe('Individual validation results'),
  }),
  {
    description: 'Validation results for categories',
  },
)

export type ValidateCategoryResponse = z.infer<typeof ValidateCategoryResponse>

// ============= Category Hierarchy =============

/**
 * Get category hierarchy response
 */
export const InternalCategoryHierarchyResponse = openapi(
  z.object({
    data: z.array(InternalCategoryData),
  }),
  {
    description: 'Category hierarchy for internal use',
  },
)

export type InternalCategoryHierarchyResponse = z.infer<
  typeof InternalCategoryHierarchyResponse
>

// ============= Check Category Exists =============

/**
 * Check category exists request
 */
export const CheckCategoryExistsRequest = openapi(
  z.object({
    categoryId: UUID,
  }),
  {
    description: 'Check if category exists and is active',
  },
)

export type CheckCategoryExistsRequest = z.infer<
  typeof CheckCategoryExistsRequest
>

/**
 * Check category exists response
 */
export const CheckCategoryExistsResponse = openapi(
  z.object({
    exists: z.boolean(),
    isActive: z.boolean().optional(),
    category: InternalCategoryData.optional(),
  }),
  {
    description: 'Category existence check result',
  },
)

export type CheckCategoryExistsResponse = z.infer<
  typeof CheckCategoryExistsResponse
>

// ============= Internal Category List Response =============

/**
 * Internal category list response with pagination
 */
export const InternalCategoryListResponse =
  paginatedResponse(InternalCategoryData)

export type InternalCategoryListResponse = z.infer<
  typeof InternalCategoryListResponse
>
