/**
 * Voucher service relation definitions
 * Following industry standard include patterns
 */

/**
 * Allowed relations for voucher entities
 * These define what can be included via ?include= parameter
 */
export const VOUCHER_ALLOWED_RELATIONS = [
  'business', // Complete business object
  'category', // Complete category object
  'codes', // Voucher codes (QR, SHORT, STATIC)
  'redemptions', // Redemption history
  'scans', // Scan analytics
  'customerVouchers', // Customer wallet entries
] as const

export type VoucherAllowedRelation = (typeof VOUCHER_ALLOWED_RELATIONS)[number]

/**
 * Admin-specific relations (may include additional admin-only data)
 */
export const ADMIN_VOUCHER_ALLOWED_RELATIONS = [
  ...VOUCHER_ALLOWED_RELATIONS,
  'analytics', // Admin-only analytics data
  'fraudCases', // Admin-only fraud detection data
] as const

export type AdminVoucherAllowedRelation =
  (typeof ADMIN_VOUCHER_ALLOWED_RELATIONS)[number]

/**
 * Internal service relations (for service-to-service communication)
 */
export const INTERNAL_VOUCHER_ALLOWED_RELATIONS = [
  ...ADMIN_VOUCHER_ALLOWED_RELATIONS,
  'internalMetadata', // Internal service metadata
] as const

export type InternalVoucherAllowedRelation =
  (typeof INTERNAL_VOUCHER_ALLOWED_RELATIONS)[number]
