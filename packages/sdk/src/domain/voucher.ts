/**
 * Voucher Domain Models
 * These represent the core business entities used internally
 */

import type {
  Coordinates,
  CustomerVoucherStatus,
  VoucherCodeType,
  VoucherDiscountType,
  VoucherScanSource,
  VoucherScanType,
  VoucherState,
} from '@pika/types'

// ============= Voucher Domain =============

export interface VoucherLocation extends Coordinates {
  radius?: number
}

export interface VoucherCode {
  id: string
  code: string
  type: VoucherCodeType
  isActive: boolean
  metadata?: Record<string, any>
}

// ============= Voucher Operation Results =============

export interface VoucherScanResult {
  voucher: VoucherDomain
  scanId: string
  canClaim: boolean
  alreadyClaimed: boolean
  nearbyLocations?: Array<{
    name: string
    address: string
    distance: number
    coordinates: {
      latitude: number
      longitude: number
    }
  }>
}

export interface VoucherClaimResult {
  claimId: string
  voucher: VoucherDomain
  claimedAt: Date
  expiresAt?: Date | null
  walletPosition: number
}

export interface VoucherRedeemResult {
  message: string
  voucherId: string
  redeemedAt: Date
  discountApplied: number
  voucher: VoucherDomain
}

export interface UserVoucherData {
  voucher: VoucherDomain
  claimedAt: Date
  status: string
  redeemedAt?: Date
}

export interface VoucherDomain {
  id: string
  businessId: string
  categoryId: string
  state: VoucherState
  // Translation keys - stored in database
  titleKey: string
  descriptionKey: string
  termsAndConditionsKey: string
  // Resolved content - populated by TranslationResolver when needed
  title?: string
  description?: string
  termsAndConditions?: string
  discountType: VoucherDiscountType
  discountValue: number
  currency: string
  location?: VoucherLocation | null
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  codes?: VoucherCode[]
}

// ============= Create/Update Domain Types =============

export interface CreateVoucherData {
  businessId: string
  categoryId: string
  title: Record<string, string> // Multilingual: { es: "...", en: "..." }
  description: Record<string, string>
  termsAndConditions: Record<string, string>
  discountType: VoucherDiscountType
  discountValue: number
  currency: string
  location?: VoucherLocation | null
  imageUrl?: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  metadata?: Record<string, any> | null
}

export interface UpdateVoucherData {
  title?: Record<string, string> // Multilingual: { es: "...", en: "..." }
  description?: Record<string, string>
  termsAndConditions?: Record<string, string>
  discountType?: VoucherDiscountType
  discountValue?: number
  currency?: string
  location?: VoucherLocation | null
  imageUrl?: string | null
  validFrom?: Date
  expiresAt?: Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any> | null
}

// ============= Voucher Scan Domain =============

export interface VoucherScanData {
  voucherId: string
  userId?: string | null
  scanSource: VoucherScanSource
  scanType: VoucherScanType
  location?: VoucherLocation | null
  deviceInfo?: {
    platform: string
    version: string
    model?: string
  } | null
  userAgent?: string | null
  businessId?: string | null
  metadata?: Record<string, any> | null
}

// ============= Customer Voucher Domain =============

export interface CustomerVoucherDomain {
  id: string
  userId: string
  voucherId: string
  status: CustomerVoucherStatus
  claimedAt: Date
  redeemedAt?: Date | null
  expiresAt: Date
  redemptionCode?: string | null
  redemptionLocation?: VoucherLocation | null
  metadata?: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
  // Relations
  voucher?: VoucherDomain
}
