/**
 * Subscription-related enums
 */

/**
 * Subscription status values
 * Must match database and payment provider statuses
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incompleteExpired',
  PAST_DUE = 'pastDue',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

/**
 * Type definition for subscription status - use this for type annotations
 */
export type SubscriptionStatusType = `${SubscriptionStatus}`

/**
 * Billing interval for subscriptions
 */
export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Type definition for billing interval - use this for type annotations
 */
export type BillingIntervalType = `${BillingInterval}`

/**
 * Plan type categories
 */
export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial',
}

/**
 * Type definition for plan type - use this for type annotations
 */
export type PlanTypeType = `${PlanType}`

/**
 * Subscription sorting fields
 */
export enum SubscriptionSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  START_DATE = 'startDate',
  END_DATE = 'endDate',
  STATUS = 'status',
}

/**
 * Type definition for subscription sort by - use this for type annotations
 */
export type SubscriptionSortByType = `${SubscriptionSortBy}`

/**
 * Plan sorting fields
 */
export enum PlanSortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for plan sort by - use this for type annotations
 */
export type PlanSortByType = `${PlanSortBy}`

/**
 * Subscription event types for webhooks and notifications
 */
export enum SubscriptionEvent {
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  CUSTOMER_SUBSCRIPTION_TRIAL_WILL_END = 'customer.subscription.trial_will_end',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  CREATED = 'created',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'paymentFailed',
  CREDITS_ALLOCATED = 'creditsAllocated',
  RENEWAL_REMINDER = 'renewalReminder',
  TRIAL_ENDING = 'trialEnding',
}

/**
 * Type definition for subscription event - use this for type annotations
 */
export type SubscriptionEventType = `${SubscriptionEvent}`

/**
 * Usage tracking types
 */
export enum UsageType {
  FEATURE_ACCESS = 'featureAccess',
  CREDIT_DEDUCTION = 'creditDeduction',
}

/**
 * Type definition for usage type - use this for type annotations
 */
export type UsageTypeType = `${UsageType}`

/**
 * Subscription notification types
 */
export enum SubscriptionNotificationType {
  CREATED = 'created',
  CANCELLED = 'cancelled',
  PAYMENT_FAILED = 'paymentFailed',
  CREDITS_ALLOCATED = 'creditsAllocated',
  RENEWAL_REMINDER = 'renewalReminder',
  TRIAL_ENDING = 'trialEnding',
}

/**
 * Type definition for subscription notification type - use this for type annotations
 */
export type SubscriptionNotificationTypeType = `${SubscriptionNotificationType}`

/**
 * Bulk action types for admin operations
 */
export enum BulkAction {
  CANCEL = 'cancel',
  SUSPEND = 'suspend',
  REACTIVATE = 'reactivate',
}

/**
 * Type definition for bulk action - use this for type annotations
 */
export type BulkActionType = `${BulkAction}`
