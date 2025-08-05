import { PlanSortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { activeStatus, withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  BillingIntervalSchema,
  PlanSortBySchema,
  PlanTypeSchema,
} from '../common/enums.js'

/**
 * Subscription plan schemas for public API
 */

// ============= Subscription Plan =============

/**
 * Subscription plan
 */
export const SubscriptionPlan = openapi(
  withTimestamps({
    id: UUID,
    name: z.string().describe('Name of the subscription plan'),
    description: z
      .string()
      .optional()
      .describe('Description of the subscription plan'),
    price: z.number().nonnegative().describe('Price per billing period'),
    currency: z
      .string()
      .length(3)
      .default('usd')
      .describe('Currency code (e.g., usd, gbp)'),
    interval: BillingIntervalSchema,
    intervalCount: z
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Number of intervals between billings'),
    trialPeriodDays: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Number of trial days'),
    features: z.array(z.string()).describe('Array of feature descriptions'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Additional configuration'),
    stripeProductId: z.string().optional().describe('Stripe product ID'),
    stripePriceId: z.string().optional().describe('Stripe price ID'),
  }).merge(activeStatus),
  {
    description: 'Subscription plan details',
  },
)

export type SubscriptionPlan = z.infer<typeof SubscriptionPlan>

// ============= Create Plan =============

/**
 * Create subscription plan request
 */
export const CreateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number().nonnegative(),
    currency: z.string().length(3).default('usd'),
    interval: BillingIntervalSchema,
    intervalCount: z.number().int().positive().default(1),
    trialPeriodDays: z.number().int().nonnegative().optional(),
    features: z.array(z.string()),
    metadata: z.record(z.string(), z.any()).optional(),
    stripeProductId: z.string().optional(),
    stripePriceId: z.string().optional(),
  }),
  {
    description: 'Create a new subscription plan',
  },
)

export type CreateSubscriptionPlanRequest = z.infer<
  typeof CreateSubscriptionPlanRequest
>

// ============= Update Plan =============

/**
 * Update subscription plan request
 */
export const UpdateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    trialPeriodDays: z.number().int().nonnegative().optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    stripePriceId: z.string().optional(),
  }),
  {
    description: 'Update a subscription plan',
  },
)

export type UpdateSubscriptionPlanRequest = z.infer<
  typeof UpdateSubscriptionPlanRequest
>

/**
 * Plan sync success response
 */
export const PlanSyncResponse = openapi(
  z.object({
    message: z.string(),
  }),
  {
    description: 'Plan sync success response',
  },
)

export type PlanSyncResponse = z.infer<typeof PlanSyncResponse>

// ============= Search Plans =============

/**
 * Subscription plan query parameters
 */
export const SubscriptionPlanQueryParams = SearchParams.extend({
  isActive: z.coerce.boolean().optional(),
  interval: BillingIntervalSchema.optional(),
  planType: PlanTypeSchema.optional(),
  sortBy: PlanSortBySchema.default(PlanSortBy.NAME),
})

export type SubscriptionPlanQueryParams = z.infer<
  typeof SubscriptionPlanQueryParams
>

/**
 * Subscription plan list response
 */
export const SubscriptionPlanListResponse = paginatedResponse(SubscriptionPlan)

export type SubscriptionPlanListResponse = z.infer<
  typeof SubscriptionPlanListResponse
>

/**
 * Single subscription plan response
 */
export const SubscriptionPlanDetailResponse = openapi(SubscriptionPlan, {
  description: 'Single subscription plan details',
})

export type SubscriptionPlanDetailResponse = z.infer<
  typeof SubscriptionPlanDetailResponse
>
