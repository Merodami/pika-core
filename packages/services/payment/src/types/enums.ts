/**
 * Payment-related enums for the Pika platform
 */

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'pastDue',
  UNPAID = 'unpaid',
}

export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  PROFESSIONAL = 'professional',
}

export enum BillingInterval {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum CreditsOperation {
  INCREASE = 'increase',
  DECREASE = 'decreased',
}

export enum CreditsType {
  DEMAND = 'demand',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PromoCodeType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixedAmount',
  FREE_CREDITS = 'freeCredits',
}

export enum TransactionType {
  CREDIT_PURCHASE = 'creditPurchase',
  SUBSCRIPTION_PAYMENT = 'subscriptionPayment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  PROMO_CODE = 'promoCode',
}
