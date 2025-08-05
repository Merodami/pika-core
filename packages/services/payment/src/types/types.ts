/**
 * Shared payment-related types
 */

/**
 * Credit balance summary
 */
export interface CreditBalance {
  demand: number
  subscription: number
  total: number
  lastUpdated: Date
}

/**
 * Payment method info
 */
export interface PaymentMethodInfo {
  id: string
  type: 'card' | 'bankAccount'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

/**
 * Subscription pricing info
 */
export interface SubscriptionPricing {
  planType: string
  interval: string
  amount: number
  currency: string
  credits: number
  features: string[]
}

/**
 * Transaction summary
 */
export interface TransactionSummary {
  totalTransactions: number
  totalAmount: number
  averageAmount: number
  byType: Record<
    string,
    {
      count: number
      amount: number
    }
  >
  dateRange: {
    from: Date
    to: Date
  }
}

/**
 * Promo code validation result
 */
export interface PromoCodeValidation {
  isValid: boolean
  discount?: number
  freeCredits?: number
  message?: string
  expiresAt?: Date
}
