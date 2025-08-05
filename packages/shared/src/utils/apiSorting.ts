/**
 * Enhanced API sorting utilities
 *
 * Provides improved type safety for converting between API sort parameters and domain sort parameters
 */

/**
 * Represents standard sort parameters in the application
 */
export interface DomainSortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Represents API sort parameters with stricter types
 */
export interface SafeApiSortParams {
  sort?: string | undefined
  sortBy?: string | undefined
  sortOrder?: 'asc' | 'desc' | undefined
}

/**
 * Default sort direction if not specified
 */
export const DEFAULT_SORT_DIRECTION = 'asc' as const

/**
 * Parse a combined sort string into separate sortBy and sortOrder parameters
 * Type-safe version with no null handling, only undefined
 *
 * @param sortString - Combined sort string in format 'field:direction'
 * @returns Parsed sort parameters
 */
export function parseSortString(sortString?: string): DomainSortParams {
  if (!sortString) {
    return {}
  }

  const parts = sortString.split(':')

  if (parts.length === 1) {
    return {
      sortBy: parts[0],
      sortOrder: DEFAULT_SORT_DIRECTION,
    }
  }

  return {
    sortBy: parts[0],
    sortOrder: parts[1] === 'desc' ? 'desc' : 'asc',
  }
}

/**
 * Convert API sort parameters to standardized sort parameters with improved type safety
 * Handles both combined 'sort' parameter and separate 'sortBy'/'sortOrder' parameters
 * Prioritizes sortBy/sortOrder if both formats are provided
 *
 * @param params - API sort parameters
 * @returns Standardized sort parameters
 */
export function convertApiSortParams(
  params: SafeApiSortParams,
): DomainSortParams {
  // Initialize with default empty result
  const result: DomainSortParams = {}

  // First process the combined sort parameter if present
  if (params.sort) {
    const parsed = parseSortString(params.sort)

    result.sortBy = parsed.sortBy
    result.sortOrder = parsed.sortOrder
  }

  // Then override with explicit sortBy and sortOrder if provided
  if (params.sortBy) {
    result.sortBy = params.sortBy
  }

  if (params.sortOrder) {
    result.sortOrder = params.sortOrder
  }

  return result
}
