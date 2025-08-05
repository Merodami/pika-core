import { CategorySortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { CategorySortBySchema } from '../common/enums.js'
import { CATEGORY_RELATIONS } from '../common/enums.js'

/**
 * Public category schemas
 */

// ============= Category Response =============

/**
 * Base category response (non-recursive)
 */
const BaseCategoryResponse = openapi(
  withTimestamps({
    id: UUID,
    nameKey: z.string().max(255).describe('Translation key for category name'),
    descriptionKey: z
      .string()
      .max(255)
      .optional()
      .describe('Translation key for category description'),
    icon: z.string().max(255).optional().describe('Category icon identifier'),
    parentId: UUID.optional().describe(
      'Parent category ID for hierarchical structure',
    ),
    isActive: z.boolean().default(true).describe('Whether category is active'),
    sortOrder: z.number().int().default(0).describe('Sort order for display'),
    slug: z.string().max(255).describe('URL-friendly category identifier'),
    level: z
      .number()
      .int()
      .describe('Hierarchy level (1 for root, 2+ for children)'),
    path: z.string().describe('Hierarchical path using parent IDs'),
    createdBy: UserId.describe('User who created the category'),
    updatedBy: UserId.optional().describe('User who last updated the category'),
  }),
  {
    description: 'Category information',
  },
)

/**
 * Public category response with optional children
 * Note: Using manual $ref for recursive structure as z.lazy() is not supported in zod-to-openapi
 */
export const CategoryResponse = BaseCategoryResponse.extend({
  children: z
    .array(BaseCategoryResponse)
    .optional()
    .describe('Child categories for hierarchical display')
    .openapi({
      type: 'array',
      items: {
        $ref: '#/components/schemas/CategoryResponse',
      },
    }),
}).openapi('CategoryResponse', {
  description: 'Category information with hierarchical structure',
})

export type CategoryResponse = z.infer<typeof CategoryResponse>

// ============= Search Categories =============

/**
 * Category search/filter parameters
 */
export const CategoryQueryParams = SearchParams.extend({
  parentId: UUID.optional().describe('Filter by parent category'),
  isActive: optionalBoolean().describe('Filter by active status'),
  sortBy: CategorySortBySchema.default(CategorySortBy.SORT_ORDER),
}).merge(createIncludeParam(CATEGORY_RELATIONS))

export type CategoryQueryParams = z.infer<typeof CategoryQueryParams>

/**
 * Category hierarchy query parameters
 */
export const CategoryHierarchyQuery = z.object({
  rootId: UUID.optional().describe('Root category ID for partial hierarchy'),
})

export type CategoryHierarchyQuery = z.infer<typeof CategoryHierarchyQuery>

/**
 * Category path parameters
 */
export const CategoryPathParams = z.object({
  id: UUID.describe('Category ID'),
})

export type CategoryPathParams = z.infer<typeof CategoryPathParams>

// ============= Response Types =============

/**
 * Paginated category list response
 */
export const CategoryListResponse = paginatedResponse(CategoryResponse)

export type CategoryListResponse = z.infer<typeof CategoryListResponse>

/**
 * Category hierarchy response
 */
export const CategoryHierarchyResponse = openapi(
  z.object({
    data: z.array(CategoryResponse),
  }),
  {
    description: 'Hierarchical category tree structure',
  },
)

export type CategoryHierarchyResponse = z.infer<
  typeof CategoryHierarchyResponse
>

/**
 * Category path response
 */
export const CategoryPathResponse = openapi(
  z.object({
    data: z.array(CategoryResponse),
  }),
  {
    description: 'Category path from root to specified category',
  },
)

export type CategoryPathResponse = z.infer<typeof CategoryPathResponse>
