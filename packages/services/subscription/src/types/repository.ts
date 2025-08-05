// src/types/repository.ts

import type { SubscriptionStatus } from '@pika/types'

/**
 * Data types for repository operations
 */

export interface CreateSubscriptionData {
  // Required fields
  userId: string
  planId: string
  status: SubscriptionStatus

  // Stripe fields
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePaymentMethodId?: string

  // Billing period
  currentPeriodStart: Date
  currentPeriodEnd: Date

  // Optional fields
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, any>

  // System fields
  createdBy?: string
}

export interface UpdateSubscriptionData {
  // All fields optional for partial updates
  planId?: string
  status?: SubscriptionStatus

  // Stripe fields
  stripePaymentMethodId?: string

  // Billing period
  currentPeriodStart?: Date
  currentPeriodEnd?: Date

  // Optional fields
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  metadata?: Record<string, any>

  // System fields
  updatedBy?: string
}

export interface BulkUpdateSubscriptionData {
  status?: SubscriptionStatus
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, any>
}

export interface CreatePlanData {
  // Required fields
  name: string
  price: number
  currency: string
  intervalCount: number

  // Optional fields
  description?: string
  trialPeriodDays?: number
  features?: string[]
  metadata?: Record<string, any>
  isActive?: boolean

  // Stripe fields
  stripePriceId?: string
  stripeProductId?: string

  // System fields
  createdBy?: string
}

export interface UpdatePlanData {
  // All fields optional for partial updates
  name?: string
  description?: string
  features?: string[]
  isActive?: boolean
  metadata?: Record<string, any>

  // System fields
  updatedBy?: string
}
