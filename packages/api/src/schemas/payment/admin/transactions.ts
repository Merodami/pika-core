import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Money, UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateRangeParams, SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  AdjustmentReason,
  AdjustmentType,
  AdminRefundReason,
  Currency,
  DisputeAction,
  DisputeStatus,
  PaymentMethod,
  PayoutAction,
  PayoutStatus,
  PriceInterval,
  PromoCodeStatus,
  PromoCodeType,
  ReportFormat,
  ReportGroupBy,
  ReportPeriod,
  ReportType,
  TransactionStatus,
  TransactionType,
} from '../common/enums.js'

/**
 * Admin payment and transaction schemas
 */

// ============= Transaction Details =============

/**
 * Detailed transaction for admin
 */
export const AdminTransactionDetailResponse = openapi(
  withTimestamps({
    id: UUID,
    type: TransactionType,
    status: TransactionStatus,

    // Amount details
    amount: Money,
    currency: z.string().length(3),
    fee: Money.optional(),
    tax: Money.optional(),
    netAmount: Money,

    // Parties
    userId: UserId.optional(),
    userName: z.string().optional(),
    businessId: UUID.optional(),
    businessName: z.string().optional(),

    // Payment details
    paymentMethod: PaymentMethod,
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),
    stripeRefundId: z.string().optional(),

    // Reference
    referenceType: z.string().optional().describe('Type of related entity'),
    referenceId: z.string().optional().describe('ID of related entity'),
    description: z.string().optional(),

    // Processing
    processedAt: DateTime.optional(),
    failureReason: z.string().optional(),
    failureCode: z.string().optional(),

    // Dispute/Refund
    disputeStatus: DisputeStatus.optional(),
    disputeReason: z.string().optional(),
    refundReason: z.string().optional(),
    refundedAmount: Money.optional(),

    // Metadata
    metadata: z.record(z.string(), z.any()).optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }),
  {
    description: 'Detailed transaction information for admin',
  },
)

export type AdminTransactionDetailResponse = z.infer<
  typeof AdminTransactionDetailResponse
>

// ============= Transaction Search =============

/**
 * Admin transaction search parameters
 */
export const AdminTransactionQueryParams = SearchParams.merge(
  DateRangeParams,
).extend({
  type: TransactionType.optional(),
  status: TransactionStatus.optional(),
  paymentMethod: PaymentMethod.optional(),
  userId: UserId.optional(),
  businessId: UUID.optional(),
  stripePaymentIntentId: z.string().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  hasDispute: z.boolean().optional(),
})

export type AdminTransactionQueryParams = z.infer<
  typeof AdminTransactionQueryParams
>

/**
 * Admin transaction list response
 */
export const AdminTransactionListResponse = paginatedResponse(
  AdminTransactionDetailResponse,
)

export type AdminTransactionListResponse = z.infer<
  typeof AdminTransactionListResponse
>

// ============= Financial Summary =============

/**
 * Financial summary
 */
export const FinancialSummary = openapi(
  z.object({
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),

    // Totals
    totalRevenue: Money,
    totalRefunds: Money,
    totalFees: Money,
    netRevenue: Money,

    // By type - using programmatic z.object to avoid z.partialRecord RecordTransformer bug
    revenueByType: z
      .object(
        Object.fromEntries(
          TransactionType.options.map((key) => [key, Money.optional()]),
        ),
      )
      .openapi({
        description: 'Revenue by transaction type (all keys optional)',
      }),

    // By payment method - using programmatic z.object to avoid z.partialRecord RecordTransformer bug
    revenueByPaymentMethod: z
      .object(
        Object.fromEntries(
          PaymentMethod.options.map((key) => [key, Money.optional()]),
        ),
      )
      .openapi({
        description: 'Revenue by payment method (all keys optional)',
      }),

    // Counts
    transactionCount: z.number().int().nonnegative(),
    successfulCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    disputeCount: z.number().int().nonnegative(),

    // Averages
    averageTransactionAmount: Money,

    // Top performers
    topBusinesses: z
      .array(
        z.object({
          businessId: UUID,
          businessName: z.string(),
          revenue: Money,
          transactionCount: z.number().int().nonnegative(),
        }),
      )
      .optional(),

    topUsers: z
      .array(
        z.object({
          userId: UserId,
          userName: z.string(),
          spent: Money,
          transactionCount: z.number().int().nonnegative(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Financial summary for a period',
  },
)

export type FinancialSummary = z.infer<typeof FinancialSummary>

// ============= Transaction Actions =============

/**
 * Refund transaction request
 */
export const RefundTransactionRequest = openapi(
  z.object({
    amount: Money.optional().describe('Partial refund amount'),
    reason: AdminRefundReason,
    description: z.string().max(500),
    notifyUser: z.boolean().default(true),
  }),
  {
    description: 'Refund a transaction',
  },
)

export type RefundTransactionRequest = z.infer<typeof RefundTransactionRequest>

/**
 * Manual adjustment request
 */
export const ManualAdjustmentRequest = openapi(
  z.object({
    userId: UserId,
    amount: Money,
    type: AdjustmentType,
    reason: AdjustmentReason,
    description: z.string().max(500),
    notifyUser: z.boolean().default(true),
  }),
  {
    description: 'Create manual adjustment',
  },
)

export type ManualAdjustmentRequest = z.infer<typeof ManualAdjustmentRequest>

// ============= Payout Management =============

/**
 * Payout details
 */
export const PayoutDetail = z.object({
  id: UUID,
  businessId: UUID,
  amount: Money,
  currency: z.string().length(3),
  status: PayoutStatus,
  scheduledFor: DateTime,
  processedAt: DateTime.optional(),
  bankAccountId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  failureReason: z.string().optional(),
})

export type PayoutDetail = z.infer<typeof PayoutDetail>

/**
 * Payout list response
 */
export const PayoutListResponse = paginatedResponse(PayoutDetail)

export type PayoutListResponse = z.infer<typeof PayoutListResponse>

/**
 * Process payout request
 */
export const ProcessPayoutRequest = openapi(
  z.object({
    payoutIds: z.array(UUID).min(1).max(100),
    action: PayoutAction,
    reason: z.string().max(500).optional(),
    delayUntil: DateTime.optional(),
  }),
  {
    description: 'Process pending payouts',
  },
)

export type ProcessPayoutRequest = z.infer<typeof ProcessPayoutRequest>

// ============= Dispute Management =============

/**
 * Update dispute request
 */
export const UpdateDisputeRequest = openapi(
  z.object({
    status: DisputeAction,
    evidence: z
      .array(
        z.object({
          type: z.string(),
          description: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .optional(),
    notes: z.string().max(2000).optional(),
  }),
  {
    description: 'Update dispute status',
  },
)

export type UpdateDisputeRequest = z.infer<typeof UpdateDisputeRequest>

// ============= Promo Code Management =============

/**
 * Admin promo code details
 */
export const AdminPromoCodeDetail = openapi(
  withTimestamps({
    id: UUID,
    code: z.string().toUpperCase(),
    type: PromoCodeType,
    value: z.number().positive(),
    description: z.string().optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    usedCount: z.number().int().nonnegative().default(0),
    maxUsesPerUser: z.number().int().positive().optional(),

    // Date restrictions
    validFrom: DateTime,
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToBusinesses: z.array(UUID).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().default(false),

    // Status
    isActive: z.boolean().default(true),

    // Stats
    totalDiscountGiven: Money.optional(),

    // Admin
    createdBy: UserId,
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Detailed promo code information for admin',
  },
)

export type AdminPromoCodeDetail = z.infer<typeof AdminPromoCodeDetail>

/**
 * Create promo code request
 */
export const CreatePromoCodeRequest = openapi(
  z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    type: PromoCodeType,
    value: z.number().positive(),
    description: z.string().max(500).optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().default(1),

    // Date restrictions
    validFrom: DateTime,
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToBusinesses: z.array(UUID).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().default(false),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Create a new promo code',
  },
)

export type CreatePromoCodeRequest = z.infer<typeof CreatePromoCodeRequest>

/**
 * Update promo code request
 */
export const UpdatePromoCodeRequest = openapi(
  z.object({
    description: z.string().max(500).optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().optional(),

    // Date restrictions
    validFrom: DateTime.optional(),
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToBusinesses: z.array(UUID).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().optional(),

    // Status
    isActive: z.boolean().optional(),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Update promo code',
  },
)

export type UpdatePromoCodeRequest = z.infer<typeof UpdatePromoCodeRequest>

/**
 * Promo code search parameters
 */
export const PromoCodeSearchParams = SearchParams.extend({
  type: PromoCodeType.optional(),
  isActive: z.boolean().optional(),
  status: PromoCodeStatus.optional(),
  createdBy: UserId.optional(),
  createdFrom: DateTime.optional(),
  createdTo: DateTime.optional(),
})

export type PromoCodeSearchParams = z.infer<typeof PromoCodeSearchParams>

/**
 * Promo code list response
 */
export const PromoCodeListResponse = paginatedResponse(AdminPromoCodeDetail)

export type PromoCodeListResponse = z.infer<typeof PromoCodeListResponse>

// ============= Subscription Plan Management =============

/**
 * Admin subscription plan details
 */
export const AdminSubscriptionPlanDetail = openapi(
  withTimestamps({
    id: UUID,
    name: z.string(),
    description: z.string(),

    // Pricing
    price: Money,
    currency: Currency.default('usd'),
    billingInterval: PriceInterval,
    trialPeriodDays: z.number().int().nonnegative().default(0),

    // Limits
    maxUsagePerMonth: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),

    // Stripe
    stripePriceId: z.string().optional(),
    stripeProductId: z.string().optional(),

    // Stats
    activeSubscriptions: z.number().int().nonnegative().default(0),
    totalSubscriptions: z.number().int().nonnegative().default(0),
    monthlyRevenue: Money.optional(),

    // Admin
    createdBy: UserId,
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Detailed subscription plan for admin',
  },
)

export type AdminSubscriptionPlanDetail = z.infer<
  typeof AdminSubscriptionPlanDetail
>

/**
 * Create subscription plan request
 */
export const CreateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000),

    // Pricing
    price: Money,
    currency: Currency.default('usd'),
    billingInterval: PriceInterval,
    trialPeriodDays: z.number().int().nonnegative().default(0),

    // Limits
    maxUsagePerMonth: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Create a new subscription plan',
  },
)

export type CreateSubscriptionPlanRequest = z.infer<
  typeof CreateSubscriptionPlanRequest
>

/**
 * Update subscription plan request
 */
export const UpdateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),

    // Limits
    maxUsagePerMonth: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Update subscription plan',
  },
)

export type UpdateSubscriptionPlanRequest = z.infer<
  typeof UpdateSubscriptionPlanRequest
>

/**
 * Subscription plan search parameters
 */
export const SubscriptionPlanSearchParams = SearchParams.extend({
  billingInterval: PriceInterval.optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  createdBy: UserId.optional(),
})

export type SubscriptionPlanSearchParams = z.infer<
  typeof SubscriptionPlanSearchParams
>

/**
 * Subscription plan list response
 */
export const SubscriptionPlanListResponse = paginatedResponse(
  AdminSubscriptionPlanDetail,
)

export type SubscriptionPlanListResponse = z.infer<
  typeof SubscriptionPlanListResponse
>

// ============= Financial Reports =============

/**
 * Financial report request
 */
export const FinancialReportRequest = z.object({
  reportType: ReportType,
  period: ReportPeriod,
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: ReportGroupBy.optional(),
  includeDetails: z.boolean().default(false),
  format: ReportFormat.default('json'),
})

export type FinancialReportRequest = z.infer<typeof FinancialReportRequest>

/**
 * Financial report response
 */
export const FinancialReportResponse = openapi(
  z.object({
    reportType: ReportType,
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    generatedAt: DateTime,

    // Summary data
    summary: FinancialSummary,

    // Time series data
    timeSeries: z
      .array(
        z.object({
          date: z.string(),
          revenue: Money,
          transactions: z.number().int().nonnegative(),
          refunds: Money,
          disputes: z.number().int().nonnegative(),
        }),
      )
      .optional(),

    // Download URL for CSV/PDF
    downloadUrl: z.string().url().optional(),
  }),
  {
    description: 'Financial report data',
  },
)

export type FinancialReportResponse = z.infer<typeof FinancialReportResponse>

// PaymentStatsResponse
export const PaymentStatsResponse = FinancialSummary
export type PaymentStatsResponse = z.infer<typeof PaymentStatsResponse>

// CreatePayoutRequest
export const CreatePayoutRequest = ProcessPayoutRequest
export type CreatePayoutRequest = z.infer<typeof CreatePayoutRequest>

// PayoutIdParam
export const PayoutIdParam = z.object({ id: UUID })
export type PayoutIdParam = z.infer<typeof PayoutIdParam>
