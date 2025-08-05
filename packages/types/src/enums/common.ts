/**
 * Common enums used across multiple services
 */

/**
 * Sort order for queries
 * Used for ascending/descending sort operations
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Type definition for sort order - use this for type annotations
 */
export type SortOrderType = `${SortOrder}`

/**
 * Common timestamp sort fields - used by entities that only sort by timestamps
 */
export enum TimestampSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for timestamp sort by - use this for type annotations
 */
export type TimestampSortByType = `${TimestampSortBy}`

/**
 * Analytics grouping periods for time-based aggregations
 * Used for analytics queries across different services
 */
export enum AnalyticsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Type definition for analytics group by - use this for type annotations
 */
export type AnalyticsGroupByType = `${AnalyticsGroupBy}`
