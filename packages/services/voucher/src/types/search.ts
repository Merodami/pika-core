import type { ParsedIncludes, SearchParams, VoucherState } from '@pika/types'

/**
 * Voucher search and filter types
 */

export interface VoucherSearchParams extends SearchParams {
  businessId?: string
  userId?: string
  categoryId?: string
  type?: string
  state?: VoucherState | VoucherState[]
  search?: string
  minValue?: number
  maxValue?: number
  minDiscount?: number
  maxDiscount?: number
  discountType?: string
  currency?: string
  validFrom?: Date
  validUntil?: Date
  validFromStart?: Date
  validFromEnd?: Date
  expiresAtStart?: Date
  expiresAtEnd?: Date
  createdFromStart?: Date
  createdFromEnd?: Date
  minRedemptions?: number
  maxRedemptions?: number
  minScans?: number
  maxScans?: number
  isDeleted?: boolean
  includeExpired?: boolean
  includeDeleted?: boolean
  parsedIncludes?: ParsedIncludes
}

/**
 * User voucher search parameters
 */
export interface UserVoucherSearchParams extends SearchParams {
  userId: string
  status?: string
}

/**
 * Internal voucher search parameters
 */
export interface InternalVoucherSearchParams extends SearchParams {
  businessId?: string
  categoryId?: string
  state?: VoucherState | VoucherState[]
  includeExpired?: boolean
  includeDeleted?: boolean
}
