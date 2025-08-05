import type { VoucherDomain } from '@pika/sdk'

/**
 * Domain types for voucher service operations
 */

// ============= Service Operation Types =============

export interface VoucherClaimData {
  notificationPreferences?: {
    enableReminders: boolean
    reminderDaysBefore?: number
  }
}

export interface VoucherRedeemData {
  code: string
  userId: string
  location?: any
  businessId?: string
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  notificationPreferences?: {
    sendConfirmation: boolean
  }
}

export interface VoucherRedeemResult {
  success: boolean
  voucher: VoucherDomain
  redemptionId: string
  message?: string
}

export interface VoucherClaimResult {
  success: boolean
  voucher: VoucherDomain
  customerVoucherId: string
  message?: string
}

// ============= Internal Service Types =============

export interface VoucherValidationOptions {
  userId?: string
  checkRedemptionLimit?: boolean
  checkExpiry?: boolean
  checkState?: boolean
}

export interface VoucherValidationResult {
  isValid: boolean
  reason?: string
  voucher?: VoucherDomain
}

export interface VoucherExistsOptions {
  voucherId?: string
  code?: string
}

export interface VoucherExistsResult {
  exists: boolean
  voucherId?: string
}

export interface RedemptionTrackingData {
  voucherId: string
  userId?: string
  code?: string
  metadata?: Record<string, any>
}

export interface RedemptionTrackingResult {
  redemptionId: string
  success: boolean
  currentRedemptions: number
  maxRedemptions?: number
}

export interface BatchProcessOperation {
  voucherIds: string[]
  operation: 'expire' | 'validate' | 'activate'
  context?: Record<string, any>
}

export interface BatchProcessResult {
  processedCount: number
  successCount: number
  failedCount: number
  results: Array<{
    voucherId: string
    success: boolean
    error?: string
  }>
}

// ============= Analytics Types =============

export interface VoucherAnalyticsParams {
  startDate?: Date
  endDate?: Date
  groupBy?: 'day' | 'week' | 'month'
}

export interface VoucherAnalyticsData {
  period: string
  scans: number
  claims: number
  redemptions: number
  uniqueUsers: number
}

export interface VoucherStats {
  totalVouchers: number
  activeVouchers: number
  expiredVouchers: number
  totalScans: number
  totalClaims: number
  totalRedemptions: number
  averageRedemptionRate: number
}

// ============= Admin Service Types =============

// BulkUpdateData moved to repository.ts to avoid duplicate export

export interface VoucherAnalytics {
  totalVouchers: number
  activeVouchers: number
  expiredVouchers: number
  totalRedemptions: number
  redemptionRate: number
  averageValue: number
  vouchersByType: Record<string, number>
  vouchersByState: Record<string, number>
  vouchersByBusiness: Record<string, number>
}

export interface BusinessVoucherStats {
  businessId: string
  businessName?: string
  totalVouchers: number
  activeVouchers: number
  expiredVouchers: number
  totalRedemptions: number
  totalRevenue: number
  averageRedemptionValue: number
}

export interface GenerateCodesData {
  codeType: 'qr' | 'short' | 'static'
  quantity?: number
  customCodes?: string[]
}

export interface VoucherCode {
  id: string
  code: string
  type: 'qr' | 'short' | 'static'
  voucherId: string
  createdAt: Date
}

export interface VoucherTranslations {
  title: Record<string, string>
  description: Record<string, string>
  termsAndConditions: Record<string, string>
}

// ============= Voucher Security Types =============

export interface VoucherTokenData {
  voucherId: string
  qrPayload: string
  shortCode: string
  batchId?: string
}

export interface GenerateTokenOptions {
  voucherId: string
  providerId: string
  batchId?: string
  ttl?: number
  includeShortCode?: boolean
}

export interface BatchTokenGenerationRequest {
  vouchers: Array<{
    voucherId: string
    providerId: string
  }>
  batchId?: string
}

// ============= Voucher Book Types =============

export type VoucherBookStatus =
  | 'draft'
  | 'ready_for_print'
  | 'published'
  | 'archived'

export interface VoucherBookStateTransition {
  allowed: boolean
  reason?: string
  requiredFields?: string[]
}

export interface VoucherBookValidation {
  title?: string
  description?: string
  month?: string
  year?: number
  totalPages?: number
  voucherCount?: number
}

export interface VoucherForBook {
  id: string
  businessId: string
  title: Record<string, string>
  description: Record<string, string>
  terms: Record<string, string>
  discountType: string
  discountValue: number
  validFrom?: Date
  validTo?: Date
  businessName: string
  businessLogo?: string
  category: string
  qrPayload?: string
  shortCode?: string
}
