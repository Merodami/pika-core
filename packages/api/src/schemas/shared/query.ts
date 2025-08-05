import { AnalyticsGroupBy, SortOrder } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'
import { createZodEnum } from '../../common/utils/zodEnum.js'
import { SortOrderSchema } from '../common/enums.js'
import { PaginationParams } from './pagination.js'

/**
 * Query parameter utilities for consistent API patterns
 */

// ============= Analytics Parameters =============

/**
 * Analytics grouping periods for time-based aggregations
 */
export const AnalyticsGroupBySchema = openapi(createZodEnum(AnalyticsGroupBy), {
  description: 'Analytics grouping period',
  example: AnalyticsGroupBy.DAY,
})

// ============= Typed Sorting =============

/**
 * Creates a typed sort schema with specific sort fields
 */
export function createSortParams<T extends readonly string[]>(
  sortFields: T,
  defaultField: T[number] = sortFields[0],
) {
  return z.object({
    sortBy: z
      .enum(sortFields as unknown as [string, ...string[]])
      .default(defaultField),
    sortOrder: SortOrderSchema.default(SortOrder.DESC),
  })
}

// ============= Include Relations =============

/**
 * Creates an include parameter for relation loading
 */
export function createIncludeParam<T extends readonly string[]>(
  allowedRelations: T,
) {
  return z.object({
    include: z
      .string()
      .optional()
      .describe(`Comma-separated relations: ${allowedRelations.join(',')}`),
  })
}

// ============= Combined Search Schemas =============

/**
 * Creates a complete search schema with pagination, sorting, and includes
 */
export function createSearchSchema<
  TSortFields extends readonly string[],
  TIncludeRelations extends readonly string[],
>(config: {
  sortFields: TSortFields
  includeRelations: TIncludeRelations
  defaultSortField?: TSortFields[number]
  additionalParams?: z.ZodRawShape
}) {
  const {
    sortFields,
    includeRelations,
    defaultSortField,
    additionalParams = {},
  } = config

  return z.object({
    ...PaginationParams.shape,
    ...createSortParams(sortFields, defaultSortField).shape,
    ...createIncludeParam(includeRelations).shape,
    search: z.string().optional(),
    ...additionalParams,
  })
}

/**
 * Creates a by-ID query schema with include support
 */
export function createByIdQuerySchema<T extends readonly string[]>(
  allowedRelations: T,
) {
  return createIncludeParam(allowedRelations)
}
