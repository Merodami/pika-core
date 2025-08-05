import { CategorySortBy as CategorySortByEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createSortFieldMapper } from '../../../common/utils/sorting.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Category-specific enum schemas
 */

// ============= Category Enums =============

/**
 * Category sort fields - shared across public and admin APIs
 */
export const CategorySortBySchema = openapi(createZodEnum(CategorySortByEnum), {
  description: 'Field to sort categories by',
  example: CategorySortByEnum.NAME,
})

export type CategorySortBy = z.infer<typeof CategorySortBySchema>

/**
 * Category sort field mapper
 * Maps API sort fields to database column names
 */
export const categorySortFieldMapper = createSortFieldMapper(
  CategorySortBySchema,
  {
    name: 'nameKey',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
)

// Category relations that can be included
export const CATEGORY_RELATIONS = ['parent', 'children'] as const

export type CategoryRelations = (typeof CATEGORY_RELATIONS)[number]
