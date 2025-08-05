import type { ParsedIncludes, SearchParams } from '@pika/types'

/**
 * Voucher book search parameters
 */
export interface VoucherBookSearchParams extends SearchParams {
  // Filters
  search?: string
  status?: string
  format?: string
  isActive?: boolean
  providerId?: string
  region?: string
  createdById?: string
  bookType?: string
  year?: number
  month?: number

  // Relations
  parsedIncludes?: ParsedIncludes
}

/**
 * Admin voucher book search parameters with extended filters
 */
export interface AdminVoucherBookSearchParams extends VoucherBookSearchParams {
  createdBy?: string
  updatedBy?: string
  hasContent?: boolean
  hasPdf?: boolean
  bookType?: string
  year?: number
  month?: number
}

/**
 * Ad placement search parameters
 */
export interface AdPlacementSearchParams extends SearchParams {
  voucherBookId?: string
  businessId?: string
  position?: string
  size?: string
  contentType?: string
  isActive?: boolean

  // Relations
  parsedIncludes?: ParsedIncludes
}

/**
 * Book distribution search parameters
 */
export interface BookDistributionSearchParams extends SearchParams {
  voucherBookId?: string
  businessId?: string
  status?: string
  distributionType?: string
  shippedAfter?: Date
  shippedBefore?: Date

  // Relations
  parsedIncludes?: ParsedIncludes
}
