import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, UserId } from '../../shared/branded.js'

/**
 * Customer and membership creation schemas
 */

// ============= Create Customer and Membership =============

/**
 * Create Stripe customer and membership request
 */
export const CreateCustomerAndMembershipRequest = openapi(
  z.object({
    userId: UserId,
    email: Email,
    name: z.string().min(1).max(200).describe('Full name of the user'),
  }),
  {
    description: 'Create a Stripe customer and associated membership',
  },
)

export type CreateCustomerAndMembershipRequest = z.infer<
  typeof CreateCustomerAndMembershipRequest
>

// ============= Create Membership Subscription =============

/**
 * Create subscription for membership request
 */
export const CreateMembershipSubscriptionRequest = openapi(
  z.object({
    priceId: z.string().min(1).describe('Stripe price ID'),
    paymentMethodId: z.string().min(1).describe('Stripe payment method ID'),
    couponCode: z.string().optional().describe('Promotional coupon code'),
    trialDays: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Trial period in days'),
    metadata: z.record(z.string(), z.string()).optional(),
  }),
  {
    description: 'Create a subscription for an existing membership',
  },
)

export type CreateMembershipSubscriptionRequest = z.infer<
  typeof CreateMembershipSubscriptionRequest
>
