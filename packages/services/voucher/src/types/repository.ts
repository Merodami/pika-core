import type { VoucherState } from '@pika/types'

/**
 * Repository data types
 */

export interface CreateVoucherData {
  businessId: string
  categoryId?: string
  titleKey: string
  descriptionKey: string
  termsAndConditionsKey: string
  type: string
  value?: number
  discount?: number
  currency?: string
  imageUrl?: string
  validFrom?: Date
  validUntil?: Date
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any>
  qrCode?: string
  state: VoucherState
  // Note: redemptionsCount, scanCount, claimCount are auto-initialized by DB defaults
}

export interface UpdateVoucherData {
  categoryId?: string
  titleKey?: string
  descriptionKey?: string
  termsAndConditionsKey?: string
  type?: string
  value?: number
  discount?: number
  currency?: string
  imageUrl?: string
  validFrom?: Date
  validUntil?: Date
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any>
  state?: VoucherState
  // Note: Cannot update businessId, qrCode should be handled separately
  // Analytics fields (redemptionsCount, scanCount, claimCount) are updated via specific operations
}

export interface BulkUpdateData {
  state?: VoucherState
  validUntil?: Date
  maxRedemptions?: number
}

export interface BulkUpdateVouchersData {
  ids: string[]
  updates: UpdateVoucherData
}
