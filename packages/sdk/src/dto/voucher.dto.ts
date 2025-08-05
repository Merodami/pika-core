/**
 * Voucher DTOs (Data Transfer Objects)
 * These represent the API contract for voucher-related endpoints
 */

import type {
  CustomerVoucherStatus,
  VoucherCodeType,
  VoucherScanSource,
  VoucherScanType,
  VoucherStateType,
} from '@pika/types'

// ============= Voucher DTO =============

export interface VoucherLocationDTO {
  lat: number
  lng: number
  radius?: number
}

// GeoJSON Point format for location
export interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
  radius?: number
}

export interface VoucherCodeDTO {
  id: string
  code: string
  type: VoucherCodeType
  isActive: boolean
  metadata?: Record<string, any>
}

export interface VoucherDTO {
  id: string
  businessId: string
  categoryId: string
  state: VoucherStateType
  title: string // Localized by TranslationService before sending to client
  description: string // Localized by TranslationService before sending to client
  terms: string // Localized by TranslationService before sending to client
  discountType: 'percentage' | 'fixed'
  discountValue: number
  currency: string
  location: VoucherLocationDTO | null
  imageUrl?: string | null
  validFrom: string
  expiresAt: string
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  codes?: VoucherCodeDTO[]
}

// ============= Create/Update DTOs =============

// Internal types that represent the data after Zod transformation
export interface CreateVoucherRequestData {
  businessId: string
  categoryId: string
  title: Record<string, string>
  description: Record<string, string>
  termsAndConditions: Record<string, string>
  discountType: 'percentage' | 'fixed'
  discountValue: number
  currency: string
  location?: GeoJSONPoint | null
  imageUrl?: string | null
  validFrom: Date // Zod transforms to Date
  expiresAt: Date // Zod transforms to Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  metadata?: Record<string, any> | null
}

export interface UpdateVoucherRequestData {
  title?: Record<string, string>
  description?: Record<string, string>
  termsAndConditions?: Record<string, string>
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  currency?: string
  location?: GeoJSONPoint | null
  imageUrl?: string | null
  validFrom?: Date // Zod transforms to Date
  expiresAt?: Date // Zod transforms to Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any> | null
}

export interface BulkVoucherUpdateData {
  state?:
    | 'draft'
    | 'published'
    | 'claimed'
    | 'redeemed'
    | 'expired'
    | 'suspended'
  expiresAt?: Date // Zod transforms to Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser?: number
}

export interface CreateVoucherDTO {
  businessId: string
  categoryId: string
  title: Record<string, string> // Multilingual content: { es: "...", en: "..." }
  description: Record<string, string>
  termsAndConditions: Record<string, string>
  discountType: 'percentage' | 'fixed'
  discountValue: number
  currency: string
  location?: VoucherLocationDTO | GeoJSONPoint | null
  imageUrl?: string | null
  validFrom: string
  expiresAt: string
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  metadata?: Record<string, any> | null
}

export interface UpdateVoucherDTO {
  title?: Record<string, string> // Multilingual content: { es: "...", en: "..." }
  description?: Record<string, string>
  termsAndConditions?: Record<string, string>
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  currency?: string
  location?: VoucherLocationDTO | GeoJSONPoint | null
  imageUrl?: string | null
  validFrom?: string
  expiresAt?: string
  maxRedemptions?: number | null
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any> | null
}

// ============= Voucher Scan DTO =============

export interface VoucherScanDTO {
  voucherId: string
  userId?: string
  scanSource: VoucherScanSource
  scanType: VoucherScanType
  location?: VoucherLocationDTO | GeoJSONPoint | null
  userAgent?: string
  metadata?: Record<string, any>
  scannedAt: string
}

export interface VoucherScanRequestDTO {
  scanSource: VoucherScanSource
  scanType: VoucherScanType
  location?: VoucherLocationDTO | GeoJSONPoint | null
  userAgent?: string
  metadata?: Record<string, any>
}

export interface VoucherScanResponseDTO {
  success: boolean
  message: string
  scanId: string
  voucher: VoucherDTO
}

// ============= Voucher Claim DTO =============

export interface VoucherClaimRequestDTO {
  userId: string
  metadata?: Record<string, any>
}

export interface VoucherClaimResponseDTO {
  success: boolean
  message: string
  customerVoucher: CustomerVoucherDTO
  redemptionCode: string
}

// ============= Voucher Redeem DTO =============

export interface VoucherRedeemRequestDTO {
  redemptionCode: string
  location?: VoucherLocationDTO | GeoJSONPoint | null
  metadata?: Record<string, any>
}

export interface VoucherRedeemResponseDTO {
  success: boolean
  message: string
  customerVoucher: CustomerVoucherDTO
  discountAmount: number
}

// ============= Customer Voucher DTO =============

export interface CustomerVoucherDTO {
  id: string
  userId: string
  voucherId: string
  status: CustomerVoucherStatus
  claimedAt: string
  redeemedAt?: string
  expiresAt: string
  redemptionCode?: string
  redemptionLocation?: VoucherLocationDTO
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  // Relations
  voucher?: VoucherDTO
}

// ============= State Management DTOs =============

export interface VoucherStateUpdateDTO {
  state: string
  metadata?: Record<string, any>
}

export interface VoucherPublishRequestDTO {
  publishAt?: string
  metadata?: Record<string, any>
}

export interface VoucherExpireRequestDTO {
  reason?: string
  metadata?: Record<string, any>
}

// ============= Validation DTOs =============

export interface ValidateVoucherRequestDTO {
  voucherId: string
  checkActive?: boolean
  checkExpiration?: boolean
  checkRedemptionLimit?: boolean
}

export interface ValidateVoucherResponseDTO {
  valid: boolean
  voucher?: VoucherDTO
  reason?: string
  validationErrors?: string[]
}

// ============= Batch Operation DTOs =============

export interface GetVouchersByIdsRequestDTO {
  voucherIds: string[]
  includeInactive?: boolean
  includeExpired?: boolean
}

export interface GetVouchersByIdsResponseDTO {
  vouchers: VoucherDTO[]
  notFound?: string[]
}

// ============= Analytics DTOs =============

export interface VoucherAnalyticsDTO {
  voucherId: string
  totalScans: number
  totalClaims: number
  totalRedemptions: number
  conversionRate: number
  scansBySource: Record<string, number>
  scansByType: Record<string, number>
  dailyStats: Array<{
    date: string
    scans: number
    claims: number
    redemptions: number
  }>
  topLocations?: Array<{
    location: VoucherLocationDTO | GeoJSONPoint
    count: number
  }>
}

export interface VoucherAnalyticsRequestDTO {
  voucherId: string
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}

// ============= List Response DTOs =============

export interface VoucherListDTO {
  data: VoucherDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CustomerVoucherListDTO {
  data: CustomerVoucherDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
