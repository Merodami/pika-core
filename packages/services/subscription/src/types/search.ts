// src/types/search.ts
import type { ParsedIncludes } from '@pika/types'
import type { SearchParams } from '@pika/types'
import type { SubscriptionStatus } from '@pika/types'

/**
 * Public search parameters
 */
export interface SubscriptionSearchParams extends SearchParams {
  // Filters
  planId?: string
  status?: SubscriptionStatus
  userId?: string
  cancelAtPeriodEnd?: boolean

  // Date ranges
  currentPeriodStartFrom?: Date
  currentPeriodStartTo?: Date
  currentPeriodEndFrom?: Date
  currentPeriodEndTo?: Date

  // Relations
  parsedIncludes?: ParsedIncludes
}

/**
 * Admin search parameters with extended filters
 */
export interface AdminSubscriptionSearchParams
  extends SubscriptionSearchParams {
  includeDeleted?: boolean
  includeCancelled?: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string

  // Additional date filters
  createdFromStart?: Date
  createdFromEnd?: Date
  cancelledFromStart?: Date
  cancelledFromEnd?: Date
}

/**
 * Internal search parameters for service-to-service
 */
export interface InternalSubscriptionSearchParams extends SearchParams {
  subscriptionIds?: string[]
  userIds?: string[]
  planIds?: string[]
  includeAll?: boolean
}

/**
 * Public search parameters for plans
 */
export interface PlanSearchParams extends SearchParams {
  // Filters
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  search?: string

  // Relations
  parsedIncludes?: ParsedIncludes
}

/**
 * Admin search parameters for plans with extended filters
 */
export interface AdminPlanSearchParams extends PlanSearchParams {
  includeDeleted?: boolean
  includeInactive?: boolean

  // Additional filters
  createdFromStart?: Date
  createdFromEnd?: Date
}

/**
 * Internal search parameters for plans
 */
export interface InternalPlanSearchParams extends SearchParams {
  planIds?: string[]
  includeAll?: boolean
}
