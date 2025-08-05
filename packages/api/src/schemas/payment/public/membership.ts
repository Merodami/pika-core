import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  MembershipAction,
  MembershipStatus,
  PlanType,
} from '../common/enums.js'

/**
 * Membership schemas for public API
 */

// ============= Enums =============
// Enums are now imported from ../common/enums.js

// ============= Membership Schema =============

/**
 * User membership
 */
export const Membership = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    stripeCustomerId: z.string().optional().describe('Stripe customer ID'),
    stripeSubscriptionId: z
      .string()
      .optional()
      .describe('Stripe subscription ID'),
    active: z.boolean().default(false),
    subscriptionStatus: MembershipStatus,
    planType: PlanType,
    lastPaymentDate: DateTime.optional(),

    // Additional fields for better tracking
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean().default(false),
    cancelledAt: DateTime.optional(),
    trialStart: DateTime.optional(),
    trialEnd: DateTime.optional(),
  }),
  {
    description: 'User membership information',
  },
)

export type Membership = z.infer<typeof Membership>

// ============= Membership Details =============

/**
 * Membership with plan details
 */
export const MembershipWithPlan = Membership.extend({
  plan: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number().describe('Monthly price in cents'),
    currency: z.string().length(3).default('usd'),
    features: z.array(z.string()).default([]),
    creditsPerMonth: z.number().int().nonnegative().optional(),
    maxBookingsPerMonth: z.number().int().positive().optional(),
    priorityBooking: z.boolean().default(false),
  }),
  benefits: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    )
    .default([]),
})

export type MembershipWithPlan = z.infer<typeof MembershipWithPlan>

// ============= Create/Update Membership =============

/**
 * Create membership request (internal use)
 */
export const CreateMembershipRequest = openapi(
  z.object({
    userId: UserId,
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    active: z.boolean().optional().default(false),
    subscriptionStatus: MembershipStatus.optional().default('incomplete'),
    planType: PlanType.optional().default('basic'),
  }),
  {
    description: 'Create a new membership record',
  },
)

export type CreateMembershipRequest = z.infer<typeof CreateMembershipRequest>

/**
 * Update membership request
 */
export const UpdateMembershipRequest = openapi(
  z.object({
    stripeCustomerId: z.string().optional(),
    stripeSubscriptionId: z.string().optional(),
    active: z.boolean().optional(),
    subscriptionStatus: MembershipStatus.optional(),
    planType: PlanType.optional(),
    lastPaymentDate: DateTime.optional(),
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
  }),
  {
    description: 'Update membership details',
  },
)

export type UpdateMembershipRequest = z.infer<typeof UpdateMembershipRequest>

// ============= Subscription Management =============

/**
 * Subscribe to membership plan request
 */
export const SubscribeToPlanRequest = openapi(
  z.object({
    planType: PlanType,
    paymentMethodId: z.string().describe('Stripe payment method ID'),
    couponCode: z.string().optional(),
  }),
  {
    description: 'Subscribe to a membership plan',
  },
)

export type SubscribeToPlanRequest = z.infer<typeof SubscribeToPlanRequest>

/**
 * Subscribe to plan response
 */
export const SubscribeToPlanResponse = openapi(
  z.object({
    success: z.boolean(),
    membership: Membership,
    subscriptionId: z.string(),
    clientSecret: z
      .string()
      .optional()
      .describe('For 3D Secure authentication'),
    message: z.string(),
  }),
  {
    description: 'Subscription creation result',
  },
)

export type SubscribeToPlanResponse = z.infer<typeof SubscribeToPlanResponse>

/**
 * Cancel membership request
 */
export const CancelMembershipRequest = openapi(
  z.object({
    immediately: z
      .boolean()
      .default(false)
      .describe('Cancel immediately vs at period end'),
    reason: z.string().max(500).optional(),
    feedback: z
      .enum(['TOO_EXPENSIVE', 'NOT_USING', 'MISSING_FEATURES', 'OTHER'])
      .optional(),
  }),
  {
    description: 'Cancel membership subscription',
  },
)

export type CancelMembershipRequest = z.infer<typeof CancelMembershipRequest>

/**
 * Cancel membership response
 */
export const CancelMembershipResponse = openapi(
  z.object({
    success: z.boolean(),
    membership: Membership,
    cancelledAt: DateTime,
    effectiveDate: DateTime.describe('When the cancellation takes effect'),
    message: z.string(),
  }),
  {
    description: 'Membership cancellation result',
  },
)

export type CancelMembershipResponse = z.infer<typeof CancelMembershipResponse>

/**
 * Reactivate membership request
 */
export const ReactivateMembershipRequest = openapi(
  z.object({
    planType: PlanType.optional().describe('Change plan on reactivation'),
  }),
  {
    description: 'Reactivate a cancelled membership',
  },
)

export type ReactivateMembershipRequest = z.infer<
  typeof ReactivateMembershipRequest
>

// ============= Membership Benefits =============

/**
 * Get membership benefits response
 */
export const MembershipBenefitsResponse = openapi(
  z.object({
    membership: MembershipWithPlan.optional(),
    availablePlans: z.array(
      z.object({
        type: PlanType,
        name: z.string(),
        description: z.string(),
        price: z.number(),
        currency: z.string(),
        features: z.array(z.string()),
        highlighted: z.boolean().default(false),
      }),
    ),
    comparePlans: z.boolean().default(false),
  }),
  {
    description: 'Membership benefits and available plans',
  },
)

export type MembershipBenefitsResponse = z.infer<
  typeof MembershipBenefitsResponse
>

// ============= Membership History =============

/**
 * Membership history entry
 */
export const MembershipHistoryEntry = z.object({
  id: UUID,
  membershipId: UUID,
  action: MembershipAction,
  fromPlan: PlanType.optional(),
  toPlan: PlanType.optional(),
  reason: z.string().optional(),
  timestamp: DateTime,
  metadata: z.record(z.string(), z.any()).optional(),
})

export type MembershipHistoryEntry = z.infer<typeof MembershipHistoryEntry>

/**
 * Membership history response
 */
export const MembershipHistoryResponse = paginatedResponse(
  MembershipHistoryEntry,
)

export type MembershipHistoryResponse = z.infer<
  typeof MembershipHistoryResponse
>

// ============= Path Parameters =============

/**
 * Membership ID path parameter
 */
export const MembershipIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Membership ID path parameter',
  },
)

export type MembershipIdParam = z.infer<typeof MembershipIdParam>
