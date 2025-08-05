import { z } from 'zod'

/**
 * Payment-specific enums
 */

// ============= Membership Enums =============

export const MembershipStatus = z.enum([
  'active',
  'pastDue',
  'canceled',
  'incomplete',
  'incompleteExpired',
  'trialing',
  'unpaid',
])

export type MembershipStatus = z.infer<typeof MembershipStatus>

export const PlanType = z.enum(['basic', 'premium', 'elite', 'custom'])

export type PlanType = z.infer<typeof PlanType>

export const MembershipAction = z.enum([
  'created',
  'upgraded',
  'downgraded',
  'cancelled',
  'reactivated',
  'expired',
  'paymentFailed',
  'renewed',
])

export type MembershipAction = z.infer<typeof MembershipAction>

// ============= Product Enums =============

export const ProductType = z.enum([
  'membership',
  'merchandise',
  'service',
  'other',
])

export type ProductType = z.infer<typeof ProductType>

export const PriceInterval = z.enum(['day', 'week', 'month', 'year'])

export type PriceInterval = z.infer<typeof PriceInterval>

export const Currency = z.enum(['usd', 'eur', 'gbp'])

export type Currency = z.infer<typeof Currency>

// ============= Transaction Enums =============

export const TransactionType = z.enum([
  'payment',
  'refund',
  'transfer',
  'payout',
  'adjustment',
])

export type TransactionType = z.infer<typeof TransactionType>

export const TransactionStatus = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
])

export type TransactionStatus = z.infer<typeof TransactionStatus>

export const PaymentMethod = z.enum(['card', 'bankTransfer', 'wallet', 'cash'])

export type PaymentMethod = z.infer<typeof PaymentMethod>

export const TransactionSortBy = z.enum(['createdAt', 'amount', 'processedAt'])

export type TransactionSortBy = z.infer<typeof TransactionSortBy>

// ============= Internal Service Enums =============

export const InternalTransactionType = z.enum([
  'subscription',
  'refund',
  'transfer',
])

export type InternalTransactionType = z.infer<typeof InternalTransactionType>

export const RefundReason = z.enum([
  'cancellation',
  'serviceIssue',
  'duplicate',
  'other',
])

export type RefundReason = z.infer<typeof RefundReason>

export const RefundInitiator = z.enum(['user', 'system', 'admin'])

export type RefundInitiator = z.infer<typeof RefundInitiator>

export const PaymentMethodType = z.enum(['card', 'bank', 'wallet'])

export type PaymentMethodType = z.infer<typeof PaymentMethodType>

export const PayoutStatus = z.enum([
  'scheduled',
  'processing',
  'completed',
  'failed',
])

export type PayoutStatus = z.infer<typeof PayoutStatus>

export const EntityType = z.enum(['user', 'business'])

export type EntityType = z.infer<typeof EntityType>

// ============= Admin Enums =============

export const AdminRefundReason = z.enum([
  'duplicate',
  'fraudulent',
  'customerRequest',
  'other',
])

export type AdminRefundReason = z.infer<typeof AdminRefundReason>

export const AdjustmentType = z.enum(['credit', 'debit'])

export type AdjustmentType = z.infer<typeof AdjustmentType>

export const AdjustmentReason = z.enum([
  'compensation',
  'correction',
  'promotional',
  'other',
])

export type AdjustmentReason = z.infer<typeof AdjustmentReason>

export const PayoutAction = z.enum(['approve', 'reject', 'delay'])

export type PayoutAction = z.infer<typeof PayoutAction>

// ============= Promo Code Enums =============

export const PromoCodeType = z.enum(['percentage', 'fixedAmount'])

export type PromoCodeType = z.infer<typeof PromoCodeType>

export const PromoCodeStatus = z.enum([
  'active',
  'expired',
  'depleted',
  'disabled',
])

export type PromoCodeStatus = z.infer<typeof PromoCodeStatus>

// ============= Report Enums =============

export const ReportType = z.enum([
  'revenue',
  'transactions',
  'payouts',
  'disputes',
  'summary',
])

export type ReportType = z.infer<typeof ReportType>

export const ReportPeriod = z.enum(['7d', '30d', '90d', '1y', 'custom'])

export type ReportPeriod = z.infer<typeof ReportPeriod>

export const ReportGroupBy = z.enum(['day', 'week', 'month'])

export type ReportGroupBy = z.infer<typeof ReportGroupBy>

export const ReportFormat = z.enum(['json', 'csv', 'pdf'])

export type ReportFormat = z.infer<typeof ReportFormat>

// ============= Dispute Enums =============

export const DisputeStatus = z.enum([
  'warning',
  'needsResponse',
  'underReview',
  'won',
  'lost',
])

export type DisputeStatus = z.infer<typeof DisputeStatus>

export const DisputeAction = z.enum(['accept', 'challenge'])

export type DisputeAction = z.infer<typeof DisputeAction>

// ============= Sort Enums =============

export const PromoCodeSortBy = z.enum([
  'code',
  'createdAt',
  'usedCount',
  'validUntil',
])

export type PromoCodeSortBy = z.infer<typeof PromoCodeSortBy>

export const SubscriptionPlanSortBy = z.enum([
  'name',
  'price',
  'createdAt',
  'activeSubscriptions',
])

export type SubscriptionPlanSortBy = z.infer<typeof SubscriptionPlanSortBy>
