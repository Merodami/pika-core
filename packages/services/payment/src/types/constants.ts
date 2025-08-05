/**
 * Payment-related constants and business rules
 */

// Credit limits
export const MEMBER_MAX_TRANSFER_CREDITS = 50
export const PROFESSIONAL_PURCHASE_WARNING_THRESHOLD = 100

// Credit amounts by plan
export const PLAN_CREDITS = {
  BASIC: 10,
  PREMIUM: 25,
  PROFESSIONAL: 50,
} as const

// Promo code constraints
export const PROMO_CODE_MIN_DISCOUNT = 0
export const PROMO_CODE_MAX_DISCOUNT = 100
export const PROMO_CODE_DESCRIPTION_MAX_LENGTH = 255

// Cache TTLs
export const CREDITS_CACHE_TTL = 300 // 5 minutes

// Stripe configuration
export const STRIPE_API_VERSION = '2024-06-20'
export const DEFAULT_CURRENCY = 'gbp'
export const CURRENCY_MULTIPLIER = 100 // Convert to cents/pence

// Subscription defaults
export const DEFAULT_TRIAL_DAYS = 7
export const GRACE_PERIOD_DAYS = 3

// Payment retry configuration
export const MAX_PAYMENT_RETRIES = 3
export const PAYMENT_RETRY_DELAY_MS = 1000

// Transaction limits
export const MIN_TRANSACTION_AMOUNT = 1
export const MAX_TRANSACTION_AMOUNT = 10000
