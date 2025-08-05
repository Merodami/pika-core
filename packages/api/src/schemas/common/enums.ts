import {
  SortOrder as SortOrderEnum,
  TimestampSortBy as TimestampSortByEnum,
} from '@pika/types'

import { openapi } from '../../common/utils/openapi.js'
import { createZodEnum } from '../../common/utils/zodEnum.js'

/**
 * Common enum schemas used across multiple API endpoints
 */

// ============= Sort Order =============

/**
 * Sort order schema - ascending/descending
 */
export const SortOrder = createZodEnum(SortOrderEnum)
export const SortOrderSchema = openapi(SortOrder, {
  description: 'Sort order - ascending (asc) or descending (desc)',
  example: SortOrderEnum.DESC,
})

// ============= Timestamp Sort =============

/**
 * Common timestamp sort fields
 */
export const TimestampSortBy = createZodEnum(TimestampSortByEnum)
export const TimestampSortBySchema = openapi(TimestampSortBy, {
  description: 'Sort by timestamp fields',
  example: TimestampSortByEnum.CREATED_AT,
})
