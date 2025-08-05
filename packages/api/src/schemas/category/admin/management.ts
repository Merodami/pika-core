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
 * Admin category management schemas
 */

// ============= Admin Category Response =============

/**
 * Admin category response (includes all fields for management)
 */
export const AdminCategoryResponse = withTimestamps({
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
    .min(1)
    .describe('Hierarchy level (1 for root categories)'),
  path: z
    .string()
    .max(1000)
    .describe('Materialized path for hierarchy navigation'),
  createdBy: UserId.describe('User who created the category'),
  updatedBy: UserId.optional().describe('User who last updated the category'),
  children: z
    .array(z.object({}))
    .optional()
    .describe('Child categories for hierarchical display')
    .openapi({
      type: 'array',
      items: {
        $ref: '#/components/schemas/AdminCategoryResponse',
      },
    }),
}).openapi('AdminCategoryResponse', {
  description:
    'Category information for admin management with hierarchical structure',
})

export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponse>

// ============= Create Category =============

/**
 * Create category request
 */
export const CreateCategoryRequest = openapi(
  z.object({
    nameKey: z
      .string()
      .min(1)
      .max(255)
      .describe('Translation key for category name'),
    descriptionKey: z
      .string()
      .max(255)
      .optional()
      .describe('Translation key for category description'),
    icon: z.string().max(255).optional().describe('Category icon identifier'),
    parentId: UUID.optional().describe('Parent category ID'),
    isActive: z.boolean().default(true).describe('Whether category is active'),
    sortOrder: z.number().int().default(0).describe('Sort order for display'),
  }),
  {
    description: 'Create a new category',
  },
)

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>

// ============= Update Category =============

/**
 * Update category request
 */
export const UpdateCategoryRequest = openapi(
  z.object({
    nameKey: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe('Translation key for category name'),
    descriptionKey: z
      .string()
      .max(255)
      .optional()
      .describe('Translation key for category description'),
    icon: z.string().max(255).optional().describe('Category icon identifier'),
    parentId: UUID.optional().describe('Parent category ID'),
    isActive: z.boolean().optional().describe('Whether category is active'),
    sortOrder: z.number().int().optional().describe('Sort order for display'),
  }),
  {
    description: 'Update category information',
  },
)

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequest>

// ============= Admin Search Categories =============

/**
 * Admin category search/filter parameters
 */
export const AdminCategoryQueryParams = SearchParams.extend({
  parentId: UUID.optional().describe('Filter by parent category'),
  isActive: optionalBoolean().describe('Filter by active status'),
  createdBy: UserId.optional().describe('Filter by creator'),
  sortBy: CategorySortBySchema.default(CategorySortBy.SORT_ORDER),
}).merge(createIncludeParam(CATEGORY_RELATIONS))

export type AdminCategoryQueryParams = z.infer<typeof AdminCategoryQueryParams>

// ============= Response Types =============

/**
 * Admin paginated category list response
 */
export const AdminCategoryListResponse = paginatedResponse(
  AdminCategoryResponse,
)

export type AdminCategoryListResponse = z.infer<
  typeof AdminCategoryListResponse
>

/**
 * Admin category tree response (hierarchical structure)
 */
export const AdminCategoryTreeResponse = openapi(
  z.object({
    categories: z.array(AdminCategoryResponse),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Hierarchical category tree structure for admin',
  },
)

export type AdminCategoryTreeResponse = z.infer<
  typeof AdminCategoryTreeResponse
>

// ============= Category Management Actions =============

/**
 * Move category request (change parent)
 */
export const MoveCategoryRequest = openapi(
  z.object({
    parentId: UUID.optional().describe(
      'New parent category ID (null for root level)',
    ),
    sortOrder: z
      .number()
      .int()
      .optional()
      .describe('New sort order within parent'),
  }),
  {
    description: 'Move category to different parent or change sort order',
  },
)

export type MoveCategoryRequest = z.infer<typeof MoveCategoryRequest>

/**
 * Update category sort order request
 */
export const UpdateCategorySortOrderRequest = openapi(
  z.object({
    sortOrder: z.number().int().describe('New sort order value'),
  }),
  {
    description: 'Update category sort order',
  },
)

export type UpdateCategorySortOrderRequest = z.infer<
  typeof UpdateCategorySortOrderRequest
>

/**
 * Toggle category activation request
 */
export const ToggleCategoryActivationRequest = openapi(
  z.object({
    isActive: z.boolean().describe('New activation status'),
  }),
  {
    description: 'Toggle category activation status',
  },
)

export type ToggleCategoryActivationRequest = z.infer<
  typeof ToggleCategoryActivationRequest
>

/**
 * Bulk category update request
 */
export const BulkCategoryUpdateRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
    updates: z.object({
      isActive: z.boolean().optional(),
      parentId: UUID.optional(),
    }),
  }),
  {
    description: 'Update multiple categories at once',
  },
)

export type BulkCategoryUpdateRequest = z.infer<
  typeof BulkCategoryUpdateRequest
>

/**
 * Bulk operation response
 */
export const BulkCategoryOperationResponse = openapi(
  z.object({
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    errors: z
      .array(
        z.object({
          categoryId: UUID,
          error: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Bulk category operation result',
  },
)

export type BulkCategoryOperationResponse = z.infer<
  typeof BulkCategoryOperationResponse
>

// ============= Bulk Delete Categories =============

/**
 * Bulk delete categories request
 */
export const BulkDeleteCategoriesRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Delete multiple categories',
  },
)

export type BulkDeleteCategoriesRequest = z.infer<
  typeof BulkDeleteCategoriesRequest
>
