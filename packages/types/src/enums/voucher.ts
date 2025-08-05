/**
 * Voucher-related enums
 */

/**
 * Voucher states in the system
 * Must match Prisma schema definitions
 */
export enum VoucherState {
  draft = 'draft',
  published = 'published',
  claimed = 'claimed',
  redeemed = 'redeemed',
  expired = 'expired',
  suspended = 'suspended',
}

/**
 * Type definition for voucher state - use this for type annotations
 */
export type VoucherStateType = `${VoucherState}`

/**
 * Voucher types in the system
 * Must match Prisma schema definitions
 */
export enum VoucherType {
  discount = 'discount',
  fixedValue = 'fixedValue',
  freeItem = 'freeItem',
  bogo = 'bogo',
  experience = 'experience',
}

/**
 * Type definition for voucher type - use this for type annotations
 */
export type VoucherTypeType = `${VoucherType}`

/**
 * Voucher scan source types
 * Used to track how users discovered and scanned vouchers
 */
export enum VoucherScanSource {
  camera = 'camera',
  gallery = 'gallery',
  link = 'link',
  share = 'share',
}

/**
 * Type definition for voucher scan source - use this for type annotations
 */
export type VoucherScanSourceType = `${VoucherScanSource}`

/**
 * Voucher scan types
 * Used to distinguish between customer and business scans
 */
export enum VoucherScanType {
  customer = 'customer',
  business = 'business',
}

/**
 * Type definition for voucher scan type - use this for type annotations
 */
export type VoucherScanTypeType = `${VoucherScanType}`

/**
 * Voucher code types
 * Used for different voucher code generation methods
 */
export enum VoucherCodeType {
  qr = 'qr',
  short = 'short',
  static = 'static',
}

/**
 * Type definition for voucher code type - use this for type annotations
 */
export type VoucherCodeTypeType = `${VoucherCodeType}`

/**
 * Voucher discount types
 * Used to determine how discounts are calculated
 */
export enum VoucherDiscountType {
  percentage = 'percentage',
  fixed = 'fixed',
}

/**
 * Type definition for voucher discount type - use this for type annotations
 */
export type VoucherDiscountTypeType = `${VoucherDiscountType}`

/**
 * Customer voucher status
 * Used to track voucher status in customer's wallet
 */
export enum CustomerVoucherStatus {
  claimed = 'claimed',
  redeemed = 'redeemed',
  expired = 'expired',
}

/**
 * Type definition for customer voucher status - use this for type annotations
 */
export type CustomerVoucherStatusType = `${CustomerVoucherStatus}`

/**
 * Voucher book status - matches database VoucherBookStatus enum exactly
 */
export enum VoucherBookStatus {
  DRAFT = 'draft',
  READY_FOR_PRINT = 'ready_for_print',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Type definition for voucher book status - use this for type annotations
 */
export type VoucherBookStatusType = `${VoucherBookStatus}`

/**
 * Voucher book type - matches database VoucherBookType enum exactly
 */
export enum VoucherBookType {
  MONTHLY = 'monthly',
  SPECIAL_EDITION = 'special_edition',
  REGIONAL = 'regional',
  SEASONAL = 'seasonal',
  PROMOTIONAL = 'promotional',
}

/**
 * Type definition for voucher book type - use this for type annotations
 */
export type VoucherBookTypeType = `${VoucherBookType}`

/**
 * Voucher sorting fields for public API
 */
export enum VoucherSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  EXPIRES_AT = 'expiresAt',
  DISCOUNT_VALUE = 'discountValue',
  TITLE = 'title',
}

/**
 * Type definition for voucher sort by - use this for type annotations
 */
export type VoucherSortByType = `${VoucherSortBy}`

/**
 * Admin voucher sorting fields (additional admin-only fields)
 */
export enum AdminVoucherSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATE = 'state',
  DISCOUNT_VALUE = 'discountValue',
  CURRENT_REDEMPTIONS = 'currentRedemptions',
  EXPIRES_AT = 'expiresAt',
  BUSINESS_ID = 'businessId',
}

/**
 * Type definition for admin voucher sort by - use this for type annotations
 */
export type AdminVoucherSortByType = `${AdminVoucherSortBy}`

/**
 * User voucher sorting fields (for user voucher queries)
 */
export enum UserVoucherSortBy {
  CLAIMED_AT = 'claimedAt',
  REDEEMED_AT = 'redeemedAt',
  EXPIRES_AT = 'expiresAt',
  CREATED_AT = 'createdAt',
}

/**
 * Type definition for user voucher sort by - use this for type annotations
 */
export type UserVoucherSortByType = `${UserVoucherSortBy}`
