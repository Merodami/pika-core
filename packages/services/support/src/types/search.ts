/**
 * Base search parameters for pagination and sorting
 */
export interface SearchParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}
