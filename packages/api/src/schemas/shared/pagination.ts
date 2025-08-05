import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'

/**
 * Common pagination schemas
 */

// ============= Pagination Parameters =============

/**
 * Common pagination query parameters
 */
export const PaginationParams = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
})

export type PaginationParams = z.infer<typeof PaginationParams>

// ============= Sort Parameters =============

/**
 * Common sort parameters
 */
export const SortParams = z.object({
  sortBy: z.string().optional().describe('Field to sort by'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
})

export type SortParams = z.infer<typeof SortParams>

// ============= Date Range Parameters =============

/**
 * Common date range parameters
 */
export const DateRangeParams = z.object({
  fromDate: z.string().datetime().optional().describe('Start date (ISO 8601)'),
  toDate: z.string().datetime().optional().describe('End date (ISO 8601)'),
})

export type DateRangeParams = z.infer<typeof DateRangeParams>

// ============= Search Parameters =============

/**
 * Common search parameters
 */
export const SearchParams = PaginationParams.merge(SortParams).extend({
  search: z.string().optional().describe('Search query'),
})

export type SearchParams = z.infer<typeof SearchParams>

// ============= Cursor Pagination =============

/**
 * Cursor-based pagination parameters
 */
export const CursorPaginationParams = z.object({
  cursor: z.string().optional().describe('Cursor for pagination'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
})

export type CursorPaginationParams = z.infer<typeof CursorPaginationParams>

/**
 * Cursor pagination metadata
 */
export const CursorPaginationMetadata = z.object({
  hasNext: z.boolean().describe('Whether there are more items'),
  hasPrev: z.boolean().describe('Whether there are previous items'),
  nextCursor: z.string().optional().describe('Cursor for next page'),
  prevCursor: z.string().optional().describe('Cursor for previous page'),
})

export type CursorPaginationMetadata = z.infer<typeof CursorPaginationMetadata>

// ============= Pagination Links =============

/**
 * HATEOAS pagination links
 */
export const PaginationLinks = z.object({
  self: z.string().url().describe('Current page URL'),
  first: z.string().url().optional().describe('First page URL'),
  last: z.string().url().optional().describe('Last page URL'),
  prev: z.string().url().optional().describe('Previous page URL'),
  next: z.string().url().optional().describe('Next page URL'),
})

export type PaginationLinks = z.infer<typeof PaginationLinks>

// ============= Paginated Response with Links =============

/**
 * Enhanced paginated response factory with HATEOAS links
 */
export function paginatedResponseWithLinks<T extends z.ZodTypeAny>(
  itemSchema: T,
  options?: {
    description?: string
  },
) {
  return openapi(
    z.object({
      data: z.array(itemSchema).describe('Page items'),
      pagination: z.object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
      links: PaginationLinks.optional(),
    }),
    {
      description:
        options?.description || 'Paginated response with navigation links',
    },
  )
}
