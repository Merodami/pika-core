import { get, has } from 'lodash-es'
import { z } from 'zod'

/**
 * Unified sorting field mapping utility
 * Maps API sort field names to database column names
 */

// Define the mapping type
export type SortFieldMapping<
  TApiFields extends string,
  TDbFields extends string,
> = {
  [K in TApiFields]: TDbFields
}

/**
 * Create a sort field mapper that converts API sort fields to database fields
 * This keeps the mapping logic close to the API schemas where it belongs
 */
export function createSortFieldMapper<
  TApiSchema extends z.ZodEnum<any>,
  TDbFields extends string,
>(
  apiSchema: TApiSchema,
  mapping: SortFieldMapping<z.infer<TApiSchema>, TDbFields>,
) {
  return {
    /**
     * Map API sort field to database field
     */
    mapSortField(
      apiField: z.infer<TApiSchema> | undefined,
      defaultField: TDbFields,
    ): TDbFields {
      if (!apiField) return defaultField

      return has(mapping, apiField) ? get(mapping, apiField) : defaultField
    },

    /**
     * Validate if a field is valid
     */
    isValidField(field: string): field is z.infer<TApiSchema> {
      return apiSchema.options.includes(field as any)
    },
  }
}

/**
 * Common sort order mapping
 * Maps API sort orders (uppercase) to database sort orders (lowercase)
 */
export function mapSortOrder(apiOrder: string | undefined): 'asc' | 'desc' {
  const orderMap: Record<string, 'asc' | 'desc'> = {
    ASC: 'asc',
    DESC: 'desc',
    asc: 'asc',
    desc: 'desc',
  }

  return apiOrder
    ? has(orderMap, apiOrder)
      ? get(orderMap, apiOrder)
      : 'desc'
    : 'desc'
}

/**
 * Helper type for search params with sorting
 */
export interface SearchParamsWithSorting {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
  search?: string
}
