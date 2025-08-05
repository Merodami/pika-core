import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Money, UserId } from '../../shared/branded.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import {
  EntityType,
  InternalTransactionType,
  PaymentMethodType,
  PayoutStatus,
  RefundInitiator,
  RefundReason,
  TransactionStatus,
} from '../common/enums.js'

/**
 * Internal payment service schemas for service-to-service communication
 */

// ============= Internal Payment Processing =============

/**
 * Process internal payment request
 */
export const ProcessInternalPaymentRequest = openapi(
  z.object({
    fromUserId: UserId,
    toUserId: UserId.optional(),
    amount: Money,
    currency: z.string().length(3).default('usd'),
    type: InternalTransactionType,
    referenceId: z.string(),
    referenceType: z.string(),
    description: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),

    // Payment method
    paymentMethodId: z.string().optional(),
  }),
  {
    description: 'Process internal payment between services',
  },
)

export type ProcessInternalPaymentRequest = z.infer<
  typeof ProcessInternalPaymentRequest
>

/**
 * Process internal payment response
 */
export const ProcessInternalPaymentResponse = openapi(
  z.object({
    transactionId: UUID,
    status: TransactionStatus,
    amount: Money,
    currency: z.string().length(3),

    // Stripe details
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),

    // Error details
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),

    timestamp: DateTime,
  }),
  {
    description: 'Internal payment result',
  },
)

export type ProcessInternalPaymentResponse = z.infer<
  typeof ProcessInternalPaymentResponse
>

// ============= Internal Refund =============

/**
 * Process internal refund request
 */
export const ProcessInternalRefundRequest = openapi(
  z.object({
    originalTransactionId: UUID,
    amount: Money.optional().describe('Partial refund amount'),
    reason: RefundReason,
    description: z.string(),
    initiatedBy: RefundInitiator,
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Process internal refund',
  },
)

export type ProcessInternalRefundRequest = z.infer<
  typeof ProcessInternalRefundRequest
>

/**
 * Process internal refund response
 */
export const ProcessInternalRefundResponse = openapi(
  z.object({
    refundId: UUID,
    originalTransactionId: UUID,
    status: TransactionStatus,
    amount: Money,
    currency: z.string().length(3),

    // Refund details
    stripeRefundId: z.string().optional(),

    timestamp: DateTime,
  }),
  {
    description: 'Internal refund result',
  },
)

export type ProcessInternalRefundResponse = z.infer<
  typeof ProcessInternalRefundResponse
>

// ============= Payment Validation =============

/**
 * Validate payment method request
 */
export const ValidatePaymentMethodRequest = openapi(
  z.object({
    userId: UserId,
    paymentMethodId: z.string(),
    amount: Money.optional(),
  }),
  {
    description: 'Validate payment method',
  },
)

export type ValidatePaymentMethodRequest = z.infer<
  typeof ValidatePaymentMethodRequest
>

/**
 * Validate payment method response
 */
export const ValidatePaymentMethodResponse = openapi(
  z.object({
    valid: z.boolean(),
    type: PaymentMethodType.optional(),
    last4: z.string().optional(),
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().optional(),
    canProcessAmount: z.boolean().optional(),
    failureReason: z.string().optional(),
  }),
  {
    description: 'Payment method validation result',
  },
)

export type ValidatePaymentMethodResponse = z.infer<
  typeof ValidatePaymentMethodResponse
>

// ============= Payout Processing =============

/**
 * Process payout request
 */
export const ProcessPayoutRequest = openapi(
  z.object({
    businessId: UUID,
    amount: Money,
    currency: z.string().length(3).default('usd'),
    description: z.string(),
    bankAccountId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Process payout to business',
  },
)

export type ProcessPayoutRequest = z.infer<typeof ProcessPayoutRequest>

/**
 * Process payout response
 */
export const ProcessPayoutResponse = openapi(
  z.object({
    payoutId: UUID,
    status: PayoutStatus,
    amount: Money,
    currency: z.string().length(3),
    scheduledDate: DateTime,
    stripeTransferId: z.string().optional(),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'Payout processing result',
  },
)

export type ProcessPayoutResponse = z.infer<typeof ProcessPayoutResponse>

// ============= Transaction Queries =============

/**
 * Get transaction details request
 */
export const GetTransactionDetailsRequest = openapi(
  z.object({
    transactionId: UUID,
  }),
  {
    description: 'Get transaction details',
  },
)

export type GetTransactionDetailsRequest = z.infer<
  typeof GetTransactionDetailsRequest
>

/**
 * Transaction details response
 */
export const TransactionDetailsResponse = openapi(
  z.object({
    id: UUID,
    type: z.string(),
    status: z.string(),
    amount: Money,
    currency: z.string().length(3),
    userId: UserId.optional(),
    businessId: UUID.optional(),
    createdAt: DateTime,
    completedAt: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Transaction details',
  },
)

export type TransactionDetailsResponse = z.infer<
  typeof TransactionDetailsResponse
>

// ============= Balance Operations =============

/**
 * Get balance request
 */
export const GetBalanceRequest = openapi(
  z.object({
    entityType: EntityType,
    entityId: z.string(),
  }),
  {
    description: 'Get entity balance',
  },
)

export type GetBalanceRequest = z.infer<typeof GetBalanceRequest>

/**
 * Balance response
 */
export const BalanceResponse = openapi(
  z.object({
    entityType: z.string(),
    entityId: z.string(),

    // Balances
    availableBalance: Money,
    pendingBalance: Money,
    currency: z.string().length(3),

    // Last updated
    lastUpdated: DateTime,
  }),
  {
    description: 'Entity balance information',
  },
)

export type BalanceResponse = z.infer<typeof BalanceResponse>
