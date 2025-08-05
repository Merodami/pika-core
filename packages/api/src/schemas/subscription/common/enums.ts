import {
  BillingInterval,
  BulkAction,
  PlanSortBy,
  PlanType,
  SubscriptionEvent,
  SubscriptionNotificationType,
  SubscriptionSortBy,
  SubscriptionStatus,
  UsageType,
} from '@pika/types'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Subscription-specific enum schemas
 * Following the standardized pattern with Schema suffix
 */

// Subscription status schema
export const SubscriptionStatusSchema = openapi(
  createZodEnum(SubscriptionStatus),
  {
    description: 'Subscription status',
    example: SubscriptionStatus.ACTIVE,
  },
)

// Billing interval schema
export const BillingIntervalSchema = openapi(createZodEnum(BillingInterval), {
  description: 'Billing interval for subscriptions',
  example: BillingInterval.MONTH,
})

// Plan type schema
export const PlanTypeSchema = openapi(createZodEnum(PlanType), {
  description: 'Plan type category',
  example: PlanType.PREMIUM,
})

// Subscription sort by schema
export const SubscriptionSortBySchema = openapi(
  createZodEnum(SubscriptionSortBy),
  {
    description: 'Field to sort subscriptions by',
    example: SubscriptionSortBy.CREATED_AT,
  },
)

// Plan sort by schema
export const PlanSortBySchema = openapi(createZodEnum(PlanSortBy), {
  description: 'Field to sort plans by',
  example: PlanSortBy.NAME,
})

// Subscription event schema
export const SubscriptionEventSchema = openapi(
  createZodEnum(SubscriptionEvent),
  {
    description: 'Subscription event type for webhooks and notifications',
    example: SubscriptionEvent.CREATED,
  },
)

// Usage type schema
export const UsageTypeSchema = openapi(createZodEnum(UsageType), {
  description: 'Usage tracking type',
  example: UsageType.FEATURE_ACCESS,
})

// Subscription notification type schema
export const SubscriptionNotificationTypeSchema = openapi(
  createZodEnum(SubscriptionNotificationType),
  {
    description: 'Subscription notification type',
    example: SubscriptionNotificationType.CREATED,
  },
)

// Bulk action schema
export const BulkActionSchema = openapi(createZodEnum(BulkAction), {
  description: 'Bulk action type for admin operations',
  example: BulkAction.CANCEL,
})
