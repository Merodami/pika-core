import { SubscriptionSortBy } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import {
  BillingIntervalSchema,
  SubscriptionSortBySchema,
  SubscriptionStatusSchema,
} from '../common/enums.js'

/**
 * Admin subscription management schemas
 */

// ============= Query Parameters =============

/**
 * Admin get subscriptions query parameters
 */
export const AdminGetSubscriptionsQuery = openapi(
  SearchParams.extend({
    userId: UserId.optional(),
    status: SubscriptionStatusSchema.optional(),
    interval: BillingIntervalSchema.optional(),
    planId: UUID.optional(),
    cancelAtPeriodEnd: z.coerce.boolean().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    sortBy: SubscriptionSortBySchema.default(SubscriptionSortBy.CREATED_AT),
  }),
  {
    description: 'Query parameters for admin subscription listing',
  },
)

export type AdminGetSubscriptionsQuery = z.infer<
  typeof AdminGetSubscriptionsQuery
>

// ============= Request Bodies =============

/**
 * Admin create subscription request
 */
export const AdminCreateSubscriptionRequest = openapi(
  z.object({
    userId: UserId,
    planId: UUID,
    stripeCustomerId: z.string().optional(),
    trialEnd: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Admin create subscription for any user',
  },
)

export type AdminCreateSubscriptionRequest = z.infer<
  typeof AdminCreateSubscriptionRequest
>

/**
 * Admin update subscription request
 */
export const AdminUpdateSubscriptionRequest = openapi(
  z.object({
    planId: UUID.optional(),
    status: SubscriptionStatusSchema.optional(),
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    trialEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    cancelledAt: DateTime.optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    stripeSubscriptionId: z.string().optional(),
    stripeCustomerId: z.string().optional(),
  }),
  {
    description: 'Admin update subscription with extended options',
  },
)

export type AdminUpdateSubscriptionRequest = z.infer<
  typeof AdminUpdateSubscriptionRequest
>

// ============= Response Schemas =============

import { paginatedResponse } from '../../shared/responses.js'
import { SubscriptionWithPlan } from '../public/subscription.js'
import { SubscriptionPlan } from '../public/subscriptionPlan.js'

/**
 * Admin subscription response with additional fields
 */
export const AdminSubscriptionResponse = openapi(
  SubscriptionWithPlan.extend({
    deletedAt: DateTime.optional(),
    updatedBy: UserId.optional(),
    createdBy: UserId.optional(),
  }),
  {
    description: 'Admin subscription with extended metadata',
  },
)

export type AdminSubscriptionResponse = z.infer<
  typeof AdminSubscriptionResponse
>

/**
 * Admin subscription list response
 */
export const AdminGetSubscriptionsResponse = paginatedResponse(
  AdminSubscriptionResponse,
)

export type AdminGetSubscriptionsResponse = z.infer<
  typeof AdminGetSubscriptionsResponse
>

// ============= Plan Management =============

/**
 * Admin get plans query parameters
 */
export const AdminGetPlansQuery = openapi(
  SearchParams.extend({
    isActive: z.coerce.boolean().optional(),
    interval: BillingIntervalSchema.optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('name'),
  }),
  {
    description: 'Query parameters for admin plan listing',
  },
)

export type AdminGetPlansQuery = z.infer<typeof AdminGetPlansQuery>

/**
 * Admin create plan request
 */
export const AdminCreatePlanRequest = openapi(
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
    isActive: z.boolean().default(true),
  }),
  {
    description: 'Admin create subscription plan',
  },
)

export type AdminCreatePlanRequest = z.infer<typeof AdminCreatePlanRequest>

/**
 * Admin update plan request
 */
export const AdminUpdatePlanRequest = openapi(
  z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    trialPeriodDays: z.number().int().nonnegative().optional(),
  }),
  {
    description: 'Admin update subscription plan',
  },
)

export type AdminUpdatePlanRequest = z.infer<typeof AdminUpdatePlanRequest>

/**
 * Admin plan response
 */
export const AdminPlanResponse = openapi(
  SubscriptionPlan.extend({
    deletedAt: DateTime.optional(),
    updatedBy: UserId.optional(),
    createdBy: UserId.optional(),
    activeSubscriptionCount: z.number().int().nonnegative().optional(),
  }),
  {
    description: 'Admin plan with extended metadata',
  },
)

export type AdminPlanResponse = z.infer<typeof AdminPlanResponse>

/**
 * Admin plan list response
 */
export const AdminGetPlansResponse = paginatedResponse(AdminPlanResponse)

export type AdminGetPlansResponse = z.infer<typeof AdminGetPlansResponse>
