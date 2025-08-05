import type { PaginatedResult } from '@pika/types'

/**
 * Creates a paginated response by transforming domain objects to DTOs
 *
 * @param result - The paginated result from the service layer
 * @param mapFn - The mapping function to transform domain objects to DTOs
 * @returns Paginated result with transformed data
 *
 * @example
 * // In controller
 * const result = await this.service.getAll(params)
 * res.json(paginatedResponse(result, UserMapper.toDTO))
 */
export function paginatedResponse<TDomain, TDTO>(
  result: PaginatedResult<TDomain>,
  mapFn: (domain: TDomain) => TDTO,
): PaginatedResult<TDTO> {
  return {
    data: result.data.map(mapFn),
    pagination: result.pagination,
  }
}
