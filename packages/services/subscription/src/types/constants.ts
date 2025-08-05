import { MembershipPackage, MembershipType } from '@subscription/types/enums.js'

// Stripe Price IDs from previous architecture (to be migrated to database)
export const LEGACY_STRIPE_PRICE_IDS = {
  [MembershipType.OFF_PEAK]: {
    [MembershipPackage.LIMITED]: 'price_1RNayg2c3Yc0do0QSdvLcQ9a',
    [MembershipPackage.STANDARD]: 'price_1RNaz42c3Yc0do0QobAhHxSz',
    [MembershipPackage.UNLIMITED]: 'price_1RNb032c3Yc0do0Q48LytFF0',
  },
  [MembershipType.FULL_ACCESS]: {
    [MembershipPackage.LIMITED]: 'price_1RNb0J2c3Yc0do0QVbjVxVHr',
    [MembershipPackage.STANDARD]: 'price_1RNb0U2c3Yc0do0QmnWsgFwU',
    [MembershipPackage.UNLIMITED]: 'price_1RNb0s2c3Yc0do0QtlgeUSqu',
  },
} as const

// Default credit amounts (to be moved to SubscriptionPlan records)
export const DEFAULT_PLAN_CREDITS = {
  [MembershipPackage.LIMITED]: 10,
  [MembershipPackage.STANDARD]: 25,
  [MembershipPackage.UNLIMITED]: 50,
} as const

// Off-peak access times (example configuration)
export const OFF_PEAK_ACCESS_TIMES = {
  weekdays: {
    start: '09:00',
    end: '16:00',
  },
  weekends: {
    start: '08:00',
    end: '20:00',
  },
} as const

// Subscription configuration
export const SUBSCRIPTION_CONFIG = {
  DEFAULT_TRIAL_DAYS: 7,
  GRACE_PERIOD_DAYS: 3,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  WEBHOOK_TOLERANCE_SECONDS: 300, // 5 minutes
} as const

// Cache TTL settings (service-specific multipliers of REDIS_DEFAULT_TTL)
export const CACHE_TTL_MULTIPLIERS = {
  SUBSCRIPTION: 1, // 1x default TTL (3600s = 1 hour)
  USER_SUBSCRIPTION: 0.083, // 0.083x default TTL (300s = 5 minutes)
  SUBSCRIPTIONS_LIST: 0.083, // 0.083x default TTL (300s = 5 minutes)
  PLANS: 2, // 2x default TTL (7200s = 2 hours)
} as const

// Stripe configuration (service-specific)
export const STRIPE_CONFIG = {
  API_VERSION: '2024-12-18.acacia' as const,
  WEBHOOK_ENDPOINTS: {
    SUBSCRIPTION: '/webhooks/stripe',
  },
} as const

// Note: Use PAGINATION_DEFAULT_LIMIT and PAGINATION_MAX_LIMIT from @pika/environment

// Credit processing configuration
export const CREDIT_PROCESSING = {
  BATCH_SIZE: 50,
  PROCESSING_DELAY_MS: 1000,
  MAX_CONCURRENT_JOBS: 5,
} as const

// Template keys used by subscription service
export const TEMPLATE_KEYS = {
  SUBSCRIPTION_ACTIVATED: 'subscriptionActivated',
  SUBSCRIPTION_CANCELLED: 'subscriptionCancelled',
  PAYMENT_FAILED: 'paymentFailed',
  // Fallback template keys for notifications that don't have specific templates yet
  CREDITS_ALLOCATED: 'subscriptionActivated', // Using closest available template
  RENEWAL_REMINDER: 'subscriptionActivated', // Using closest available template
  TRIAL_ENDING: 'subscriptionActivated', // Using closest available template
} as const

export type TemplateKeysType =
  (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS]
