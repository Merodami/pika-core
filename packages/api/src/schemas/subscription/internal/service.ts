import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  SubscriptionEventSchema,
  SubscriptionNotificationTypeSchema,
  SubscriptionStatusSchema,
  UsageTypeSchema,
} from '../common/enums.js'

/**
 * Internal subscription service schemas for service-to-service communication
 */

// ============= Subscription Webhook Events =============

/**
 * Process subscription webhook event
 */
export const ProcessSubscriptionWebhookRequest = openapi(
  z.object({
    event: z.object({
      type: SubscriptionEventSchema,
      data: z.object({
        object: z.any(), // Stripe event object
      }),
      created: z.number(),
    }),
    stripeSignature: z.string().optional(),
  }),
  {
    description: 'Process subscription webhook event',
  },
)

export type ProcessSubscriptionWebhookRequest = z.infer<
  typeof ProcessSubscriptionWebhookRequest
>

/**
 * Process webhook response
 */
export const ProcessSubscriptionWebhookResponse = openapi(
  z.object({
    processed: z.boolean(),
    subscriptionId: UUID.optional(),
    action: z.string().optional(),
  }),
  {
    description: 'Webhook processing result',
  },
)

export type ProcessSubscriptionWebhookResponse = z.infer<
  typeof ProcessSubscriptionWebhookResponse
>

// ============= Subscription Management =============

/**
 * Update subscription from payment service
 */
export const UpdateSubscriptionFromPaymentRequest = openapi(
  z.object({
    stripeSubscriptionId: z.string(),
    status: SubscriptionStatusSchema,
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    canceledAt: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Update subscription from payment service',
  },
)

export type UpdateSubscriptionFromPaymentRequest = z.infer<
  typeof UpdateSubscriptionFromPaymentRequest
>

/**
 * Update subscription response
 */
export const UpdateSubscriptionFromPaymentResponse = openapi(
  z.object({
    success: z.boolean(),
  }),
  {
    description: 'Update subscription result',
  },
)

export type UpdateSubscriptionFromPaymentResponse = z.infer<
  typeof UpdateSubscriptionFromPaymentResponse
>

/**
 * Check subscription access
 */
export const CheckSubscriptionAccessRequest = openapi(
  z.object({
    userId: UserId,
    feature: z.string().optional(),
    requiredPlan: z.string().optional(),
  }),
  {
    description: 'Check if user has subscription access',
  },
)

export type CheckSubscriptionAccessRequest = z.infer<
  typeof CheckSubscriptionAccessRequest
>

/**
 * Subscription access response
 */
export const SubscriptionAccessResponse = openapi(
  z.object({
    hasAccess: z.boolean(),
    subscription: z
      .object({
        id: UUID,
        planId: UUID,
        planName: z.string(),
        status: z.string(),
        features: z.array(z.string()),
      })
      .optional(),
    reason: z.string().optional(),
  }),
  {
    description: 'Subscription access check result',
  },
)

export type SubscriptionAccessResponse = z.infer<
  typeof SubscriptionAccessResponse
>

// ============= Subscription Queries =============

/**
 * Get subscription by Stripe ID
 */
export const GetSubscriptionByStripeIdRequest = openapi(
  z.object({
    stripeSubscriptionId: z.string(),
  }),
  {
    description: 'Get subscription by Stripe ID',
  },
)

export type GetSubscriptionByStripeIdRequest = z.infer<
  typeof GetSubscriptionByStripeIdRequest
>

/**
 * Get user subscriptions
 */
export const GetUserSubscriptionsRequest = openapi(
  z.object({
    userId: UserId,
    includeInactive: z.boolean().default(false),
  }),
  {
    description: 'Get user subscriptions',
  },
)

export type GetUserSubscriptionsRequest = z.infer<
  typeof GetUserSubscriptionsRequest
>

/**
 * Internal subscription data for arrays
 */
export const InternalSubscriptionListItem = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    planId: UUID,
    planName: z.string(),
    status: z.string(),
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean(),
    createdAt: DateTime,
  }),
  {
    description: 'Internal subscription list item',
  },
)

/**
 * Subscription list response with standard pagination
 */
export const SubscriptionListResponse = paginatedResponse(
  InternalSubscriptionListItem,
)

export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponse>

// ============= Subscription Notifications =============

/**
 * Send subscription notification
 */
export const SendSubscriptionNotificationRequest = openapi(
  z.object({
    userId: UserId,
    type: SubscriptionNotificationTypeSchema,
    subscriptionData: z.object({
      planName: z.string(),
      planType: z.string().optional(),
      price: z.string().optional(),
      interval: z.string().optional(),
      currentBalance: z.number().optional(),
      endDate: z.string().optional(),
      daysRemaining: z.number().optional(),
    }),
  }),
  {
    description: 'Send subscription-related notification',
  },
)

export type SendSubscriptionNotificationRequest = z.infer<
  typeof SendSubscriptionNotificationRequest
>

/**
 * Send notification response
 */
export const SendSubscriptionNotificationResponse = openapi(
  z.object({
    success: z.boolean(),
  }),
  {
    description: 'Notification send result',
  },
)

export type SendSubscriptionNotificationResponse = z.infer<
  typeof SendSubscriptionNotificationResponse
>

// ============= Path Parameters =============

/**
 * Stripe subscription ID parameter
 */
export const StripeSubscriptionIdParam = openapi(
  z.object({
    stripeSubscriptionId: z.string(),
  }),
  {
    description: 'Stripe subscription ID path parameter',
  },
)

export type StripeSubscriptionIdParam = z.infer<
  typeof StripeSubscriptionIdParam
>

/**
 * User ID parameter for subscription internal routes
 */
export const SubscriptionUserIdParam = openapi(
  z.object({
    id: UserId,
  }),
  {
    description: 'User ID path parameter for subscription routes',
  },
)

export type SubscriptionUserIdParam = z.infer<typeof SubscriptionUserIdParam>

/**
 * User ID parameter for /users/:userId/subscriptions route
 */
export const SubscriptionByUserIdParam = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'User ID path parameter for nested user subscriptions route',
  },
)

export type SubscriptionByUserIdParam = z.infer<
  typeof SubscriptionByUserIdParam
>

// ============= Missing Internal API Schemas =============

/**
 * Internal subscription data
 */
export const InternalSubscriptionData = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    stripeSubscriptionId: z.string(),
    planId: UUID,
    planName: z.string(),
    status: z.string(),
    currentPeriodStart: DateTime.optional(),
    currentPeriodEnd: DateTime.optional(),
    cancelAtPeriodEnd: z.boolean(),
    createdAt: DateTime,
    updatedAt: DateTime,
  }),
  {
    description: 'Internal subscription data',
  },
)

export type InternalSubscriptionData = z.infer<typeof InternalSubscriptionData>

/**
 * Check subscription request
 */
export const CheckSubscriptionRequest = CheckSubscriptionAccessRequest
export type CheckSubscriptionRequest = z.infer<typeof CheckSubscriptionRequest>

/**
 * Subscription check response
 */
export const SubscriptionCheckResponse = SubscriptionAccessResponse
export type SubscriptionCheckResponse = z.infer<
  typeof SubscriptionCheckResponse
>

/**
 * Process subscription usage request
 */
export const ProcessSubscriptionUsageRequest = openapi(
  z.object({
    userId: UserId,
    subscriptionId: UUID,
    usageType: UsageTypeSchema,
    amount: z.number().positive().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Process subscription usage',
  },
)

export type ProcessSubscriptionUsageRequest = z.infer<
  typeof ProcessSubscriptionUsageRequest
>

/**
 * Usage processing response
 */
export const UsageProcessingResponse = openapi(
  z.object({
    success: z.boolean(),
    usageRecorded: z.boolean(),
    message: z.string().optional(),
  }),
  {
    description: 'Usage processing result',
  },
)

export type UsageProcessingResponse = z.infer<typeof UsageProcessingResponse>

/**
 * Create Stripe subscription request
 */
export const CreateStripeSubscriptionRequest = openapi(
  z.object({
    userId: UserId,
    stripeSubscriptionId: z.string(),
    planId: UUID,
    status: z.string(),
    currentPeriodStart: DateTime,
    currentPeriodEnd: DateTime,
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  {
    description: 'Create subscription from Stripe',
  },
)

export type CreateStripeSubscriptionRequest = z.infer<
  typeof CreateStripeSubscriptionRequest
>

/**
 * Update Stripe subscription request
 */
export const UpdateStripeSubscriptionRequest =
  UpdateSubscriptionFromPaymentRequest
export type UpdateStripeSubscriptionRequest = z.infer<
  typeof UpdateStripeSubscriptionRequest
>

/**
 * Cancel Stripe subscription request
 */
export const CancelStripeSubscriptionRequest = openapi(
  z.object({
    stripeSubscriptionId: z.string(),
    cancelAtPeriodEnd: z.boolean().default(true),
    reason: z.string().optional(),
  }),
  {
    description: 'Cancel Stripe subscription',
  },
)

export type CancelStripeSubscriptionRequest = z.infer<
  typeof CancelStripeSubscriptionRequest
>

/**
 * Stripe subscription response
 */
export const StripeSubscriptionResponse = InternalSubscriptionData
export type StripeSubscriptionResponse = z.infer<
  typeof StripeSubscriptionResponse
>

/**
 * User subscriptions response
 */
export const UserSubscriptionsResponse = SubscriptionListResponse
export type UserSubscriptionsResponse = z.infer<
  typeof UserSubscriptionsResponse
>

/**
 * Subscription webhook event
 */
export const SubscriptionWebhookEvent = ProcessSubscriptionWebhookRequest
export type SubscriptionWebhookEvent = z.infer<typeof SubscriptionWebhookEvent>

/**
 * Process webhook response
 */
export const ProcessWebhookResponse = ProcessSubscriptionWebhookResponse
export type ProcessWebhookResponse = z.infer<typeof ProcessWebhookResponse>
