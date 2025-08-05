import type { ParsedIncludes } from '@pika/types'

/**
 * Business search and filter types
 */

export interface BusinessSearchParams {
  page?: number
  limit?: number
  sortBy?:
    | 'businessName'
    | 'avgRating'
    | 'verified'
    | 'active'
    | 'createdAt'
    | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  userId?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
  minRating?: number
  maxRating?: number
  search?: string
  includeDeleted?: boolean
  parsedIncludes?: ParsedIncludes
}

export interface BusinessFilters {
  userId?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
  minRating?: number
  maxRating?: number
  search?: string
  includeDeleted?: boolean
}

export interface BusinessStats {
  totalBusinesses: number
  verifiedBusinesses: number
  activeBusinesses: number
  averageRating: number
  businessesByCategory: Array<{
    categoryId: string
    categoryName: string
    count: number
  }>
}
